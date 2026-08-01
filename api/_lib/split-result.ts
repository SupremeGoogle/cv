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
// An answer this much wider than the photo it should reproduce is two panels,
// whatever its halves contain.
const DIPTYCH_ASPECT = 1.5;

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

  // 1. One half is the portrait handed straight back. Drop it and keep the work.
  if (reference) {
    const ref = thumbnail(reference, 0, reference.width);
    const l = structuralDistance(left, ref);
    const r = structuralDistance(right, ref);
    if (Math.min(l, r) < PORTRAIT_MATCH && Math.abs(l - r) > PORTRAIT_MARGIN) {
      return l < r ? keepRight() : keepLeft();
    }
  }

  if (!scene) return { base64: resultBase64, action: 'untouched' };

  const sceneThumb = thumbnail(scene, 0, scene.width);
  const sceneLeft = structuralDistance(left, sceneThumb);
  const sceneRight = structuralDistance(right, sceneThumb);

  // 2. Is this a diptych at all? Two signals, either is enough:
  //    - the answer is far wider than the photo it was asked to reproduce, or
  //    - one half is a near-exact echo of that photo.
  //    Shape alone used to be ignored, which is why the last run slipped
  //    through: neither half was an exact echo, because the model had drawn a
  //    different variation into each one.
  const resultAspect = result.width / result.height;
  const sceneAspect = scene.width / scene.height;
  const isDiptych =
    resultAspect > sceneAspect * DIPTYCH_ASPECT ||
    (Math.min(sceneLeft, sceneRight) < ECHO_MATCH && Math.abs(sceneLeft - sceneRight) > ECHO_MARGIN);

  if (!isDiptych) return { base64: resultBase64, action: 'untouched' };

  // 3. Keep the half that departs further from the scene: that is where the
  //    person was actually added. The other one is the room echoed back, with
  //    at most a hand in it.
  return sceneLeft > sceneRight ? keepLeft() : keepRight();
};
