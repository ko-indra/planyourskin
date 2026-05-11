// Pure face-detection helpers extracted from the standalone skin-analyzer
// script.js. Operates on MediaPipe FaceLandmarker results and a sized canvas.

import type { FaceLandmarkerResult } from "@mediapipe/tasks-vision";

export const MIN_BRIGHTNESS = 60; // 0-255 average grayscale
export const MIN_FACE_WIDTH_RATIO = 0.7;
export const MIN_FACE_HEIGHT_RATIO = 0.38;
export const MAX_ROTATION_Y = 0.25; // yaw (radians)
export const MAX_ROTATION_X = 0.25; // pitch (radians)
export const MAX_CENTER_OFFSET = 0.15;

export type FaceMetrics = {
  boundingBox: { x: number; y: number; width: number; height: number };
  transformationMatrix: number[] | null;
  landmarks: FaceLandmarkerResult["faceLandmarks"][number];
};

export function getFaceMetrics(
  result: FaceLandmarkerResult,
  canvasW: number,
  canvasH: number
): FaceMetrics | null {
  if (!result.faceLandmarks || result.faceLandmarks.length === 0) return null;
  const landmarks = result.faceLandmarks[0];

  let minX = 1,
    minY = 1,
    maxX = 0,
    maxY = 0;
  for (const l of landmarks) {
    if (l.x < minX) minX = l.x;
    if (l.x > maxX) maxX = l.x;
    if (l.y < minY) minY = l.y;
    if (l.y > maxY) maxY = l.y;
  }

  const matrix =
    result.facialTransformationMatrixes && result.facialTransformationMatrixes[0]
      ? Array.from(result.facialTransformationMatrixes[0].data)
      : null;

  return {
    boundingBox: {
      x: minX * canvasW,
      y: minY * canvasH,
      width: (maxX - minX) * canvasW,
      height: (maxY - minY) * canvasH,
    },
    transformationMatrix: matrix,
    landmarks,
  };
}

// Sample brightness from a downscaled video frame. Cheap (~10ms per frame).
export function calculateBrightness(video: HTMLVideoElement): number {
  const offscreen = document.createElement("canvas");
  offscreen.width = 64;
  offscreen.height = 64;
  const ctx = offscreen.getContext("2d", { willReadFrequently: true });
  if (!ctx) return 0;
  ctx.drawImage(video, 0, 0, 64, 64);
  const { data } = ctx.getImageData(0, 0, 64, 64);
  let sum = 0;
  for (let i = 0; i < data.length; i += 4) {
    sum += (data[i] + data[i + 1] + data[i + 2]) / 3;
  }
  return Math.floor(sum / (64 * 64));
}

export type CheckResult = {
  brightness: number;
  lightingOk: boolean;
  fillOk: boolean;
  centeredOk: boolean;
  straightOk: boolean;
  allPassed: boolean;
};

export function checkConditions(
  metrics: FaceMetrics | null,
  brightness: number,
  canvasW: number,
  canvasH: number
): CheckResult {
  const lightingOk = brightness >= MIN_BRIGHTNESS;
  if (!metrics) {
    return {
      brightness,
      lightingOk,
      fillOk: false,
      centeredOk: false,
      straightOk: false,
      allPassed: false,
    };
  }
  const { boundingBox, transformationMatrix } = metrics;
  const wRatio = boundingBox.width / canvasW;
  const hRatio = boundingBox.height / canvasH;
  const cx = (boundingBox.x + boundingBox.width / 2) / canvasW;
  const cy = (boundingBox.y + boundingBox.height / 2) / canvasH;

  const fillOk = wRatio >= MIN_FACE_WIDTH_RATIO && hRatio >= MIN_FACE_HEIGHT_RATIO;
  const centeredOk =
    Math.abs(cx - 0.5) < MAX_CENTER_OFFSET && Math.abs(cy - 0.5) < MAX_CENTER_OFFSET;

  let straightOk = false;
  if (transformationMatrix) {
    const m = transformationMatrix;
    const yaw = Math.atan2(-m[8], Math.sqrt(m[9] * m[9] + m[10] * m[10]));
    const pitch = Math.atan2(m[9], m[10]);
    straightOk = Math.abs(yaw) < MAX_ROTATION_Y && Math.abs(pitch) < MAX_ROTATION_X;
  }

  return {
    brightness,
    lightingOk,
    fillOk,
    centeredOk,
    straightOk,
    allPassed: lightingOk && fillOk && centeredOk && straightOk,
  };
}

// Capture a mirrored snapshot, downscaled to max edge 1024px, JPEG quality 0.85.
// Returns a data URL ready to POST to /api/skin-analyzer.
export function captureSnapshot(video: HTMLVideoElement, maxEdge = 1024): string {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  const scale = Math.min(1, maxEdge / Math.max(vw, vh));
  const w = Math.round(vw * scale);
  const h = Math.round(vh * scale);

  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  if (!ctx) return "";
  // Mirror so preview matches selfie
  ctx.translate(w, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, w, h);
  return c.toDataURL("image/jpeg", 0.85);
}
