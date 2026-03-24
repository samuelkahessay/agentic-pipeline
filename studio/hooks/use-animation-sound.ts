"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import * as Tone from "tone";

interface AnimationSoundOptions {
  /** Cycle duration in seconds — must match CSS --duration */
  duration?: number;
  amplitude?: "tight" | "medium" | "full";
}

/**
 * Syncs Tone.js sounds to the prd-to-prod animation cycle.
 *
 * Keyframe map (from prd-to-prod-animation.module.css):
 *   31% — "o" mid-fall (whoosh)
 *   35% — impact + squash (mallet hit)
 *   36% — "r" ripple hop (tap)
 *   38% — "p" ripple hop (lighter tap)
 *   90% — exit (reverse whoosh)
 */
export function useAnimationSound(options: AnimationSoundOptions = {}) {
  const { duration = 3.6, amplitude = "medium" } = options;

  const [enabled, setEnabled] = useState(false);
  const synthsRef = useRef<{
    impact: Tone.MembraneSynth;
    tapR: Tone.MetalSynth;
    tapP: Tone.MetalSynth;
    whoosh: Tone.NoiseSynth;
    pad: Tone.Synth;
    reverb: Tone.Reverb;
    loopId: number | null;
  } | null>(null);

  // Volume scaling per amplitude
  const vol = amplitude === "tight" ? -12 : amplitude === "full" ? -4 : -8;

  const buildSynths = useCallback(() => {
    if (synthsRef.current) return synthsRef.current;

    const reverb = new Tone.Reverb({ decay: 1.2, wet: 0.3 }).toDestination();

    // Impact — warm, woody membrane hit (the "o" lands)
    const impact = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 4,
      oscillator: { type: "sine" },
      envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.4 },
    }).connect(reverb);
    impact.volume.value = vol;

    // Ripple taps — short metallic tings
    const tapR = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.08, release: 0.05 },
      harmonicity: 5.1,
      modulationIndex: 16,
      resonance: 3000,
      octaves: 0.5,
    }).connect(reverb);
    tapR.frequency.value = 300;
    tapR.volume.value = vol - 8;

    const tapP = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.06, release: 0.04 },
      harmonicity: 5.1,
      modulationIndex: 16,
      resonance: 4000,
      octaves: 0.5,
    }).connect(reverb);
    tapP.frequency.value = 400;
    tapP.volume.value = vol - 12;

    // Whoosh — filtered noise burst for the falling "o"
    const whoosh = new Tone.NoiseSynth({
      noise: { type: "pink" },
      envelope: { attack: 0.05, decay: 0.15, sustain: 0, release: 0.1 },
    });
    const whooshFilter = new Tone.AutoFilter({
      frequency: 8,
      baseFrequency: 800,
      octaves: 4,
    }).connect(reverb);
    whooshFilter.start();
    whoosh.connect(whooshFilter);
    whoosh.volume.value = vol - 14;

    // Settle pad — very gentle sine swell
    const pad = new Tone.Synth({
      oscillator: { type: "sine" },
      envelope: { attack: 0.4, decay: 0.6, sustain: 0.2, release: 0.8 },
    }).connect(reverb);
    pad.volume.value = vol - 18;

    const synths = { impact, tapR, tapP, whoosh, pad, reverb, loopId: null as number | null };
    synthsRef.current = synths;
    return synths;
  }, [vol]);

  // Schedule one cycle of sounds
  const playCycle = useCallback(
    (synths: NonNullable<typeof synthsRef.current>) => {
      const t = Tone.now();

      // 31% — whoosh (o falling)
      synths.whoosh.triggerAttackRelease(0.15, t + duration * 0.31);

      // 35% — impact (o lands, squash)
      synths.impact.triggerAttackRelease("C2", 0.2, t + duration * 0.35);

      // 36% — r ripple
      synths.tapR.triggerAttackRelease("16n", t + duration * 0.36);

      // 38% — p ripple
      synths.tapP.triggerAttackRelease("16n", t + duration * 0.38);

      // 44% — settle pad
      synths.pad.triggerAttackRelease("G4", 0.4, t + duration * 0.44, 0.15);
    },
    [duration]
  );

  // Start / stop the looping schedule
  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    const start = async () => {
      await Tone.start();
      if (cancelled) return;

      const synths = buildSynths();

      // First cycle immediately
      playCycle(synths);

      // Loop subsequent cycles
      const id = setInterval(() => {
        if (!cancelled) playCycle(synths);
      }, duration * 1000) as unknown as number;

      synths.loopId = id;
    };

    start();

    return () => {
      cancelled = true;
      const synths = synthsRef.current;
      if (synths?.loopId != null) {
        clearInterval(synths.loopId);
        synths.loopId = null;
      }
    };
  }, [enabled, buildSynths, playCycle, duration]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const synths = synthsRef.current;
      if (!synths) return;
      if (synths.loopId != null) clearInterval(synths.loopId);
      synths.impact.dispose();
      synths.tapR.dispose();
      synths.tapP.dispose();
      synths.whoosh.dispose();
      synths.pad.dispose();
      synths.reverb.dispose();
      synthsRef.current = null;
    };
  }, []);

  const toggle = useCallback(async () => {
    if (!enabled) {
      await Tone.start();
    }
    setEnabled((prev) => !prev);
  }, [enabled]);

  return { enabled, toggle };
}
