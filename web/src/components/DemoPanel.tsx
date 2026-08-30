import { useState } from "react";
import type { SoundEvent, AudioSettings } from "../types/audio";
import { SOUND_EVENTS } from "../types/audio";

interface DemoPanelProps {
  onTrigger: (event: SoundEvent) => void;
  settings: AudioSettings;
}

interface LogEntry {
  id: number;
  event: SoundEvent;
  ts: number;
  message: string;
}

const EVENT_COLORS: Record<SoundEvent, string> = {
  click: "var(--accent)",
  success: "var(--success)",
  delete: "var(--danger)",
  error: "var(--warning)",
  notification: "var(--muted)",
};

const DEMO_SCENARIOS = [
  {
    id: "form",
    title: "Form Submission",
    description: "Simulate a form with validation. Fill in the fields and submit.",
    icon: "📋",
  },
  {
    id: "list",
    title: "Item Manager",
    description: "Add and remove items from a list with sound feedback.",
    icon: "📝",
  },
  {
    id: "notifications",
    title: "Notification Center",
    description: "Trigger various notification types.",
    icon: "🔔",
  },
];

let logCounter = 0;

export function DemoPanel({ onTrigger, settings }: DemoPanelProps) {
  const [activeScenario, setActiveScenario] = useState<string>("form");
  const [log, setLog] = useState<LogEntry[]>([]);
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formSuccess, setFormSuccess] = useState(false);
  const [items, setItems] = useState<{ id: number; text: string }[]>([
    { id: 1, text: "Design the interface" },
    { id: 2, text: "Write the audio engine" },
  ]);
  const [newItem, setNewItem] = useState("");

  const addLog = (event: SoundEvent, message: string) => {
    const entry: LogEntry = { id: ++logCounter, event, ts: Date.now(), message };
    setLog((prev) => [entry, ...prev].slice(0, 20));
  };

  const fire = (event: SoundEvent, message: string) => {
    onTrigger(event);
    addLog(event, message);
  };

  // Form scenario
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = "Name is required";
    if (!formData.email.trim()) errors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = "Enter a valid email";
    if (!formData.message.trim()) errors.message = "Message is required";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      fire("error", "Form validation failed — missing or invalid fields");
    } else {
      setFormErrors({});
      setFormSuccess(true);
      fire("success", `Form submitted successfully by ${formData.name}`);
      setTimeout(() => {
        setFormSuccess(false);
        setFormData({ name: "", email: "", message: "" });
      }, 2500);
    }
  };

  // List scenario
  const addItem = () => {
    if (!newItem.trim()) {
      fire("error", "Cannot add an empty item");
      return;
    }
    const item = { id: Date.now(), text: newItem.trim() };
    setItems((prev) => [...prev, item]);
    setNewItem("");
    fire("success", `Added item: "${item.text}"`);
  };

  const removeItem = (id: number, text: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    fire("delete", `Deleted item: "${text}"`);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h2
          className="text-2xl font-bold mb-1"
          style={{ fontFamily: "Fraunces, serif", color: "var(--ink)" }}
        >
          Sound Demo
        </h2>
        <p style={{ color: "var(--muted)" }} className="text-sm">
          Interact with the scenarios below to hear sound effects triggered by real UI events.
        </p>
        {!settings.enabled && (
          <div
            className="mt-3 rounded-[0.75rem] px-4 py-2 text-sm"
            style={{
              background: "color-mix(in srgb, var(--warning) 12%, transparent)",
              border: "1px solid color-mix(in srgb, var(--warning) 30%, transparent)",
              color: "var(--warning)",
            }}
          >
            🔇 Sound is currently disabled. Enable it in <strong>Settings</strong>.
          </div>
        )}
      </div>

      {/* Quick trigger pad */}
      <div
        className="rounded-[1.25rem] p-5 flex flex-col gap-3"
        style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
      >
        <h3 className="font-semibold text-sm" style={{ color: "var(--ink)" }}>
          ⚡ Quick Sound Triggers
        </h3>
        <div className="flex flex-wrap gap-2">
          {SOUND_EVENTS.map((evt) => (
            <button
              key={evt.id}
              onClick={() => fire(evt.id, `Manually triggered: ${evt.label}`)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-[0.75rem] text-sm font-medium transition-all hover:scale-105 active:scale-95"
              style={{
                background: `color-mix(in srgb, ${EVENT_COLORS[evt.id]} 15%, var(--paper))`,
                border: `1px solid color-mix(in srgb, ${EVENT_COLORS[evt.id]} 30%, transparent)`,
                color: EVENT_COLORS[evt.id],
              }}
            >
              {evt.emoji} {evt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scenario tabs */}
      <div className="flex gap-2 flex-wrap">
        {DEMO_SCENARIOS.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveScenario(s.id)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-[0.75rem] text-sm font-medium transition-all"
            style={{
              background:
                activeScenario === s.id ? "var(--accent)" : "var(--panel)",
              color: activeScenario === s.id ? "#fff" : "var(--ink)",
              border: `1px solid ${activeScenario === s.id ? "var(--accent)" : "var(--line)"}`,
            }}
          >
            {s.icon} {s.title}
          </button>
        ))}
      </div>

      {/* Scenario content */}
      <div
        className="rounded-[1.25rem] p-6"
        style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
      >
        {/* Form scenario */}
        {activeScenario === "form" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">📋</span>
              <div>
                <div className="font-semibold" style={{ color: "var(--ink)" }}>
                  Contact Form
                </div>
                <div className="text-xs" style={{ color: "var(--muted)" }}>
                  Submit triggers ✅ success or ⚠️ error sounds
                </div>
              </div>
            </div>

            {formSuccess && (
              <div
                className="rounded-[0.75rem] p-3 text-sm font-medium"
                style={{
                  background: "color-mix(in srgb, var(--success) 15%, transparent)",
                  color: "var(--success)",
                }}
              >
                ✅ Message sent successfully!
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="flex flex-col gap-3">
              {(["name", "email", "message"] as const).map((field) => (
                <div key={field} className="flex flex-col gap-1">
                  <label className="text-xs font-medium capitalize" style={{ color: "var(--muted)" }}>
                    {field}
                  </label>
                  {field === "message" ? (
                    <textarea
                      value={formData[field]}
                      onChange={(e) => {
                        setFormData((p) => ({ ...p, [field]: e.target.value }));
                        if (formErrors[field]) setFormErrors((p) => ({ ...p, [field]: "" }));
                        fire("click", `Typing in ${field} field`);
                      }}
                      rows={3}
                      className="rounded-[0.75rem] px-3 py-2 text-sm outline-none resize-none"
                      style={{
                        background: "var(--paper)",
                        border: `1px solid ${formErrors[field] ? "var(--danger)" : "var(--line-strong)"}`,
                        color: "var(--ink)",
                      }}
                      placeholder={`Enter your ${field}…`}
                    />
                  ) : (
                    <input
                      type={field === "email" ? "email" : "text"}
                      value={formData[field]}
                      onChange={(e) => {
                        setFormData((p) => ({ ...p, [field]: e.target.value }));
                        if (formErrors[field]) setFormErrors((p) => ({ ...p, [field]: "" }));
                        fire("click", `Typing in ${field} field`);
                      }}
                      className="rounded-[0.75rem] px-3 py-2 text-sm outline-none"
                      style={{
                        background: "var(--paper)",
                        border: `1px solid ${formErrors[field] ? "var(--danger)" : "var(--line-strong)"}`,
                        color: "var(--ink)",
                      }}
                      placeholder={`Enter your ${field}…`}
                    />
                  )}
                  {formErrors[field] && (
                    <div className="text-xs" style={{ color: "var(--danger)" }}>
                      {formErrors[field]}
                    </div>
                  )}
                </div>
              ))}
              <button
                type="submit"
                className="mt-1 px-5 py-2.5 rounded-[0.75rem] font-semibold text-sm transition-opacity hover:opacity-80"
                style={{ background: "var(--accent)", color: "#fff" }}
              >
                Send Message
              </button>
            </form>
          </div>
        )}

        {/* List scenario */}
        {activeScenario === "list" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">📝</span>
              <div>
                <div className="font-semibold" style={{ color: "var(--ink)" }}>
                  Item Manager
                </div>
                <div className="text-xs" style={{ color: "var(--muted)" }}>
                  Add triggers ✅ success, delete triggers 🗑️ delete sound
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addItem()}
                className="flex-1 rounded-[0.75rem] px-3 py-2 text-sm outline-none"
                style={{
                  background: "var(--paper)",
                  border: "1px solid var(--line-strong)",
                  color: "var(--ink)",
                }}
                placeholder="New item…"
              />
              <button
                onClick={addItem}
                className="px-4 py-2 rounded-[0.75rem] font-semibold text-sm transition-opacity hover:opacity-80"
                style={{ background: "var(--accent)", color: "#fff" }}
              >
                + Add
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {items.length === 0 && (
                <div
                  className="text-center text-sm py-6 rounded-[0.75rem]"
                  style={{ border: "2px dashed var(--line)", color: "var(--muted)" }}
                >
                  No items. Add one above!
                </div>
              )}
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-[0.75rem]"
                  style={{ background: "var(--paper)", border: "1px solid var(--line)" }}
                >
                  <span className="flex-1 text-sm" style={{ color: "var(--ink)" }}>
                    {item.text}
                  </span>
                  <button
                    onClick={() => removeItem(item.id, item.text)}
                    className="text-xs px-3 py-1.5 rounded-[0.5rem] transition-opacity hover:opacity-70"
                    style={{ background: "var(--line)", color: "var(--danger)" }}
                  >
                    🗑 Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notifications scenario */}
        {activeScenario === "notifications" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">🔔</span>
              <div>
                <div className="font-semibold" style={{ color: "var(--ink)" }}>
                  Notification Center
                </div>
                <div className="text-xs" style={{ color: "var(--muted)" }}>
                  Trigger different notification types and hear their sounds
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  event: "notification" as SoundEvent,
                  label: "New Message",
                  desc: "You have a new message from Alex",
                  icon: "💬",
                  color: "var(--accent)",
                },
                {
                  event: "success" as SoundEvent,
                  label: "Upload Complete",
                  desc: "Your file was uploaded successfully",
                  icon: "✅",
                  color: "var(--success)",
                },
                {
                  event: "error" as SoundEvent,
                  label: "Connection Lost",
                  desc: "Unable to reach the server",
                  icon: "❌",
                  color: "var(--danger)",
                },
                {
                  event: "error" as SoundEvent,
                  label: "Low Battery",
                  desc: "Battery level is below 10%",
                  icon: "🔋",
                  color: "var(--warning)",
                },
                {
                  event: "notification" as SoundEvent,
                  label: "Reminder",
                  desc: "Meeting starts in 5 minutes",
                  icon: "⏰",
                  color: "var(--muted)",
                },
                {
                  event: "success" as SoundEvent,
                  label: "Task Done",
                  desc: "Background task completed",
                  icon: "🏁",
                  color: "var(--success)",
                },
              ].map((notif) => (
                <button
                  key={notif.label}
                  onClick={() => fire(notif.event, `${notif.label}: ${notif.desc}`)}
                  className="flex items-start gap-3 p-4 rounded-[0.75rem] text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: `color-mix(in srgb, ${notif.color} 10%, var(--paper))`,
                    border: `1px solid color-mix(in srgb, ${notif.color} 25%, transparent)`,
                  }}
                >
                  <span className="text-2xl mt-0.5">{notif.icon}</span>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm" style={{ color: "var(--ink)" }}>
                      {notif.label}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                      {notif.desc}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Event log */}
      <div
        className="rounded-[1.25rem] p-5 flex flex-col gap-3"
        style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm" style={{ color: "var(--ink)" }}>
            📜 Event Log
          </h3>
          {log.length > 0 && (
            <button
              onClick={() => setLog([])}
              className="text-xs px-2 py-1 rounded-md transition-opacity hover:opacity-70"
              style={{ color: "var(--muted)", background: "var(--line)" }}
            >
              Clear
            </button>
          )}
        </div>

        {log.length === 0 ? (
          <div className="text-xs py-4 text-center" style={{ color: "var(--muted)" }}>
            Interact with the demo above to see events here…
          </div>
        ) : (
          <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
            {log.map((entry) => (
              <div
                key={entry.id}
                className="flex items-start gap-2 text-xs py-1.5 px-2 rounded-[0.5rem]"
                style={{
                  background: `color-mix(in srgb, ${EVENT_COLORS[entry.event]} 8%, transparent)`,
                }}
              >
                <span style={{ color: EVENT_COLORS[entry.event] }}>
                  {SOUND_EVENTS.find((e) => e.id === entry.event)?.emoji}
                </span>
                <span className="flex-1" style={{ color: "var(--ink)" }}>
                  {entry.message}
                </span>
                <span style={{ color: "var(--muted)", whiteSpace: "nowrap" }}>
                  {new Date(entry.ts).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
