import { useState, useRef, useCallback, useEffect } from "react";
import type { RecorderState, CustomRecording } from "../types/audio";

interface UseRecorderOptions {
  onSave: (recording: CustomRecording) => void;
}

export function useRecorder({ onSave }: UseRecorderOptions) {
  const [state, setState] = useState<RecorderState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [recordingName, setRecordingName] = useState("My Recording");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedElapsedRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setElapsedMs(pausedElapsedRef.current + (Date.now() - startTimeRef.current));
    }, 100);
  }, [clearTimer]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  const requestAndStart = useCallback(async () => {
    setError(null);
    setState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/ogg";

      const mr = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mr;
      chunksRef.current = [];
      pausedElapsedRef.current = 0;
      setElapsedMs(0);
      setPreviewUrl(null);

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        // Stop all tracks
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };

      mr.start(100);
      setState("recording");
      startTimer();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.name === "NotAllowedError"
            ? "Microphone access was denied. Please allow microphone access in your browser settings and try again."
            : err.name === "NotFoundError"
            ? "No microphone found. Please connect a microphone and try again."
            : err.message
          : "Could not access microphone.";
      setError(msg);
      setState("idle");
    }
  }, [startTimer]);

  const pause = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.pause();
      clearTimer();
      pausedElapsedRef.current += Date.now() - startTimeRef.current;
      setState("paused");
    }
  }, [clearTimer]);

  const resume = useCallback(() => {
    if (mediaRecorderRef.current?.state === "paused") {
      mediaRecorderRef.current.resume();
      startTimer();
      setState("recording");
    }
  }, [startTimer]);

  const stop = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      (mediaRecorderRef.current.state === "recording" ||
        mediaRecorderRef.current.state === "paused")
    ) {
      clearTimer();
      pausedElapsedRef.current += Date.now() - startTimeRef.current;
      mediaRecorderRef.current.stop();
      setState("stopped");
    }
  }, [clearTimer]);

  const discard = useCallback(() => {
    clearTimer();
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    chunksRef.current = [];
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setElapsedMs(0);
    pausedElapsedRef.current = 0;
    setState("idle");
    setError(null);
  }, [clearTimer, previewUrl]);

  const saveRecording = useCallback(async () => {
    if (!previewUrl || !chunksRef.current.length) return;

    const mimeType = chunksRef.current[0].type || "audio/webm";
    const blob = new Blob(chunksRef.current, { type: mimeType });

    // Convert to base64 data URL for localStorage persistence
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const recording: CustomRecording = {
        id: `rec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: recordingName.trim() || "My Recording",
        dataUrl,
        durationMs: pausedElapsedRef.current,
        createdAt: Date.now(),
        assignedEvent: null,
      };
      onSave(recording);
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      chunksRef.current = [];
      setElapsedMs(0);
      pausedElapsedRef.current = 0;
      setState("idle");
      setRecordingName("My Recording");
    };
    reader.readAsDataURL(blob);
  }, [previewUrl, recordingName, onSave]);

  return {
    state,
    error,
    elapsedMs,
    previewUrl,
    recordingName,
    setRecordingName,
    requestAndStart,
    pause,
    resume,
    stop,
    discard,
    saveRecording,
  };
}
