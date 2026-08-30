export type SoundEvent = "click" | "success" | "delete" | "error" | "notification";

export const SOUND_EVENTS: { id: SoundEvent; label: string; emoji: string; description: string }[] = [
  { id: "click", label: "Button Click", emoji: "🖱️", description: "Triggered on interactive button presses" },
  { id: "success", label: "Success / Submit", emoji: "✅", description: "Triggered on successful form submissions" },
  { id: "delete", label: "Delete / Remove", emoji: "🗑️", description: "Triggered when items are deleted" },
  { id: "error", label: "Error / Alert", emoji: "⚠️", description: "Triggered on errors or validation failures" },
  { id: "notification", label: "Notification", emoji: "🔔", description: "Triggered for general notifications" },
];

export interface AudioSettings {
  enabled: boolean;
  volume: number; // 0–100
}

export interface CustomRecording {
  id: string;
  name: string;
  dataUrl: string;
  durationMs: number;
  createdAt: number;
  assignedEvent: SoundEvent | null;
}

export type RecorderState = "idle" | "requesting" | "recording" | "paused" | "stopped";

export type AppView = "demo" | "recorder" | "settings";
