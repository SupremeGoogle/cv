// Prompt for the automatic generation path.
//
// DeepInfra's /v1/openai/images/edits takes exactly ONE image file, but this
// task needs two: the identity reference and the target scene. So the browser
// glues them into a single side-by-side canvas (left = reference, right =
// scene) and the prompt below tells the model how to read that layout and to
// return ONLY the right-hand scene.
//
// The body of the instruction is the prompt from _lib/ai-studio-prompt.txt,
// which is tuned for Nano Banana and already handles the hard parts: re-drawing
// rather than pasting, relighting, contact shadows, hands.

export const WORKPLACE_PROMPT = `CRITICAL OUTPUT RULE, READ FIRST: the attached image is a two-panel WORKING SHEET, not a picture to edit. A thick black vertical bar splits it. Everything LEFT of that bar is a private identity reference that MUST NOT appear in your output in any form. Everything RIGHT of that bar is the only scene you may output.

Your output is a single photograph of the RIGHT-hand scene alone, cropped exactly at the black bar, with the same width-to-height proportions as that right panel. The output must contain NO black bar, NO left panel, NO portrait inset, NO second image, NO split screen, NO side-by-side, NO collage, NO border, and exactly ONE person. If your result still shows two panels, you have failed the task — re-frame to the right panel only.

The LEFT panel tells you what the man looks like. The RIGHT panel is the room he must appear in. Generate ONE brand-new photograph of that room with this man naturally present in it.

The LEFT panel is ONLY an identity reference — it tells you what the man looks like (face, hair, build, black t-shirt, watch). Do NOT copy, cut out, or paste pixels from it. Re-draw and re-photograph this exact same man from scratch so he naturally belongs in the new scene. The final face must be unmistakably the same real person — same face shape, eyes, eyebrows, nose, mouth, jaw, cheeks, skin tone, hairline, and age — but freshly rendered inside the scene, never a pasted cut-out.

The RIGHT panel is the target scene and the master reference for everything else: keep its room, camera angle, perspective, eye level, focal length, lighting direction, color temperature, shadows, and overall photographic look.

Place the man INTO that scene as if he was really there when the photo was taken:
- Match the scene's camera exactly: same perspective, lens look, depth of field, focus, film grain/noise, sharpness, and resolution. The man must share the SAME image quality and softness as the room — not crisper, not flatter, not higher-contrast.
- Relight the man completely with the scene's light: same direction, color, and intensity. Add correct cast shadows and contact shadows where his body, hands, and arms touch the chair, desk, floor, or table.
- Match his scale, pose, and eye level to the furniture and camera angle. If the scene already has a chair, sofa, stool, desk, or table, seat him on that existing furniture in a believable working pose. Do not import furniture or background from the left panel.
- Hands and arms must have a clear, purposeful position. Rest both forearms naturally on the desk surface, and place his hands ON the actual tools that exist in the scene: one hand resting on the mouse with fingers gently curved over it, the other hand resting on the keyboard or flat on the desk. No hands hovering in empty space, no ambiguous or twisted wrist angles, no hands pressed awkwardly against the desk edge. Each hand must have exactly five correctly shaped fingers with anatomically natural proportions.

Strictly avoid the "pasted sticker" look: no cut-out edges, no glow or halo around the man, no mismatched lighting or color, no floating, no double exposure, no flat overlay, no collage, no split screen, no two people, no text, labels, borders, or watermark. Avoid deformed hands, extra fingers, or fused fingers.

Output only one seamless, natural, photorealistic final photo of the right-hand scene.`;
