import { useState } from "react";
import type { AudioSettings, CustomRecording, SoundEvent } from "../types/audio";
import { SOUND_EVENTS } from "../types/audio";

interface SettingsPanelProps {
  settings: AudioSettings;
  onSettingsChange: (s: AudioSettings) => void;
  recordings: CustomRecording[];
  onAssignRecording: (event: SoundEvent, recordingId: string | null) => void;
  onDeleteRecording: (id: string) => void;
  onPreviewRecording: (id: string) => void;
  onTriggerEvent: (event: SoundEvent) => void;
}

export function SettingsPanel({
  settings,
  onSettingsChange,
  recordings,
  onAssignRecording,
  onDeleteRecording,
  onPreviewRecording,
  onTriggerEvent,
}: SettingsPanelProps) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h2
          className="text-2xl font-bold mb-1"
          style={{ fontFamily: "Fraunces, serif", color: "var(--ink)" }}
        >
          Settings
        </h2>
        <p style={{ color: "var(--muted)" }} className="text-sm">
          Manage sound preferences, volume, and custom recording assignments.
        </p>
      </div>

      {/* Master Controls */}
      <div
        className="rounded-[1.25rem] p-6 flex flex-col gap-5"
        style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
      >
        <h3 className="font-semibold text-base" style={{ color: "var(--ink)" }}>
          🎛️ Master Controls
        </h3>

        {/* Enable toggle */}
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-sm" style={{ color: "var(--ink)" }}>
              Sound Effects
            </div>
            <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
              Enable or disable all audio globally
            </div>
          </div>
          <button
            role="switch"
            aria-checked={settings.enabled}
            onClick={() => onSettingsChange({ ...settings, enabled: !settings.enabled })}
            className="relative inline-flex items-center rounded-full transition-colors duration-200 focus:outline-none"
            style={{
              width: 52,
              height: 28,
              background: settings.enabled ? "var(--accent)" : "var(--line-strong)",
            }}
          >
            <span
              className="inline-block rounded-full bg-white shadow transition-transform duration-200"
              style={{
                width: 22,
                height: 22,
                transform: settings.enabled ? "translateX(26px)" : "translateX(3px)",
              }}
            />
          </button>
        </div>

        {/* Volume slider */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="font-medium text-sm" style={{ color: "var(--ink)" }}>
              Master Volume
            </div>
            <div
              className="text-sm font-semibold tabular-nums px-2 py-0.5 rounded-md"
              style={{ background: "var(--line)", color: "var(--ink)" }}
            >
              {settings.volume}%
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-lg select-none">🔇</span>
            <input
              type="range"
              min={0}
              max={100}
              value={settings.volume}
              disabled={!settings.enabled}
              onChange={(e) =>
                onSettingsChange({ ...settings, volume: Number(e.target.value) })
              }
              className="flex-1 accent-[var(--accent)]"
              style={{ opacity: settings.enabled ? 1 : 0.4 }}
            />
            <span className="text-lg select-none">🔊</span>
          </div>
        </div>
      </div>

      {/* Sound Event Assignments */}
      <div
        className="rounded-[1.25rem] p-6 flex flex-col gap-4"
        style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-base" style={{ color: "var(--ink)" }}>
            🎵 Sound Event Assignments
          </h3>
          <span className="text-xs" style={{ color: "var(--muted)" }}>
            {recordings.length} custom recording{recordings.length !== 1 ? "s" : ""}
          </span>
        </div>
        <p className="text-xs" style={{ color: "var(--muted)" }}>
          Assign custom recordings to specific events, or use the default preset sounds.
        </p>

        <div className="flex flex-col gap-3">
          {SOUND_EVENTS.map((evt) => {
            const assigned = recordings.find((r) => r.assignedEvent === evt.id);
            return (
              <div
                key={evt.id}
                className="rounded-[0.75rem] p-4 flex flex-col sm:flex-row sm:items-center gap-3"
                style={{ background: "var(--paper)", border: "1px solid var(--line)" }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{evt.emoji}</span>
                    <span className="font-medium text-sm" style={{ color: "var(--ink)" }}>
                      {evt.label}
                    </span>
                  </div>
                  <div className="text-xs mt-0.5 ml-7" style={{ color: "var(--muted)" }}>
                    {evt.description}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-7 sm:ml-0">
                  {/* Test button */}
                  <button
                    onClick={() => onTriggerEvent(evt.id)}
                    disabled={!settings.enabled}
                    title="Test this sound"
                    className="rounded-[0.5rem] px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-70 disabled:opacity-30"
                    style={{ background: "var(--line)", color: "var(--ink)" }}
                  >
                    ▶ Test
                  </button>

                  {/* Assignment select */}
                  <select
                    value={assigned?.id ?? ""}
                    onChange={(e) =>
                      onAssignRecording(evt.id, e.target.value || null)
                    }
                    className="rounded-[0.5rem] px-2 py-1.5 text-xs font-medium outline-none"
                    style={{
                      background: assigned
                        ? "color-mix(in srgb, var(--accent) 12%, var(--paper))"
                        : "var(--line)",
                      border: assigned
                        ? "1px solid color-mix(in srgb, var(--accent) 30%, transparent)"
                        : "1px solid transparent",
                      color: "var(--ink)",
                      maxWidth: 160,
                    }}
                  >
                    <option value="">🔊 Default preset</option>
                    {recordings.map((r) => (
                      <option key={r.id} value={r.id}>
                        🎙️ {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom Recordings Library */}
      <div
        className="rounded-[1.25rem] p-6 flex flex-col gap-4"
        style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
      >
        <h3 className="font-semibold text-base" style={{ color: "var(--ink)" }}>
          🎙️ My Recordings
        </h3>

        {recordings.length === 0 ? (
          <div
            className="rounded-[0.75rem] p-6 text-center text-sm"
            style={{ border: "2px dashed var(--line)", color: "var(--muted)" }}
          >
            No recordings yet. Head to the <strong>Record</strong> tab to capture your first
            custom sound.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {recordings.map((rec) => {
              const assignedEvents = SOUND_EVENTS.filter(
                (e) => recordings.find((r) => r.id === rec.id && r.assignedEvent === e.id)
              );
              const durationSec = (rec.durationMs / 1000).toFixed(1);

              return (
                <div
                  key={rec.id}
                  className="rounded-[0.75rem] p-4 flex items-center gap-3"
                  style={{ background: "var(--paper)", border: "1px solid var(--line)" }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate" style={{ color: "var(--ink)" }}>
                      🎙️ {rec.name}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                      {durationSec}s ·{" "}
                      {new Date(rec.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                      {rec.assignedEvent && (
                        <span
                          className="ml-2 px-1.5 py-0.5 rounded text-xs"
                          style={{
                            background:
                              "color-mix(in srgb, var(--accent) 15%, transparent)",
                            color: "var(--accent)",
                          }}
                        >
                          {SOUND_EVENTS.find((e) => e.id === rec.assignedEvent)?.emoji}{" "}
                          {SOUND_EVENTS.find((e) => e.id === rec.assignedEvent)?.label}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Preview */}
                  <button
                    onClick={() => onPreviewRecording(rec.id)}
                    title="Preview recording"
                    className="rounded-[0.5rem] px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-70"
                    style={{ background: "var(--line)", color: "var(--ink)" }}
                  >
                    ▶
                  </button>

                  {/* Delete */}
                  {confirmDelete === rec.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          onDeleteRecording(rec.id);
                          setConfirmDelete(null);
                        }}
                        className="rounded-[0.5rem] px-2 py-1.5 text-xs font-medium transition-opacity hover:opacity-70"
                        style={{ background: "var(--danger)", color: "#fff" }}
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="rounded-[0.5rem] px-2 py-1.5 text-xs font-medium transition-opacity hover:opacity-70"
                        style={{ background: "var(--line)", color: "var(--ink)" }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(rec.id)}
                      title="Delete recording"
                      className="rounded-[0.5rem] px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-70"
                      style={{ background: "var(--line)", color: "var(--danger)" }}
                    >
                      🗑
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
