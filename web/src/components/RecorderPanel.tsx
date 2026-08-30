import { useRef } from "react";
import { useRecorder } from "../hooks/useRecorder";
import type { CustomRecording } from "../types/audio";

interface RecorderPanelProps {
  onSave: (recording: CustomRecording) => void;
}

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60)
    .toString()
    .padStart(2, "0");
  const sec = (totalSec % 60).toString().padStart(2, "0");
  const centis = Math.floor((ms % 1000) / 10)
    .toString()
    .padStart(2, "0");
  return `${min}:${sec}.${centis}`;
}

export function RecorderPanel({ onSave }: RecorderPanelProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const {
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
  } = useRecorder({ onSave });

  const isIdle = state === "idle";
  const isRequesting = state === "requesting";
  const isRecording = state === "recording";
  const isPaused = state === "paused";
  const isStopped = state === "stopped";
  const isActive = isRecording || isPaused;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h2
          className="text-2xl font-bold mb-1"
          style={{ fontFamily: "Fraunces, serif", color: "var(--ink)" }}
        >
          Record Audio
        </h2>
        <p style={{ color: "var(--muted)" }} className="text-sm">
          Record custom audio clips from your microphone and assign them to sound events.
        </p>
      </div>

      {/* Main recorder card */}
      <div
        className="rounded-[1.25rem] p-6 flex flex-col gap-6"
        style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
      >
        {/* Visualizer / timer */}
        <div className="flex flex-col items-center gap-4">
          {/* Animated mic icon */}
          <div
            className="relative flex items-center justify-center rounded-full transition-all duration-300"
            style={{
              width: 96,
              height: 96,
              background: isRecording
                ? "var(--accent)"
                : isPaused
                ? "var(--warning)"
                : isStopped
                ? "var(--success)"
                : "var(--line)",
              boxShadow: isRecording
                ? "0 0 0 12px color-mix(in srgb, var(--accent) 20%, transparent)"
                : "none",
            }}
          >
            <span className="text-4xl select-none">
              {isStopped ? "✅" : isRequesting ? "⏳" : "🎙️"}
            </span>
            {isRecording && (
              <span
                className="absolute inset-0 rounded-full animate-ping"
                style={{
                  background: "color-mix(in srgb, var(--accent) 30%, transparent)",
                }}
              />
            )}
          </div>

          {/* Timer */}
          <div
            className="text-4xl font-bold tabular-nums"
            style={{
              fontFamily: "Fraunces, serif",
              color: isRecording
                ? "var(--accent)"
                : isPaused
                ? "var(--warning)"
                : "var(--ink)",
            }}
          >
            {formatTime(elapsedMs)}
          </div>

          {/* Status label */}
          <div
            className="text-sm font-medium px-3 py-1 rounded-full"
            style={{
              background: isRecording
                ? "color-mix(in srgb, var(--accent) 15%, transparent)"
                : isPaused
                ? "color-mix(in srgb, var(--warning) 15%, transparent)"
                : isStopped
                ? "color-mix(in srgb, var(--success) 15%, transparent)"
                : "var(--line)",
              color: isRecording
                ? "var(--accent)"
                : isPaused
                ? "var(--warning)"
                : isStopped
                ? "var(--success)"
                : "var(--muted)",
            }}
          >
            {isIdle && "Ready to record"}
            {isRequesting && "Requesting microphone…"}
            {isRecording && "● Recording"}
            {isPaused && "⏸ Paused"}
            {isStopped && "Recording complete"}
          </div>
        </div>

        {/* Waveform bars (decorative animation while recording) */}
        {isRecording && (
          <div className="flex items-end justify-center gap-1 h-10">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="rounded-full"
                style={{
                  width: 4,
                  background: "var(--accent)",
                  height: `${20 + Math.sin(i * 0.8) * 16}px`,
                  animation: `waveBar ${0.4 + (i % 5) * 0.1}s ease-in-out infinite alternate`,
                  animationDelay: `${i * 0.04}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {isIdle && (
            <button
              onClick={requestAndStart}
              className="flex items-center gap-2 px-6 py-3 rounded-[0.75rem] font-semibold text-sm transition-opacity hover:opacity-80"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              🎙️ Start Recording
            </button>
          )}

          {isActive && (
            <>
              {isRecording ? (
                <button
                  onClick={pause}
                  className="flex items-center gap-2 px-5 py-3 rounded-[0.75rem] font-semibold text-sm transition-opacity hover:opacity-80"
                  style={{ background: "var(--warning)", color: "#fff" }}
                >
                  ⏸ Pause
                </button>
              ) : (
                <button
                  onClick={resume}
                  className="flex items-center gap-2 px-5 py-3 rounded-[0.75rem] font-semibold text-sm transition-opacity hover:opacity-80"
                  style={{ background: "var(--accent)", color: "#fff" }}
                >
                  ▶ Resume
                </button>
              )}
              <button
                onClick={stop}
                className="flex items-center gap-2 px-5 py-3 rounded-[0.75rem] font-semibold text-sm transition-opacity hover:opacity-80"
                style={{ background: "var(--danger)", color: "#fff" }}
              >
                ⏹ Stop
              </button>
              <button
                onClick={discard}
                className="flex items-center gap-2 px-5 py-3 rounded-[0.75rem] font-semibold text-sm transition-opacity hover:opacity-80"
                style={{ background: "var(--line)", color: "var(--ink)" }}
              >
                🗑 Discard
              </button>
            </>
          )}

          {isStopped && (
            <button
              onClick={discard}
              className="flex items-center gap-2 px-5 py-3 rounded-[0.75rem] font-semibold text-sm transition-opacity hover:opacity-80"
              style={{ background: "var(--line)", color: "var(--ink)" }}
            >
              🗑 Discard
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div
            className="rounded-[0.75rem] p-4 text-sm"
            style={{
              background: "color-mix(in srgb, var(--danger) 12%, transparent)",
              border: "1px solid color-mix(in srgb, var(--danger) 30%, transparent)",
              color: "var(--danger)",
            }}
          >
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* Preview & Save */}
      {isStopped && previewUrl && (
        <div
          className="rounded-[1.25rem] p-6 flex flex-col gap-4"
          style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
        >
          <h3 className="font-semibold" style={{ color: "var(--ink)" }}>
            Preview & Save
          </h3>

          {/* Audio player */}
          <audio ref={audioRef} src={previewUrl} controls className="w-full" />

          {/* Name input */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" style={{ color: "var(--muted)" }}>
              Recording name
            </label>
            <input
              type="text"
              value={recordingName}
              onChange={(e) => setRecordingName(e.target.value)}
              maxLength={60}
              className="rounded-[0.75rem] px-4 py-2 text-sm outline-none focus:ring-2"
              style={{
                background: "var(--paper)",
                border: "1px solid var(--line-strong)",
                color: "var(--ink)",
              }}
              placeholder="Give this recording a name…"
            />
          </div>

          <button
            onClick={saveRecording}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-[0.75rem] font-semibold text-sm transition-opacity hover:opacity-80"
            style={{ background: "var(--success)", color: "#fff" }}
          >
            💾 Save Recording
          </button>
        </div>
      )}

      {/* Tip */}
      {isIdle && (
        <div
          className="rounded-[0.75rem] p-4 text-sm"
          style={{
            background: "color-mix(in srgb, var(--accent) 8%, transparent)",
            border: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)",
            color: "var(--muted)",
          }}
        >
          💡 <strong style={{ color: "var(--ink)" }}>Tip:</strong> Your browser will ask for
          microphone permission when you start. Recordings are saved locally to your device — nothing
          is uploaded.
        </div>
      )}

      <style>{`
        @keyframes waveBar {
          from { transform: scaleY(0.4); }
          to { transform: scaleY(1.4); }
        }
      `}</style>
    </div>
  );
}
