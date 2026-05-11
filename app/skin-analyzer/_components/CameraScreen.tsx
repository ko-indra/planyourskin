"use client";
import { useEffect, useRef, useState } from "react";
import type { FaceLandmarker } from "@mediapipe/tasks-vision";
import {
  calculateBrightness,
  captureSnapshot,
  checkConditions,
  getFaceMetrics,
} from "../_lib/face-detection";
import { drawScanEffect, makeScanState } from "./FaceMeshOverlay";

type Props = {
  onCapture: (imageDataUrl: string) => void;
  onCameraError: (reason: string) => void;
};

type Status = {
  title: string;
  message: string;
  ok: boolean;
};

const NO_FACE_TIMEOUT_MS = 30000;

export default function CameraScreen({ onCapture, onCameraError }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);
  const scanStateRef = useRef(makeScanState());
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const readyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFaceSeenRef = useRef<number>(Date.now());
  const isReadyRef = useRef<boolean>(false);

  const [status, setStatus] = useState<Status>({
    title: "Memuat AI...",
    message: "Menginisialisasi model deteksi wajah",
    ok: false,
  });
  const [requirements, setRequirements] = useState({
    lighting: false,
    fill: false,
    straight: false,
  });
  const [reqLabels, setReqLabels] = useState({
    lighting: "Pencahayaan",
    fill: "Posisi Wajah",
    straight: "Wajah Lurus",
  });
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // Init MediaPipe + camera
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const { FaceLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
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

        // Start camera
        if (!navigator.mediaDevices?.getUserMedia) {
          onCameraError("Kamera tidak tersedia di perangkat ini");
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
        setStatus({ title: "Posisikan Wajah", message: "Pastikan wajah berada di tengah", ok: false });
        rafRef.current = requestAnimationFrame(predictWebcam);
      } catch (e) {
        const err = e as Error & { name?: string };
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          onCameraError("Izin kamera ditolak");
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
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (readyTimeoutRef.current) clearTimeout(readyTimeoutRef.current);
      const stream = videoRef.current?.srcObject as MediaStream | null;
      stream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startCountdown() {
    if (countdownRef.current) return;
    setCountdown(3);
    let value = 3;
    countdownRef.current = setInterval(() => {
      value -= 1;
      if (value <= 0) {
        clearInterval(countdownRef.current!);
        countdownRef.current = null;
        setCountdown(null);
        doCapture();
      } else {
        setCountdown(value);
      }
    }, 1000);
  }

  function cancelCountdown() {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
      setCountdown(null);
    }
    if (readyTimeoutRef.current) {
      clearTimeout(readyTimeoutRef.current);
      readyTimeoutRef.current = null;
    }
    isReadyRef.current = false;
  }

  function doCapture() {
    if (isCapturing) return;
    setIsCapturing(true);
    const video = videoRef.current;
    if (!video) return;
    const dataUrl = captureSnapshot(video);
    // Stop stream
    const stream = video.srcObject as MediaStream | null;
    stream?.getTracks().forEach((t) => t.stop());
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    onCapture(dataUrl);
  }

  function predictWebcam() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const landmarker = faceLandmarkerRef.current;
    if (!video || !canvas || !landmarker) {
      rafRef.current = requestAnimationFrame(predictWebcam);
      return;
    }

    if (video.videoWidth === 0) {
      rafRef.current = requestAnimationFrame(predictWebcam);
      return;
    }

    if (canvas.width !== video.videoWidth) canvas.width = video.videoWidth;
    if (canvas.height !== video.videoHeight) canvas.height = video.videoHeight;

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
      const brightness = calculateBrightness(video);
      const check = checkConditions(metrics, brightness, canvas.width, canvas.height);

      if (metrics) {
        lastFaceSeenRef.current = Date.now();
        drawScanEffect(ctx, metrics.landmarks, canvas.width, canvas.height, scanStateRef.current);
      } else if (Date.now() - lastFaceSeenRef.current > NO_FACE_TIMEOUT_MS) {
        // Stuck without face for too long — fall through, user can use upload
      }

      // Update UI state
      setRequirements({
        lighting: check.lightingOk,
        fill: check.fillOk && check.centeredOk,
        straight: check.straightOk,
      });
      setReqLabels({
        lighting: check.lightingOk ? "☀️ Pencahayaan Bagus" : "🌑 Kurang Cahaya",
        fill: !metrics
          ? "📱 Wajah Tidak Terdeteksi"
          : !check.fillOk
          ? "📱 Mendekat ke Kamera"
          : !check.centeredOk
          ? "📱 Posisikan di Tengah"
          : "📱 Posisi Pas ✓",
        straight: check.straightOk ? "👤 Wajah Lurus ✓" : "👤 Luruskan Wajah",
      });

      if (check.allPassed && !isCapturing && !countdownRef.current && !readyTimeoutRef.current) {
        isReadyRef.current = true;
        setStatus({ title: "Sempurna!", message: "Tahan posisi…", ok: true });
        readyTimeoutRef.current = setTimeout(() => {
          if (isReadyRef.current) {
            readyTimeoutRef.current = null;
            startCountdown();
          }
        }, 1000);
      } else if (!check.allPassed) {
        cancelCountdown();
        if (!metrics) {
          setStatus({ title: "Tidak ada wajah", message: "Tampilkan wajah ke layar", ok: false });
        } else {
          setStatus({ title: "Sesuaikan Posisi", message: "Pastikan wajah lurus, cukup cahaya, dan dekat", ok: false });
        }
      }
    }

    rafRef.current = requestAnimationFrame(predictWebcam);
  }

  return (
    <div className="mx-auto max-w-md md:max-w-xl">
      {/* Camera frame */}
      <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100 shadow-sm aspect-[3/4]">
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className="absolute inset-0 h-full w-full -scale-x-100 object-cover"
        />
        <canvas
          ref={canvasRef}
          className="pointer-events-none absolute inset-0 h-full w-full -scale-x-100 object-cover"
        />

        {/* Status box (top) */}
        <div
          className={`absolute left-1/2 top-3 -translate-x-1/2 rounded-full px-4 py-2 text-center shadow-md backdrop-blur ${
            status.ok ? "bg-brand/90 text-white" : "bg-white/90 text-[#222529]"
          }`}
        >
          <p className="text-[12px] font-semibold">{status.title}</p>
          <p className="text-[10px] opacity-80">{status.message}</p>
        </div>

        {/* Countdown */}
        {countdown !== null && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[120px] font-bold text-white drop-shadow-lg">
              {countdown}
            </span>
          </div>
        )}
      </div>

      {/* Requirement checklist */}
      <ul className="mt-4 grid grid-cols-3 gap-2 text-[11px]">
        <Req met={requirements.lighting} label={reqLabels.lighting} />
        <Req met={requirements.fill} label={reqLabels.fill} />
        <Req met={requirements.straight} label={reqLabels.straight} />
      </ul>

      {/* Manual capture fallback */}
      <button
        type="button"
        onClick={doCapture}
        disabled={isCapturing}
        className="mt-5 inline-flex w-full items-center justify-center rounded-full border border-[#222529] px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.15em] text-[#222529] hover:bg-[#222529] hover:text-white disabled:opacity-50"
      >
        {isCapturing ? "Mengambil…" : "Ambil Sekarang"}
      </button>

      <p className="mt-3 text-center text-[11px] text-neutral-500">
        Posisi pas → otomatis terambil dalam 3 detik
      </p>
    </div>
  );
}

function Req({ met, label }: { met: boolean; label: string }) {
  return (
    <li
      className={`rounded-full px-2 py-1.5 text-center font-medium ${
        met
          ? "bg-brand-soft text-brand-dark ring-1 ring-brand/30"
          : "bg-neutral-100 text-neutral-500"
      }`}
    >
      {label}
    </li>
  );
}
