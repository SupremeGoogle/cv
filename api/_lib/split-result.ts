// Rescues a single photo out of a two-panel answer.
//
// Nano Banana keeps handing back the working sheet instead of just the scene,
// and the side it puts the generated frame on is not stable: one run had the
// portrait on the left and the result on the right, the next had them swapped.
// Cropping by position therefore guesses wrong half the time.
//
// The reliable signal is the scene we sent: whichever half of the answer looks
// like that input is the copy, and the other half is the generation. So both
// halves are compared against the original and the matching one is dropped.

import jpeg from 'jpeg-js';

type Decoded = { width: number; height: number; data: Buffer | Uint8Array };

const THUMB = 24; // 24x24 grayscale is plenty to tell "same room" from "not"

const decode = (base64: string): Decoded | null => {
  try {
    return jpeg.decode(Buffer.from(base64, 'base64'), { useTArray: true }) as Decoded;
  } catch {
    return null;
  }
};

/** Average brightness over a THUMB x THUMB grid sampled from a sub-rectangle. */
const thumbnail = (img: Decoded, x0: number, width: number): number[] => {
  const out: number[] = [];
  for (let ty = 0; ty < THUMB; ty++) {
    for (let tx = 0; tx < THUMB; tx++) {
      const sx = Math.min(img.width - 1, Math.floor(x0 + ((tx + 0.5) / THUMB) * width));
      const sy = Math.min(img.height - 1, Math.floor(((ty + 0.5) / THUMB) * img.height));
      const i = (sy * img.width + sx) * 4;
      // Rec. 601 luma — good enough, and cheap.
      out.push(0.299 * img.data[i] + 0.587 * img.data[i + 1] + 0.114 * img.data[i + 2]);
    }
  }
  return out;
};

const meanAbsDiff = (a: number[], b: number[]) => {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += Math.abs(a[i] - b[i]);
  return sum / a.length;
};

const cropToJpeg = (img: Decoded, x0: number, width: number): string => {
  const w = Math.max(1, Math.round(width));
  const h = img.height;
  const out = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const src = (y * img.width + Math.min(img.width - 1, x0 + x)) * 4;
      const dst = (y * w + x) * 4;
      out[dst] = img.data[src];
      out[dst + 1] = img.data[src + 1];
      out[dst + 2] = img.data[src + 2];
      out[dst + 3] = 255;
    }
  }
  const encoded = jpeg.encode({ data: out as any, width: w, height: h }, 92);
  return Buffer.from(encoded.data).toString('base64');
};

export type SplitOutcome = {
  base64: string;
  /** What happened, for the log and the Telegram caption. */
  action: 'untouched' | 'kept-left' | 'kept-right' | 'undecided';
};

/**
 * If `resultBase64` looks like a side-by-side sheet, return only the generated
 * half. Otherwise return it unchanged. Never throws — a failure here must not
 * cost the visitor their photo.
 */
export const keepGeneratedHalf = (resultBase64: string, sceneBase64?: string): SplitOutcome => {
  const result = decode(resultBase64);
  if (!result) return { base64: resultBase64, action: 'untouched' };

  const scene = sceneBase64 ? decode(sceneBase64) : null;
  const half = Math.floor(result.width / 2);

  if (!scene) {
    // Nothing to compare against. Only a very wide answer is worth guessing at,
    // and the sheet puts the scene on the right.
    const resultAspect = result.width / result.height;
    return resultAspect > 1.7
      ? { base64: cropToJpeg(result, result.width - half, half), action: 'kept-right' }
      : { base64: resultBase64, action: 'untouched' };
  }

  // Aspect ratio is not a reliable tell. When both panels show the same room the
  // sheet reads as one wide photograph, and a 1.5 answer to a 1.33 scene slips
  // under any sensible width threshold — that is exactly the case that shipped
  // a two-panel photo to the visitor. Decide on content instead: if one half is
  // near-identical to the scene we sent and the other clearly is not, the answer
  // is a sheet no matter its proportions.
  const sceneThumb = thumbnail(scene, 0, scene.width);
  const leftDiff = meanAbsDiff(thumbnail(result, 0, half), sceneThumb);
  const rightDiff = meanAbsDiff(thumbnail(result, result.width - half, half), sceneThumb);

  const echoed = Math.min(leftDiff, rightDiff);
  const generated = Math.max(leftDiff, rightDiff);

  // One half is a copy of the input, the other is not. Both thresholds must hold
  // so a genuine single photo — where both halves differ from the scene by a
  // similar amount — is never cut in two.
  const isSheet = echoed < 8 && generated > echoed * 2.5 && generated - echoed > 6;
  if (!isSheet) {
    return { base64: resultBase64, action: echoed < 8 || generated - echoed > 6 ? 'undecided' : 'untouched' };
  }

  return leftDiff > rightDiff
    ? { base64: cropToJpeg(result, 0, half), action: 'kept-left' }
    : { base64: cropToJpeg(result, result.width - half, half), action: 'kept-right' };
};
