import { useState, useEffect, useCallback } from "react";
import { Shell } from "./components/Shell";
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

// Only two main views now — recorder dashboard + settings
const NAV_ITEMS: { id: AppView; label: string; emoji: string }[] = [
  { id: "recorder", label: "Dashboard", emoji: "🎙️" },
  { id: "settings", label: "Settings", emoji: "⚙️" },
];

export default function App() {
  const [view, setView] = useState<AppView>("recorder");
  const [settings, setSettings] = useState<AudioSettings>(loadSettings);
  const [recordings, setRecordings] = useState<CustomRecording[]>(loadRecordings);
  const [saveFlash, setSaveFlash] = useState(false);

  const { playEvent, previewRecording } = useAudioEngine({ settings, recordings });

  // Persist settings
  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  // Persist recordings
  useEffect(() => {
    localStorage.setItem(RECORDINGS_KEY, JSON.stringify(recordings));
  }, [recordings]);

  const handleSaveRecording = useCallback(
    (recording: CustomRecording) => {
      setRecordings((prev) => [recording, ...prev]);
      setSaveFlash(true);
      setTimeout(() => setSaveFlash(false), 2000);
    },
    []
  );

  const handleAssignRecording = useCallback(
    (event: SoundEvent, recordingId: string | null) => {
      setRecordings((prev) =>
        prev.map((r) => {
          // Clear this event from any other recording
          if (r.assignedEvent === event && r.id !== recordingId) {
            return { ...r, assignedEvent: null };
          }
          // Assign to the selected recording
          if (r.id === recordingId) {
            return { ...r, assignedEvent: event };
          }
          return r;
        })
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

  // ── Sidebar nav items ──
  const sidebarNav = (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const active = view === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className="flex items-center gap-3 px-4 py-2.5 rounded-[0.75rem] text-sm font-semibold text-left w-full transition-all"
            style={{
              background: active ? "var(--accent)" : "transparent",
              color: active ? "#fff" : "var(--ink)",
            }}
          >
            <span className="text-base">{item.emoji}</span>
            {item.label}
          </button>
        );
      })}

      {/* Save flash indicator */}
      {saveFlash && (
        <div
          className="mt-2 px-4 py-2 rounded-[0.75rem] text-xs font-semibold text-center animate-pulse"
          style={{ background: "#166534", color: "#bbf7d0" }}
        >
          ✅ Clip saved!
        </div>
      )}
    </nav>
  );

  // ── Bottom dock for mobile ──
  const bottomDock = NAV_ITEMS.map((item) => {
    const active = view === item.id;
    return (
      <button
        key={item.id}
        onClick={() => setView(item.id)}
        className="flex flex-col items-center gap-1 px-4 py-2 rounded-[0.75rem] text-xs font-semibold transition-all"
        style={{
          background: active ? "var(--accent)" : "transparent",
          color: active ? "#fff" : "var(--muted)",
        }}
      >
        <span className="text-lg">{item.emoji}</span>
        {item.label}
      </button>
    );
  });

  return (
    <Shell
      appName="SoundBoard"
      sidebarContent={sidebarNav}
      bottomDockContent={bottomDock}
    >
      <div className="p-6 md:p-8 max-w-4xl mx-auto w-full">
        {view === "recorder" && (
          <RecorderPanel
            recordings={recordings}
            onSave={handleSaveRecording}
            onAssignRecording={handleAssignRecording}
            onDeleteRecording={handleDeleteRecording}
            onPreviewRecording={handlePreviewRecording}
          />
        )}

        {view === "settings" && (
          <SettingsPanel
            settings={settings}
            onSettingsChange={setSettings}
            recordings={recordings}
            onAssignRecording={handleAssignRecording}
            onDeleteRecording={handleDeleteRecording}
            onPreviewRecording={handlePreviewRecording}
            onTriggerEvent={playEvent}
          />
        )}
      </div>
    </Shell>
  );
}
