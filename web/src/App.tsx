import { useState, useEffect, useCallback } from "react";
import { Shell } from "./components/Shell";
import { DemoPanel } from "./components/DemoPanel";
import { RecorderPanel } from "./components/RecorderPanel";
import { SettingsPanel } from "./components/SettingsPanel";
import { useAudioEngine } from "./hooks/useAudioEngine";
import type {
  AppView,
  AudioSettings,
  CustomRecording,
  SoundEvent,
} from "./types/audio";

const SETTINGS_KEY = "soundboard_settings";
const RECORDINGS_KEY = "soundboard_recordings";

const DEFAULT_SETTINGS: AudioSettings = { enabled: true, volume: 70 };

function loadSettings(): AudioSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_SETTINGS;
}

function loadRecordings(): CustomRecording[] {
  try {
    const raw = localStorage.getItem(RECORDINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

const NAV_ITEMS: { id: AppView; label: string; emoji: string }[] = [
  { id: "demo", label: "Sound Demo", emoji: "🎵" },
  { id: "recorder", label: "Record Audio", emoji: "🎙️" },
  { id: "settings", label: "Settings", emoji: "⚙️" },
];

export default function App() {
  const [view, setView] = useState<AppView>("demo");
  const [settings, setSettings] = useState<AudioSettings>(loadSettings);
  const [recordings, setRecordings] = useState<CustomRecording[]>(loadRecordings);
  const [saveFlash, setSaveFlash] = useState(false);

  // Persist settings
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {}
  }, [settings]);

  // Persist recordings (only metadata + dataUrl)
  useEffect(() => {
    try {
      localStorage.setItem(RECORDINGS_KEY, JSON.stringify(recordings));
    } catch {}
  }, [recordings]);

  const { trigger, previewRecording, loadRecordingBuffer } = useAudioEngine(
    settings,
    recordings
  );

  const handleSettingsChange = useCallback((s: AudioSettings) => {
    setSettings(s);
  }, []);

  const handleSaveRecording = useCallback(
    async (rec: CustomRecording) => {
      setRecordings((prev) => [...prev, rec]);
      await loadRecordingBuffer(rec.id, rec.dataUrl);
      setSaveFlash(true);
      setTimeout(() => setSaveFlash(false), 2000);
      // Navigate to settings so user can assign it
      setTimeout(() => setView("settings"), 500);
    },
    [loadRecordingBuffer]
  );

  const handleAssignRecording = useCallback(
    (event: SoundEvent, recordingId: string | null) => {
      setRecordings((prev) =>
        prev.map((r) => ({
          ...r,
          assignedEvent:
            r.id === recordingId
              ? event
              : r.assignedEvent === event
              ? null
              : r.assignedEvent,
        }))
      );
    },
    []
  );

  const handleDeleteRecording = useCallback((id: string) => {
    setRecordings((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const handlePreviewRecording = useCallback(
    (id: string) => {
      previewRecording(id);
    },
    [previewRecording]
  );

  const handleTriggerEvent = useCallback(
    (event: SoundEvent) => {
      trigger(event);
    },
    [trigger]
  );

  // Sidebar nav
  const sidebarNav = (
    <div className="flex flex-col gap-1 py-2">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          onClick={() => setView(item.id)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-[0.75rem] text-sm font-medium text-left transition-all w-full"
          style={{
            background:
              view === item.id
                ? "color-mix(in srgb, var(--accent) 15%, transparent)"
                : "transparent",
            color: view === item.id ? "var(--accent)" : "var(--ink)",
          }}
        >
          <span className="text-lg">{item.emoji}</span>
          {item.label}
        </button>
      ))}

      {/* Stats */}
      <div
        className="mt-4 rounded-[0.75rem] p-3 flex flex-col gap-2"
        style={{ background: "var(--line)", fontSize: 12 }}
      >
        <div className="flex items-center justify-between" style={{ color: "var(--muted)" }}>
          <span>Sound effects</span>
          <span
            className="font-semibold"
            style={{ color: settings.enabled ? "var(--success)" : "var(--danger)" }}
          >
            {settings.enabled ? "ON" : "OFF"}
          </span>
        </div>
        <div className="flex items-center justify-between" style={{ color: "var(--muted)" }}>
          <span>Volume</span>
          <span className="font-semibold" style={{ color: "var(--ink)" }}>
            {settings.volume}%
          </span>
        </div>
        <div className="flex items-center justify-between" style={{ color: "var(--muted)" }}>
          <span>My recordings</span>
          <span className="font-semibold" style={{ color: "var(--ink)" }}>
            {recordings.length}
          </span>
        </div>
      </div>

      {/* Save flash */}
      {saveFlash && (
        <div
          className="mt-2 rounded-[0.75rem] p-2 text-xs text-center font-medium"
          style={{
            background: "color-mix(in srgb, var(--success) 15%, transparent)",
            color: "var(--success)",
          }}
        >
          ✅ Recording saved!
        </div>
      )}
    </div>
  );

  // Bottom dock for mobile
  const bottomDock = NAV_ITEMS.map((item) => (
    <button
      key={item.id}
      onClick={() => setView(item.id)}
      className="flex flex-col items-center gap-0.5 px-3 py-1 transition-all"
      style={{ color: view === item.id ? "var(--accent)" : "var(--muted)" }}
    >
      <span className="text-xl">{item.emoji}</span>
      <span className="text-[10px] font-medium">{item.label}</span>
    </button>
  ));

  const mainContent = (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      {view === "demo" && (
        <DemoPanel onTrigger={handleTriggerEvent} settings={settings} />
      )}
      {view === "recorder" && <RecorderPanel onSave={handleSaveRecording} />}
      {view === "settings" && (
        <SettingsPanel
          settings={settings}
          onSettingsChange={handleSettingsChange}
          recordings={recordings}
          onAssignRecording={handleAssignRecording}
          onDeleteRecording={handleDeleteRecording}
          onPreviewRecording={handlePreviewRecording}
          onTriggerEvent={handleTriggerEvent}
        />
      )}
    </div>
  );

  return (
    <Shell sidebar={sidebarNav} bottomDock={bottomDock}>
      {mainContent}
    </Shell>
  );
}
