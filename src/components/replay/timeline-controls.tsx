"use client";

import type { TimelineEvent } from "./timeline";

const FILTER_LABELS: Record<TimelineEvent["type"], string> = {
  issue: "Issues",
  pr: "PRs",
  review: "Reviews",
  merge: "Merges",
};

const FILTER_ACTIVE_STYLES: Record<TimelineEvent["type"], string> = {
  issue: "bg-blue-500 text-white",
  pr: "bg-green-500 text-white",
  review: "bg-yellow-400 text-gray-900",
  merge: "bg-purple-500 text-white",
};

interface TimelineControlsProps {
  playing: boolean;
  speed: 1 | 2 | 4;
  filters: Record<TimelineEvent["type"], boolean>;
  onPlayPause: () => void;
  onSpeedChange: (speed: 1 | 2 | 4) => void;
  onPrev: () => void;
  onNext: () => void;
  onFilterToggle: (type: TimelineEvent["type"]) => void;
}

export function TimelineControls({
  playing,
  speed,
  filters,
  onPlayPause,
  onSpeedChange,
  onPrev,
  onNext,
  onFilterToggle,
}: TimelineControlsProps) {
  const speeds: (1 | 2 | 4)[] = [1, 2, 4];
  const filterTypes: TimelineEvent["type"][] = ["issue", "pr", "review", "merge"];

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 bg-gray-800 rounded-lg px-4 py-3">
      {/* Playback controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={onPrev}
          aria-label="Previous event"
          className="w-8 h-8 flex items-center justify-center rounded bg-gray-700 hover:bg-gray-600 text-white transition-colors"
        >
          ‹
        </button>
        <button
          onClick={onPlayPause}
          aria-label={playing ? "Pause" : "Play"}
          className="w-9 h-9 flex items-center justify-center rounded bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors"
        >
          {playing ? "⏸" : "▶"}
        </button>
        <button
          onClick={onNext}
          aria-label="Next event"
          className="w-8 h-8 flex items-center justify-center rounded bg-gray-700 hover:bg-gray-600 text-white transition-colors"
        >
          ›
        </button>

        {/* Speed selector */}
        <div className="flex items-center gap-1 ml-2">
          {speeds.map((s) => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              aria-label={`Speed ${s}x`}
              className={`px-2 py-0.5 text-xs rounded font-mono transition-colors ${
                speed === s
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Filter toggles */}
      <div className="flex items-center gap-2" aria-label="Event type filters">
        {filterTypes.map((type) => (
          <button
            key={type}
            onClick={() => onFilterToggle(type)}
            aria-label={`Toggle ${FILTER_LABELS[type]}`}
            aria-pressed={filters[type]}
            className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
              filters[type]
                ? FILTER_ACTIVE_STYLES[type]
                : "bg-gray-700 text-gray-500"
            }`}
          >
            {FILTER_LABELS[type]}
          </button>
        ))}
      </div>
    </div>
  );
}
