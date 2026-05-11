"use client";
// Pure canvas-draw helpers for the dermatology scan overlay. Brand pink
// instead of cyan to match planyourskin visual identity.
import { FaceLandmarker } from "@mediapipe/tasks-vision";

type Pt = { x: number; y: number; z?: number };

const BRAND_RGB = "228, 145, 169"; // #E491A9
const BRAND_DARK_RGB = "187, 83, 82"; // #BB5352

export type ScanState = { lineY: number; direction: 1 | -1; time: number };

export function makeScanState(): ScanState {
  return { lineY: 0, direction: 1, time: 0 };
}

export function drawScanEffect(
  ctx: CanvasRenderingContext2D,
  landmarks: Pt[],
  canvasW: number,
  canvasH: number,
  state: ScanState
) {
  if (!landmarks || landmarks.length === 0) return;
  state.time += 0.025;

  let minX = 1, minY = 1, maxX = 0, maxY = 0;
  for (const l of landmarks) {
    if (l.x < minX) minX = l.x;
    if (l.x > maxX) maxX = l.x;
    if (l.y < minY) minY = l.y;
    if (l.y > maxY) maxY = l.y;
  }
  const faceLeft = minX * canvasW;
  const faceRight = maxX * canvasW;
  const faceTop = minY * canvasH;
  const faceBottom = maxY * canvasH;
  const faceW = faceRight - faceLeft;
  const faceH = faceBottom - faceTop;

  // 1. Tesselation mesh (dense)
  const tess = FaceLandmarker.FACE_LANDMARKS_TESSELATION;
  ctx.save();
  const baseAlpha = 0.3 + 0.1 * Math.sin(state.time * 2);
  ctx.strokeStyle = `rgba(${BRAND_RGB}, ${baseAlpha})`;
  ctx.lineWidth = 0.7;
  ctx.shadowColor = `rgba(${BRAND_RGB}, 0.25)`;
  ctx.shadowBlur = 3;
  ctx.beginPath();
  if (tess) {
    for (const conn of tess) {
      const p1 = landmarks[conn.start];
      const p2 = landmarks[conn.end];
      if (p1 && p2) {
        ctx.moveTo(p1.x * canvasW, p1.y * canvasH);
        ctx.lineTo(p2.x * canvasW, p2.y * canvasH);
      }
    }
  }
  ctx.stroke();
  ctx.restore();

  // 2. Brighter contours (face oval, eyes, lips, brows)
  const contourSets = [
    FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
    FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
    FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
    FaceLandmarker.FACE_LANDMARKS_LIPS,
    FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW,
    FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW,
  ];
  ctx.save();
  ctx.strokeStyle = `rgba(${BRAND_DARK_RGB}, ${0.55 + 0.15 * Math.sin(state.time * 2)})`;
  ctx.lineWidth = 1.2;
  ctx.shadowColor = `rgba(${BRAND_DARK_RGB}, 0.4)`;
  ctx.shadowBlur = 5;
  for (const conns of contourSets) {
    if (!conns) continue;
    ctx.beginPath();
    for (const conn of conns) {
      const p1 = landmarks[conn.start];
      const p2 = landmarks[conn.end];
      if (p1 && p2) {
        ctx.moveTo(p1.x * canvasW, p1.y * canvasH);
        ctx.lineTo(p2.x * canvasW, p2.y * canvasH);
      }
    }
    ctx.stroke();
  }
  ctx.restore();

  // 3. Scanning line sweep
  state.lineY += state.direction * 2;
  if (state.lineY > faceH) {
    state.lineY = faceH;
    state.direction = -1;
  }
  if (state.lineY < 0) {
    state.lineY = 0;
    state.direction = 1;
  }
  const lineYPos = faceTop + state.lineY;
  const grad = ctx.createLinearGradient(faceLeft - 20, lineYPos, faceRight + 20, lineYPos);
  grad.addColorStop(0, `rgba(${BRAND_RGB}, 0)`);
  grad.addColorStop(0.15, `rgba(${BRAND_RGB}, 0.6)`);
  grad.addColorStop(0.5, `rgba(${BRAND_DARK_RGB}, 0.9)`);
  grad.addColorStop(0.85, `rgba(${BRAND_RGB}, 0.6)`);
  grad.addColorStop(1, `rgba(${BRAND_RGB}, 0)`);
  ctx.save();
  ctx.strokeStyle = grad;
  ctx.lineWidth = 2;
  ctx.shadowColor = `rgba(${BRAND_DARK_RGB}, 0.7)`;
  ctx.shadowBlur = 15;
  ctx.beginPath();
  ctx.moveTo(faceLeft - 20, lineYPos);
  ctx.lineTo(faceRight + 20, lineYPos);
  ctx.stroke();

  // Trailing glow band
  const trailH = 32;
  const trailDir = state.direction > 0 ? -1 : 1;
  const trailGrad = ctx.createLinearGradient(0, lineYPos, 0, lineYPos + trailDir * trailH);
  trailGrad.addColorStop(0, `rgba(${BRAND_RGB}, 0.12)`);
  trailGrad.addColorStop(1, `rgba(${BRAND_RGB}, 0)`);
  ctx.fillStyle = trailGrad;
  if (trailDir < 0) {
    ctx.fillRect(faceLeft - 20, lineYPos - trailH, faceW + 40, trailH);
  } else {
    ctx.fillRect(faceLeft - 20, lineYPos, faceW + 40, trailH);
  }
  ctx.restore();

  // 4. Rounded border around face
  ctx.save();
  const pad = 30;
  const rx = faceLeft - pad;
  const ry = faceTop - pad;
  const rw = faceW + pad * 2;
  const rh = faceH + pad * 2;
  const r = 18;
  const borderAlpha = 0.35 + 0.15 * Math.sin(state.time * 1.5);
  ctx.strokeStyle = `rgba(${BRAND_RGB}, ${borderAlpha})`;
  ctx.lineWidth = 2;
  ctx.shadowColor = `rgba(${BRAND_RGB}, 0.4)`;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.moveTo(rx + r, ry);
  ctx.lineTo(rx + rw - r, ry);
  ctx.arcTo(rx + rw, ry, rx + rw, ry + r, r);
  ctx.lineTo(rx + rw, ry + rh - r);
  ctx.arcTo(rx + rw, ry + rh, rx + rw - r, ry + rh, r);
  ctx.lineTo(rx + r, ry + rh);
  ctx.arcTo(rx, ry + rh, rx, ry + rh - r, r);
  ctx.lineTo(rx, ry + r);
  ctx.arcTo(rx, ry, rx + r, ry, r);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}
