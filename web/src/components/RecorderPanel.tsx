import { useRef, useState } from "react";
import { useRecorder } from "../hooks/useRecorder";
import type { CustomRecording, SoundEvent } from "../types/audio";
import { SOUND_EVENTS } from "../types/audio";

interface RecorderPanelProps {
  recordings: CustomRecording[];
  onSave: (recording: CustomRecording) => void;
  onAssignRecording: (event: SoundEvent, recordingId: string | null) => void;
  onDeleteRecording: (id: string) => void;
  onPreviewRecording: (id: string) => void;
}

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60).toString().padStart(2, "0");
  const sec = (totalSec % 60).toString().padStart(2, "0");
  const centis = Math.floor((ms % 1000) / 10).toString().padStart(2, "0");
  return `${min}:${sec}.${centis}`;
}

// Waveform bars shown while recording
function WaveformBars({ active }: { active: boolean }) {
  const bars = [0.4, 0.9, 0.6, 1.0, 0.5, 0.8, 0.3, 0.7, 1.0, 0.5, 0.8, 0.4];
  return (
    <div className="flex items-center justify-center gap-[3px] h-12">
      {bars.map((h, i) => (
        <div
          key={i}
          className="w-[4px] rounded-full transition-all"
          style={{
            height: active ? `${Math.round(h * 40)}px` : "6px",
            background: active ? "var(--accent)" : "var(--line-strong)",
            animation: active ? `waveBar ${0.5 + i * 0.07}s ease-in-out infinite alternate` : "none",
            transformOrigin: "center",
          }}
        />
      ))}
    </div>
  );
}

