"use client";
import { useEffect, useRef, useState } from "react";
import type {
  FaceLandmarker as FaceLandmarkerType,
  FaceLandmarkerResult,
} from "@mediapipe/tasks-vision";

type Props = {
  // Receives two data URLs: cleanUrl (no mesh, for AI) + displayUrl (mesh overlaid, for result page).
  onCapture: (cleanUrl: string, displayUrl: string) => void;
  onCameraError: (reason: string) => void;
};

// Thresholds — port of script.js
const MIN_BRIGHTNESS = 60;
const MIN_FACE_WIDTH_RATIO = 0.55;
const MIN_FACE_HEIGHT_RATIO = 0.35;
const MAX_ROTATION_Y = 0.25;
const MAX_ROTATION_X = 0.25;
const MAX_CENTER_OFFSET = 0.18;
const CONTAINER_ASPECT = 3 / 4;

export default function CameraScreen({ onCapture, onCameraError }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const faceLandmarkerRef = useRef<FaceLandmarkerType | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);
  const lastLandmarksRef = useRef<FaceLandmarkerResult["faceLandmarks"][number] | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const readyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scanStateRef = useRef({ lineY: 0, direction: 1 as 1 | -1, time: 0 });
  const isCapturingRef = useRef(false);
  const isSuccessRef = useRef(false);
  const isReadyRef = useRef(false);

  const [statusTitle, setStatusTitle] = useState<string>("Memuat AI...");
  const [reqLighting, setReqLighting] = useState<{ met: boolean; text: string }>({
    met: false,
    text: "☀️ Cahaya",
  });
  const [reqFill, setReqFill] = useState<{ met: boolean; text: string }>({
    met: false,
    text: "📱 Posisi",
  });
  const [reqStraight, setReqStraight] = useState<{ met: boolean; text: string }>({
    met: false,
    text: "👤 Lurus",
  });
  const [aligned, setAligned] = useState(false);
  const [readyShown, setReadyShown] = useState(false);
  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const tasksVision = await import("@mediapipe/tasks-vision");
        const { FaceLandmarker, FilesetResolver } = tasksVision;
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm"
        );
        if (cancelled) return;
        faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "GPU",
          },
          outputFaceBlendshapes: true,
          outputFacialTransformationMatrixes: true,
          runningMode: "VIDEO",
          numFaces: 1,
        });
        if (cancelled) return;

        if (!navigator.mediaDevices?.getUserMedia) {
          onCameraError("Kamera tidak tersedia");
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
          },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        setStatusTitle("Posisikan wajah Anda");
        rafRef.current = requestAnimationFrame(predictWebcam);
      } catch (e) {
        const err = e as Error & { name?: string };
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          onCameraError("Izin kamera diperlukan");
        } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
          onCameraError("Kamera tidak terdeteksi");
        } else {
          onCameraError(err.message || "Gagal mengaktifkan kamera");
        }
      }
    }

    init();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (readyTimeoutRef.current) clearTimeout(readyTimeoutRef.current);
      const stream = videoRef.current?.srcObject as MediaStream | null;
      stream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function calculateBrightness(video: HTMLVideoElement): number {
    const off = document.createElement("canvas");
    off.width = 64;
    off.height = 64;
    const c = off.getContext("2d", { willReadFrequently: true });
    if (!c) return 0;
    c.drawImage(video, 0, 0, 64, 64);
    const { data } = c.getImageData(0, 0, 64, 64);
    let sum = 0;
    for (let i = 0; i < data.length; i += 4) sum += (data[i] + data[i + 1] + data[i + 2]) / 3;
    return Math.floor(sum / (64 * 64));
  }

  function getFaceMetrics(result: FaceLandmarkerResult, canvasW: number, canvasH: number) {
    if (!result.faceLandmarks || result.faceLandmarks.length === 0) return null;
    const landmarks = result.faceLandmarks[0];
    let minX = 1, minY = 1, maxX = 0, maxY = 0;
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

  type Metrics = NonNullable<ReturnType<typeof getFaceMetrics>>;

  function checkConditions(
    metrics: Metrics | null,
    brightness: number,
    canvasW: number,
    canvasH: number
  ): boolean {
    let allPassed = true;

    if (brightness >= MIN_BRIGHTNESS) {
      setReqLighting({ met: true, text: "☀️ Cahaya Bagus" });
    } else {
      setReqLighting({ met: false, text: "🌑 Tambah Cahaya" });
      allPassed = false;
    }

    if (!metrics) {
      setReqFill({ met: false, text: "📱 Wajah?" });
      setReqStraight({ met: false, text: "👤 Lurus" });
      setStatusTitle("Tampilkan wajah Anda");
      return false;
    }

    const { boundingBox, transformationMatrix } = metrics;
    const videoAspect = canvasW / canvasH;
    let visW: number, visH: number;
    if (videoAspect > CONTAINER_ASPECT) {
      visH = canvasH;
      visW = visH * CONTAINER_ASPECT;
    } else {
      visW = canvasW;
      visH = visW / CONTAINER_ASPECT;
    }
    const faceWR = boundingBox.width / visW;
    const faceHR = boundingBox.height / visH;
    const faceCX = (boundingBox.x + boundingBox.width / 2) / canvasW;
    const faceCY = (boundingBox.y + boundingBox.height / 2) / canvasH;
    const offX = Math.abs(faceCX - 0.5);
    const offY = Math.abs(faceCY - 0.5);
    const isCentered = offX < MAX_CENTER_OFFSET && offY < MAX_CENTER_OFFSET;
    const isBigEnough = faceWR >= MIN_FACE_WIDTH_RATIO && faceHR >= MIN_FACE_HEIGHT_RATIO;

    if (isBigEnough && isCentered) {
      setReqFill({ met: true, text: "📱 Posisi Pas" });
    } else if (!isBigEnough) {
      setReqFill({ met: false, text: "📱 Mendekat" });
      allPassed = false;
    } else {
      setReqFill({ met: false, text: "📱 Ke Tengah" });
      allPassed = false;
    }

    let isStraight = false;
    if (transformationMatrix) {
      const m = transformationMatrix;
      const yaw = Math.atan2(-m[8], Math.sqrt(m[9] * m[9] + m[10] * m[10]));
      const pitch = Math.atan2(m[9], m[10]);
      isStraight = Math.abs(yaw) < MAX_ROTATION_Y && Math.abs(pitch) < MAX_ROTATION_X;
    }
    if (isStraight) {
      setReqStraight({ met: true, text: "👤 Lurus ✓" });
    } else {
      setReqStraight({ met: false, text: "👤 Lurus" });
      allPassed = false;
    }

    return allPassed;
  }

  type Pt = { x: number; y: number };

  function drawScanEffect(
    ctx: CanvasRenderingContext2D,
    landmarks: Pt[],
    w: number,
    h: number,
    FL: typeof FaceLandmarkerType
  ) {
    const state = scanStateRef.current;
    state.time += 0.025;

    let minX = 1, minY = 1, maxX = 0, maxY = 0;
    for (const l of landmarks) {
      if (l.x < minX) minX = l.x;
      if (l.x > maxX) maxX = l.x;
      if (l.y < minY) minY = l.y;
      if (l.y > maxY) maxY = l.y;
    }
    const fL = minX * w, fR = maxX * w, fT = minY * h, fB = maxY * h;
    const fW = fR - fL, fH = fB - fT;

    // Tesselation
    ctx.save();
    const baseAlpha = 0.3 + 0.08 * Math.sin(state.time * 2);
    ctx.strokeStyle = `rgba(255,255,255,${baseAlpha})`;
    ctx.lineWidth = 0.6;
    ctx.shadowColor = "rgba(168,138,224,0.4)";
    ctx.shadowBlur = 3;
    ctx.beginPath();
    const tess = FL.FACE_LANDMARKS_TESSELATION;
    if (tess) {
      for (const conn of tess) {
        const p1 = landmarks[conn.start], p2 = landmarks[conn.end];
        if (p1 && p2) {
          ctx.moveTo(p1.x * w, p1.y * h);
          ctx.lineTo(p2.x * w, p2.y * h);
        }
      }
    }
    ctx.stroke();
    ctx.restore();

    // Contours
    const contourSets = [
      FL.FACE_LANDMARKS_FACE_OVAL,
      FL.FACE_LANDMARKS_LEFT_EYE,
      FL.FACE_LANDMARKS_RIGHT_EYE,
      FL.FACE_LANDMARKS_LIPS,
      FL.FACE_LANDMARKS_LEFT_EYEBROW,
      FL.FACE_LANDMARKS_RIGHT_EYEBROW,
    ];
    ctx.save();
    ctx.strokeStyle = `rgba(255,255,255,${0.7 + 0.15 * Math.sin(state.time * 2)})`;
    ctx.lineWidth = 1.1;
    ctx.shadowColor = "rgba(124,93,211,0.55)";
    ctx.shadowBlur = 8;
    for (const conns of contourSets) {
      if (!conns) continue;
      ctx.beginPath();
      for (const conn of conns) {
        const p1 = landmarks[conn.start], p2 = landmarks[conn.end];
        if (p1 && p2) {
          ctx.moveTo(p1.x * w, p1.y * h);
          ctx.lineTo(p2.x * w, p2.y * h);
        }
      }
      ctx.stroke();
    }
    ctx.restore();

    // Scanning line
    state.lineY += state.direction * 1.8;
    if (state.lineY > fH) { state.lineY = fH; state.direction = -1; }
    if (state.lineY < 0) { state.lineY = 0; state.direction = 1; }
    const lineY = fT + state.lineY;
    const grad = ctx.createLinearGradient(fL - 20, lineY, fR + 20, lineY);
    grad.addColorStop(0, "rgba(247,168,192,0)");
    grad.addColorStop(0.15, "rgba(247,168,192,0.55)");
    grad.addColorStop(0.5, "rgba(255,255,255,0.9)");
    grad.addColorStop(0.85, "rgba(168,138,224,0.55)");
    grad.addColorStop(1, "rgba(168,138,224,0)");
    ctx.save();
    ctx.strokeStyle = grad;
    ctx.lineWidth = 2;
    ctx.shadowColor = "rgba(255,255,255,0.8)";
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.moveTo(fL - 20, lineY);
    ctx.lineTo(fR + 20, lineY);
    ctx.stroke();

    // Trail
    const trailH = 36;
    const trailDir = state.direction > 0 ? -1 : 1;
    const trailGrad = ctx.createLinearGradient(0, lineY, 0, lineY + trailDir * trailH);
    trailGrad.addColorStop(0, "rgba(255,255,255,0.10)");
    trailGrad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = trailGrad;
    if (trailDir < 0) ctx.fillRect(fL - 20, lineY - trailH, fW + 40, trailH);
    else ctx.fillRect(fL - 20, lineY, fW + 40, trailH);
    ctx.restore();
  }

  function drawStaticMesh(
    ctx: CanvasRenderingContext2D,
    landmarks: Pt[],
    w: number,
    h: number,
    FL: typeof FaceLandmarkerType
  ) {
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.32)";
    ctx.lineWidth = 0.6;
    ctx.shadowColor = "rgba(168,138,224,0.45)";
    ctx.shadowBlur = 3;
    ctx.beginPath();
    const tess = FL.FACE_LANDMARKS_TESSELATION;
    if (tess) {
      for (const conn of tess) {
        const p1 = landmarks[conn.start], p2 = landmarks[conn.end];
        if (p1 && p2) {
          ctx.moveTo(p1.x * w, p1.y * h);
          ctx.lineTo(p2.x * w, p2.y * h);
        }
      }
    }
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.78)";
    ctx.lineWidth = 1.1;
    ctx.shadowColor = "rgba(124,93,211,0.55)";
    ctx.shadowBlur = 8;
    const contourSets = [
      FL.FACE_LANDMARKS_FACE_OVAL,
      FL.FACE_LANDMARKS_LEFT_EYE,
      FL.FACE_LANDMARKS_RIGHT_EYE,
      FL.FACE_LANDMARKS_LIPS,
      FL.FACE_LANDMARKS_LEFT_EYEBROW,
      FL.FACE_LANDMARKS_RIGHT_EYEBROW,
    ];
    for (const conns of contourSets) {
      if (!conns) continue;
      ctx.beginPath();
      for (const conn of conns) {
        const p1 = landmarks[conn.start], p2 = landmarks[conn.end];
        if (p1 && p2) {
          ctx.moveTo(p1.x * w, p1.y * h);
          ctx.lineTo(p2.x * w, p2.y * h);
        }
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  function startCountdown() {
    if (countdownIntervalRef.current) return;
    isReadyRef.current = false;
    setReadyShown(false);
    let val = 3;
    setCountdownValue(val);
    countdownIntervalRef.current = setInterval(() => {
      val -= 1;
      if (val > 0) {
        setCountdownValue(val);
      } else if (val === 0) {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
        setCountdownValue(null);
        captureImage();
      }
    }, 1000);
  }

  function cancelCountdown() {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setCountdownValue(null);
  }

  function captureImage() {
    if (isCapturingRef.current) return;
    isCapturingRef.current = true;
    setStatusTitle("Mengambil foto...");
    setAnalyzing(true);

    const video = videoRef.current;
    if (!video) return;

    // Flash effect
    const flash = document.createElement("div");
    flash.className = "flash";
    wrapperRef.current?.appendChild(flash);
    setTimeout(() => flash.remove(), 700);

    const snap = document.createElement("canvas");
    snap.width = video.videoWidth;
    snap.height = video.videoHeight;
    const sCtx = snap.getContext("2d");
    if (!sCtx) return;
    sCtx.translate(snap.width, 0);
    sCtx.scale(-1, 1);
    sCtx.drawImage(video, 0, 0, snap.width, snap.height);
    const cleanUrl = snap.toDataURL("image/png");

    // Composite mesh on top
    sCtx.setTransform(1, 0, 0, 1, 0, 0);
    if (lastLandmarksRef.current) {
      import("@mediapipe/tasks-vision").then(({ FaceLandmarker }) => {
        const mirrored = lastLandmarksRef.current!.map((l: Pt) => ({ x: 1 - l.x, y: l.y }));
        drawStaticMesh(sCtx, mirrored, snap.width, snap.height, FaceLandmarker);
        const displayUrl = snap.toDataURL("image/png");
        isSuccessRef.current = true;

        // Stop stream
        const stream = video.srcObject as MediaStream | null;
        stream?.getTracks().forEach((t) => t.stop());
        if (rafRef.current) cancelAnimationFrame(rafRef.current);

        onCapture(cleanUrl, displayUrl);
      });
    } else {
      isSuccessRef.current = true;
      const stream = video.srcObject as MediaStream | null;
      stream?.getTracks().forEach((t) => t.stop());
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      onCapture(cleanUrl, cleanUrl);
    }
  }

  function predictWebcam() {
    if (isSuccessRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const landmarker = faceLandmarkerRef.current;
    if (!video || !canvas || !landmarker || video.videoWidth === 0) {
      rafRef.current = requestAnimationFrame(predictWebcam);
      return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      rafRef.current = requestAnimationFrame(predictWebcam);
      return;
    }

    const now = performance.now();
    if (lastVideoTimeRef.current !== video.currentTime) {
      lastVideoTimeRef.current = video.currentTime;
      const result = landmarker.detectForVideo(video, now);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const metrics = getFaceMetrics(result, canvas.width, canvas.height);
      if (metrics) {
        lastLandmarksRef.current = metrics.landmarks;
        // Use require-style direct ref to class for static lookup tables
        import("@mediapipe/tasks-vision").then(({ FaceLandmarker }) => {
          drawScanEffect(ctx, metrics.landmarks, canvas.width, canvas.height, FaceLandmarker);
        });
      }
      const brightness = calculateBrightness(video);
      const ok = checkConditions(metrics, brightness, canvas.width, canvas.height);

      if (ok && !isCapturingRef.current && !countdownIntervalRef.current && !readyTimeoutRef.current) {
        setStatusTitle("Sempurna! Tahan posisi...");
        setAligned(true);
        isReadyRef.current = true;
        setReadyShown(true);
        readyTimeoutRef.current = setTimeout(() => {
          readyTimeoutRef.current = null;
          if (isReadyRef.current) startCountdown();
        }, 1000);
      } else if (!ok) {
        setAligned(false);
        if (!isCapturingRef.current && countdownIntervalRef.current) cancelCountdown();
        if (readyTimeoutRef.current) {
          clearTimeout(readyTimeoutRef.current);
          readyTimeoutRef.current = null;
          isReadyRef.current = false;
          setReadyShown(false);
        }
        if (metrics) setStatusTitle("Sesuaikan posisi");
      }
    }

    rafRef.current = requestAnimationFrame(predictWebcam);
  }

  return (
    <section className="screen camera-screen">
      <header className="brand-pill">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/skin-analyzer/assets/logo-plan-your-skin.png"
          alt="Plan Your Skin"
          className="brand-logo-img"
        />
      </header>

      <div id="reqBar" className="req-bar">
        <span className={`req-chip${reqLighting.met ? " met" : ""}`}>{reqLighting.text}</span>
        <span className={`req-chip${reqFill.met ? " met" : ""}`}>{reqFill.text}</span>
        <span className={`req-chip${reqStraight.met ? " met" : ""}`}>{reqStraight.text}</span>
      </div>

      <div className="scan-label">Skin Analyzing</div>

      <div ref={wrapperRef} className="camera-wrapper">
        <video ref={videoRef} autoPlay playsInline muted />
        <canvas ref={canvasRef} id="outputCanvas" />

        <div className="overlay-elements">
          <div className="status-pill">
            <p>{statusTitle}</p>
          </div>

          <div className="floating-icons">
            <div className="float-icon float-sun" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
              </svg>
            </div>
            <div className="float-icon float-drop" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2.5C8.5 7 6 10.5 6 14a6 6 0 0012 0c0-3.5-2.5-7-6-11.5z" />
              </svg>
            </div>
          </div>

          <div className={`face-guide${aligned ? " aligned" : ""}`}>
            <div className="corner top-left" />
            <div className="corner top-right" />
            <div className="corner bottom-left" />
            <div className="corner bottom-right" />
          </div>

          <div className={`ready-overlay${readyShown ? "" : " hidden"}`}>
            <div className="ready-circle">
              <svg className="ready-check" viewBox="0 0 52 52">
                <circle className="ready-check-circle" cx="26" cy="26" r="24" fill="none" />
                <path className="ready-check-path" fill="none" d="M14 27l7 7 16-16" />
              </svg>
            </div>
            <p className="ready-text">Posisi sempurna</p>
          </div>

          <div className={`countdown-container${countdownValue === null ? " hidden" : ""}`}>
            <div className="ring" />
            <div className="number">{countdownValue ?? 3}</div>
          </div>
        </div>
      </div>

      <div className={`analyzing-overlay${analyzing ? "" : " hidden"}`}>
        <div className="analyzing-content">
          <div className="analyzing-rings">
            <div className="analyzing-ring r1" />
            <div className="analyzing-ring r2" />
            <div className="analyzing-ring r3" />
            <div className="analyzing-orb" />
          </div>
          <h2>
            <em>Menganalisis</em> kulit Anda
          </h2>
          <p>AI sedang mendeteksi 5 parameter kulit secara seksama...</p>
        </div>
      </div>
    </section>
  );
}
