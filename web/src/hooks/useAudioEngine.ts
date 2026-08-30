import { useRef, useCallback, useEffect } from "react";
import type { AudioSettings, SoundEvent, CustomRecording } from "../types/audio";

// Tiny inline WAV generators for each event type
// These are base64-encoded minimal WAV files so we have zero external deps

function generateTone(
  frequency: number,
  durationMs: number,
  type: OscillatorType = "sine",
  fadeOut = true
): Promise<AudioBuffer> {
  return new Promise((resolve) => {
    const ctx = new OfflineAudioContext(1, Math.ceil((44100 * durationMs) / 1000), 44100);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, 0);
    gain.gain.setValueAtTime(1, 0);
    if (fadeOut) {
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000 - 0.01);
    }
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(0);
    osc.stop(durationMs / 1000);
    ctx.startRendering().then(resolve);
  });
}

async function buildPresetBuffers(): Promise<Record<SoundEvent, AudioBuffer>> {
  const [click, success, delete_, error, notification] = await Promise.all([
    // click: short 1200Hz tick
    generateTone(1200, 60, "square", true),
    // success: two-tone chime (880 then 1100)
    (async () => {
      const ctx = new OfflineAudioContext(1, Math.ceil((44100 * 400) / 1000), 44100);
      const makeNote = (freq: number, start: number, dur: number) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, start);
        g.gain.setValueAtTime(0.8, start);
        g.gain.exponentialRampToValueAtTime(0.001, start + dur - 0.01);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + dur);
      };
      makeNote(880, 0, 0.18);
      makeNote(1100, 0.2, 0.18);
      return ctx.startRendering();
    })(),
    // delete: low thud 200Hz
    generateTone(200, 120, "sawtooth", true),
    // error: two descending tones
    (async () => {
      const ctx = new OfflineAudioContext(1, Math.ceil((44100 * 400) / 1000), 44100);
      const makeNote = (freq: number, start: number, dur: number) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(freq, start);
        g.gain.setValueAtTime(0.6, start);
        g.gain.exponentialRampToValueAtTime(0.001, start + dur - 0.01);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + dur);
      };
      makeNote(500, 0, 0.18);
      makeNote(350, 0.2, 0.18);
      return ctx.startRendering();
    })(),
    // notification: soft bell 660Hz
    generateTone(660, 300, "sine", true),
  ]);

  return { click, success, delete: delete_, error, notification };
}

export function useAudioEngine(settings: AudioSettings, recordings: CustomRecording[]) {
  const ctxRef = useRef<AudioContext | null>(null);
  const presetsRef = useRef<Record<SoundEvent, AudioBuffer> | null>(null);
  const customBuffersRef = useRef<Map<string, AudioBuffer>>(new Map());
  const loadedRef = useRef(false);

  // Lazily create AudioContext on first interaction
  const getCtx = useCallback((): AudioContext => {
    if (!ctxRef.current || ctxRef.current.state === "closed") {
      ctxRef.current = new AudioContext();
    }
    if (ctxRef.current.state === "suspended") {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  // Load preset buffers once
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    buildPresetBuffers().then((buffers) => {
      presetsRef.current = buffers;
    });
  }, []);

  // Decode custom recordings when they change
  useEffect(() => {
    const ctx = getCtx();
    recordings.forEach((rec) => {
      if (!customBuffersRef.current.has(rec.id) && rec.dataUrl) {
        fetch(rec.dataUrl)
          .then((r) => r.arrayBuffer())
          .then((ab) => ctx.decodeAudioData(ab))
          .then((buf) => {
            customBuffersRef.current.set(rec.id, buf);
          })
          .catch(() => {});
      }
    });
  }, [recordings, getCtx]);

  const playBuffer = useCallback(
    (buffer: AudioBuffer, volume: number) => {
      const ctx = getCtx();
      const source = ctx.createBufferSource();
      const gainNode = ctx.createGain();
      source.buffer = buffer;
      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      source.connect(gainNode);
      gainNode.connect(ctx.destination);
      source.start(ctx.currentTime);
    },
    [getCtx]
  );

  const trigger = useCallback(
    (event: SoundEvent) => {
      if (!settings.enabled) return;
      const volume = settings.volume / 100;

      // Check if user has assigned a custom recording to this event
      const assignedRecording = recordings.find((r) => r.assignedEvent === event);
      if (assignedRecording) {
        const buf = customBuffersRef.current.get(assignedRecording.id);
        if (buf) {
          playBuffer(buf, volume);
          return;
        }
      }

      // Fall back to preset
      if (presetsRef.current) {
        playBuffer(presetsRef.current[event], volume);
      }
    },
    [settings.enabled, settings.volume, recordings, playBuffer]
  );

  const previewRecording = useCallback(
    (recordingId: string) => {
      const volume = settings.volume / 100;
      const buf = customBuffersRef.current.get(recordingId);
      if (buf) {
        playBuffer(buf, volume);
      }
    },
    [settings.volume, playBuffer]
  );

  const loadRecordingBuffer = useCallback(
    async (id: string, dataUrl: string) => {
      const ctx = getCtx();
      try {
        const ab = await fetch(dataUrl).then((r) => r.arrayBuffer());
        const buf = await ctx.decodeAudioData(ab);
        customBuffersRef.current.set(id, buf);
      } catch {}
    },
    [getCtx]
  );

  return { trigger, previewRecording, loadRecordingBuffer };
}