// Event-assignment dropdown row
function AssignmentRow({
  event,
  recordings,
  onAssign,
  onPreview,
}: {
  event: (typeof SOUND_EVENTS)[number];
  recordings: CustomRecording[];
  onAssign: (recordingId: string | null) => void;
  onPreview: (id: string) => void;
}) {
  const assigned = recordings.find((r) => r.assignedEvent === event.id);

  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-[1rem]"
      style={{ background: "var(--paper)", border: "1px solid var(--line)" }}
    >
      {/* Event label */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          className="w-9 h-9 rounded-[0.6rem] flex items-center justify-center text-lg flex-shrink-0"
          style={{ background: "var(--panel)" }}
        >
          {event.emoji}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm leading-tight" style={{ color: "var(--ink)" }}>
            {event.label}
          </p>
          <p className="text-xs truncate" style={{ color: "var(--muted)" }}>
            {event.description}
          </p>
        </div>
      </div>

      {/* Dropdown + preview */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <select
          className="text-sm rounded-[0.6rem] px-3 py-2 pr-8 appearance-none cursor-pointer focus:outline-none"
          style={{
            background: "var(--panel)",
            color: "var(--ink)",
            border: "1px solid var(--line-strong)",
            minWidth: "160px",
          }}
          value={assigned?.id ?? ""}
          onChange={(e) => onAssign(e.target.value || null)}
        >
          <option value="">— Default sound —</option>
          {recordings.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>

        {assigned && (
          <button
            onClick={() => onPreview(assigned.id)}
            title="Preview assigned sound"
            className="w-9 h-9 rounded-[0.6rem] flex items-center justify-center text-base transition-opacity hover:opacity-70 flex-shrink-0"
            style={{ background: "var(--panel)", border: "1px solid var(--line-strong)" }}
          >
            ▶
          </button>
        )}
      </div>
    </div>
  );
}

export function RecorderPanel({
  recordings,
  onSave,
  onAssignRecording,
  onDeleteRecording,
  onPreviewRecording,
}: RecorderPanelProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

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

  // Focused events for assignment: success & error
  const focusedEvents = SOUND_EVENTS.filter((e) => e.id === "success" || e.id === "error");
  const otherEvents = SOUND_EVENTS.filter((e) => e.id !== "success" && e.id !== "error");

  return (
    <div className="flex flex-col gap-8 max-w-3xl mx-auto">
      {/* ── Page Header ── */}
      <div>
        <h2
          className="text-3xl font-bold mb-2"
          style={{ fontFamily: "Fraunces, serif", color: "var(--ink)" }}
        >
          🎙️ Recording Studio
        </h2>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Record custom audio clips and assign them to form submission events.
        </p>
      </div>

      {/* ══════════════════════════════════════════
          SECTION 1 — RECORDER
      ══════════════════════════════════════════ */}
      <div
        className="rounded-[1.25rem] overflow-hidden"
        style={{ border: "1px solid var(--line)" }}
      >
        {/* Section title bar */}
        <div
          className="px-6 py-4 flex items-center gap-3"
          style={{
            background: "linear-gradient(135deg, #1e3a5f 0%, #1a2744 100%)",
            borderBottom: "1px solid var(--line)",
          }}
        >
          <span className="text-xl">🎚️</span>
          <h3 className="font-bold text-base tracking-wide" style={{ color: "#e0eaff" }}>
            Audio Recorder
          </h3>
          {isRecording && (
            <span
              className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full animate-pulse"
              style={{ background: "#ef4444", color: "#fff" }}
            >
              ● REC
            </span>
          )}
          {isPaused && (
            <span
              className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: "#fbbf24", color: "#1a1a1a" }}
            >
              ⏸ PAUSED
            </span>
          )}
        </div>

        <div className="p-6 flex flex-col gap-6" style={{ background: "var(--panel)" }}>
          {/* Waveform + timer */}
          <div
            className="rounded-[1rem] p-5 flex flex-col items-center gap-3"
            style={{
              background: "var(--paper)",
              border: "1px solid var(--line)",
              minHeight: "110px",
            }}
          >
            <WaveformBars active={isRecording} />
            <div
              className="font-mono text-3xl font-bold tracking-widest"
              style={{ color: isRecording ? "var(--accent)" : "var(--muted)" }}
            >
              {formatTime(elapsedMs)}
            </div>
            {isIdle && (
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                Press <strong>Start Recording</strong> to begin
              </p>
            )}
          </div>

          {/* Error */}
          {error && (
            <div
              className="rounded-[0.75rem] px-4 py-3 text-sm font-medium"
              style={{ background: "#3b0a0a", color: "#fca5a5", border: "1px solid #7f1d1d" }}
            >
              ⚠️ {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            {/* Start */}
            {(isIdle || isStopped) && (
              <button
                onClick={isIdle ? requestAndStart : discard}
                disabled={isRequesting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-[0.75rem] font-semibold text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                style={{ background: "var(--accent)", color: "#fff" }}
              >
                {isIdle ? (
                  <>
                    <span className="text-base">●</span> Start Recording
                  </>
                ) : (
                  <>
                    <span className="text-base">↩</span> Record Again
                  </>
                )}
              </button>
            )}

            {isRequesting && (
              <button
                disabled
                className="flex items-center gap-2 px-5 py-2.5 rounded-[0.75rem] font-semibold text-sm opacity-60"
                style={{ background: "var(--accent)", color: "#fff" }}
              >
                <span className="animate-spin">⏳</span> Requesting mic…
              </button>
            )}

            {/* Pause / Resume */}
            {isActive && (
              <button
                onClick={isRecording ? pause : resume}
                className="flex items-center gap-2 px-5 py-2.5 rounded-[0.75rem] font-semibold text-sm transition-all hover:opacity-90 active:scale-95"
                style={{
                  background: "var(--panel)",
                  color: "var(--ink)",
                  border: "1px solid var(--line-strong)",
                }}
              >
                {isRecording ? (
                  <>⏸ Pause</>
                ) : (
                  <>▶ Resume</>
                )}
              </button>
            )}

            {/* Stop */}
            {isActive && (
              <button
                onClick={stop}
                className="flex items-center gap-2 px-5 py-2.5 rounded-[0.75rem] font-semibold text-sm transition-all hover:opacity-90 active:scale-95"
                style={{
                  background: "#3b0a0a",
                  color: "#fca5a5",
                  border: "1px solid #7f1d1d",
                }}
              >
                ⏹ Stop
              </button>
            )}

            {/* Save */}
            {isStopped && (
              <button
                onClick={saveRecording}
                className="flex items-center gap-2 px-5 py-2.5 rounded-[0.75rem] font-semibold text-sm transition-all hover:opacity-90 active:scale-95"
                style={{ background: "#166534", color: "#bbf7d0", border: "1px solid #14532d" }}
              >
                💾 Save Custom Sound
              </button>
            )}
          </div>

          {/* Preview + name */}
          {isStopped && previewUrl && (
            <div
              className="rounded-[1rem] p-4 flex flex-col gap-3"
              style={{ background: "var(--paper)", border: "1px solid var(--line)" }}
            >
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                Preview & Name
              </p>
              <audio ref={audioRef} src={previewUrl} controls className="w-full h-10" />
              <input
                type="text"
                value={recordingName}
                onChange={(e) => setRecordingName(e.target.value)}
                placeholder="Name this recording…"
                className="w-full px-4 py-2.5 rounded-[0.75rem] text-sm focus:outline-none"
                style={{
                  background: "var(--panel)",
                  color: "var(--ink)",
                  border: "1px solid var(--line-strong)",
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          SECTION 2 — EVENT ASSIGNMENT PANEL
      ══════════════════════════════════════════ */}
      <div
        className="rounded-[1.25rem] overflow-hidden"
        style={{ border: "1px solid var(--line)" }}
      >
        {/* Section title bar */}
        <div
          className="px-6 py-4 flex items-center gap-3"
          style={{
            background: "linear-gradient(135deg, #1e3a5f 0%, #1a2744 100%)",
            borderBottom: "1px solid var(--line)",
          }}
        >
          <span className="text-xl">🔗</span>
          <h3 className="font-bold text-base tracking-wide" style={{ color: "#e0eaff" }}>
            Event Assignment Panel
          </h3>
          <span
            className="ml-auto text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: "rgba(37,99,235,0.3)", color: "#93c5fd" }}
          >
            {recordings.length} clip{recordings.length !== 1 ? "s" : ""} available
          </span>
        </div>

        <div className="p-6 flex flex-col gap-6" style={{ background: "var(--panel)" }}>
          {/* Form submission events — highlighted */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold uppercase tracking-widest" style={{ color: "var(--accent)" }}>
                📋 Form Submission Events
              </span>
              <div className="flex-1 h-px" style={{ background: "var(--line)" }} />
            </div>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              Replace the default alert tones for form success and error states with your own recordings.
            </p>

            {recordings.length === 0 ? (
              <div
                className="rounded-[1rem] px-5 py-6 text-center text-sm"
                style={{
                  background: "var(--paper)",
                  border: "1px dashed var(--line-strong)",
                  color: "var(--muted)",
                }}
              >
                🎙️ Record a clip above to start assigning sounds to events.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {focusedEvents.map((event) => (
                  <AssignmentRow
                    key={event.id}
                    event={event}
                    recordings={recordings}
                    onAssign={(id) => onAssignRecording(event.id, id)}
                    onPreview={onPreviewRecording}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: "var(--line)" }} />
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
              Other Events
            </span>
            <div className="flex-1 h-px" style={{ background: "var(--line)" }} />
          </div>

          {/* Other events */}
          <div className="flex flex-col gap-3">
            {recordings.length === 0 ? (
              <div
                className="rounded-[1rem] px-5 py-4 text-center text-xs"
                style={{
                  background: "var(--paper)",
                  border: "1px dashed var(--line-strong)",
                  color: "var(--muted)",
                }}
              >
                No recordings yet — record your first clip to assign sounds.
              </div>
            ) : (
              otherEvents.map((event) => (
                <AssignmentRow
                  key={event.id}
                  event={event}
                  recordings={recordings}
                  onAssign={(id) => onAssignRecording(event.id, id)}
                  onPreview={onPreviewRecording}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          SECTION 3 — SAVED CLIPS LIBRARY
      ══════════════════════════════════════════ */}
      {recordings.length > 0 && (
        <div
          className="rounded-[1.25rem] overflow-hidden"
          style={{ border: "1px solid var(--line)" }}
        >
          <div
            className="px-6 py-4 flex items-center gap-3"
            style={{
              background: "linear-gradient(135deg, #1e3a5f 0%, #1a2744 100%)",
              borderBottom: "1px solid var(--line)",
            }}
          >
            <span className="text-xl">🗂️</span>
            <h3 className="font-bold text-base tracking-wide" style={{ color: "#e0eaff" }}>
              Saved Clips Library
            </h3>
          </div>

          <div className="p-6 flex flex-col gap-3" style={{ background: "var(--panel)" }}>
            {recordings.map((rec) => {
              const assignedEvent = SOUND_EVENTS.find((e) => e.id === rec.assignedEvent);
              return (
                <div
                  key={rec.id}
                  className="rounded-[1rem] p-4 flex flex-col sm:flex-row sm:items-center gap-3"
                  style={{ background: "var(--paper)", border: "1px solid var(--line)" }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm" style={{ color: "var(--ink)" }}>
                        {rec.name}
                      </span>
                      {assignedEvent && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: "rgba(37,99,235,0.15)", color: "var(--accent)" }}
                        >
                          {assignedEvent.emoji} {assignedEvent.label}
                        </span>
                      )}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                      {(rec.durationMs / 1000).toFixed(1)}s ·{" "}
                      {new Date(rec.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => onPreviewRecording(rec.id)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-[0.6rem] text-xs font-semibold transition-all hover:opacity-80 active:scale-95"
                      style={{ background: "var(--accent)", color: "#fff" }}
                    >
                      ▶ Play
                    </button>

                    {confirmDelete === rec.id ? (
                      <>
                        <button
                          onClick={() => {
                            onDeleteRecording(rec.id);
                            setConfirmDelete(null);
                          }}
                          className="px-3 py-2 rounded-[0.6rem] text-xs font-semibold transition-all hover:opacity-80"
                          style={{ background: "#3b0a0a", color: "#fca5a5", border: "1px solid #7f1d1d" }}
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="px-3 py-2 rounded-[0.6rem] text-xs font-semibold transition-all hover:opacity-80"
                          style={{ background: "var(--panel)", color: "var(--muted)", border: "1px solid var(--line-strong)" }}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(rec.id)}
                        className="px-3 py-2 rounded-[0.6rem] text-xs font-semibold transition-all hover:opacity-80"
                        style={{ background: "var(--panel)", color: "var(--muted)", border: "1px solid var(--line-strong)" }}
                      >
                        🗑
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
