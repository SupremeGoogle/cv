// Rescues a single photo out of a two-panel answer.
//
// Nano Banana keeps handing back the working sheet instead of just the scene,
// and the side it puts the generated frame on is not stable: one run had the
// portrait on the left and the result on the right, the next had them swapped.
// Cropping by position therefore guesses wrong half the time.
//
// Both inputs are used as landmarks. A half that matches the PORTRAIT is the
// reference pasted back and goes. Otherwise a half that is an almost exact copy
// of the SCENE is the echo and goes. The scene alone is not enough: a correct
// generation shows the same room, so it resembles the scene as well.

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

/**
 * Structural distance between two thumbnails: 0 when they show the same thing,
 * ~1 when unrelated. Each is centred and scaled to unit variance first, so a
 * brighter or flatter copy of the same picture still scores near zero — raw
 * pixel differences were too brittle, since the model re-encodes and shifts
 * exposure on the panel it echoes back.
 */
const structuralDistance = (a: number[], b: number[]) => {
  const normalise = (v: number[]) => {
    const mean = v.reduce((s, x) => s + x, 0) / v.length;
    const sd = Math.sqrt(v.reduce((s, x) => s + (x - mean) ** 2, 0) / v.length) || 1;
    return v.map(x => (x - mean) / sd);
  };
  const x = normalise(a);
  const y = normalise(b);
  return 1 - x.reduce((s, v, i) => s + v * y[i], 0) / x.length;
};

// A half this close to a landmark is that landmark, not a fresh photograph.
const PORTRAIT_MATCH = 0.35;
const ECHO_MATCH = 0.05;
// ...and the other half has to be clearly further away, or the answer is a
// single photo whose two halves simply look alike.
const PORTRAIT_MARGIN = 0.25;
const ECHO_MARGIN = 0.06;

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
export const keepGeneratedHalf = (
  resultBase64: string,
  sceneBase64?: string,
  referenceBase64?: string,
): SplitOutcome => {
  const result = decode(resultBase64);
  if (!result) return { base64: resultBase64, action: 'untouched' };

  const scene = sceneBase64 ? decode(sceneBase64) : null;
  const reference = referenceBase64 ? decode(referenceBase64) : null;
  if (!scene && !reference) return { base64: resultBase64, action: 'untouched' };

  const half = Math.floor(result.width / 2);
  const left = thumbnail(result, 0, half);
  const right = thumbnail(result, result.width - half, half);

  const keepLeft = () => ({ base64: cropToJpeg(result, 0, half), action: 'kept-left' as const });
  const keepRight = () => ({ base64: cropToJpeg(result, result.width - half, half), action: 'kept-right' as const });

  // 1. One half is the portrait pasted back beside the work.
  //    The scene alone cannot catch this: a correct generation shows the same
  //    room as the scene, so it resembles the scene too, and the earlier rule
  //    threw away the good frame and kept the portrait.
  if (reference) {
    const ref = thumbnail(reference, 0, reference.width);
    const l = structuralDistance(left, ref);
    const r = structuralDistance(right, ref);
    if (Math.min(l, r) < PORTRAIT_MATCH && Math.abs(l - r) > PORTRAIT_MARGIN) {
      return l < r ? keepRight() : keepLeft();
    }
  }

  // 2. Otherwise one half is a near-exact echo of the scene. A real generation
  //    of that room still differs, because a person now fills part of it.
  if (scene) {
    const target = thumbnail(scene, 0, scene.width);
    const l = structuralDistance(left, target);
    const r = structuralDistance(right, target);
    if (Math.min(l, r) < ECHO_MATCH && Math.abs(l - r) > ECHO_MARGIN) {
      return l < r ? keepRight() : keepLeft();
    }
  }

  return { base64: resultBase64, action: 'untouched' };
};
