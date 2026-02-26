"use client";

import { motion } from "framer-motion";
import type { LanguageStat } from "@/data/types";
import { DEFAULT_COLOR } from "@/data/language-colors";

interface LanguageBarProps {
  languages: LanguageStat[];
}

interface DisplayEntry {
  name: string;
  color: string;
  percentage: number;
  displayPercent: number;
}

export default function LanguageBar({ languages }: LanguageBarProps) {
  if (!languages || languages.length === 0) {
    return (
      <div style={{ color: "#94a3b8", fontSize: "0.75rem", textAlign: "center" }}>
        No language data
      </div>
    );
  }

  const top5 = languages.slice(0, 5);
  const rest = languages.slice(5);

  const entries: DisplayEntry[] = top5.map((l) => ({
    name: l.name,
    color: l.color || DEFAULT_COLOR,
    percentage: l.percentage,
    displayPercent: Math.max(3, l.percentage),
  }));

  if (rest.length > 0) {
    const otherPct = rest.reduce((sum, l) => sum + l.percentage, 0);
    entries.push({
      name: "Other",
      color: DEFAULT_COLOR,
      percentage: otherPct,
      displayPercent: Math.max(3, otherPct),
    });
  }

  // Normalize displayPercent so total = 100
  const totalDisplay = entries.reduce((s, e) => s + e.displayPercent, 0);
  const normalized = entries.map((e) => ({
    ...e,
    displayPercent: (e.displayPercent / totalDisplay) * 100,
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {/* Stacked Bar */}
      <div
        style={{
          display: "flex",
          height: 8,
          borderRadius: "9999px",
          overflow: "hidden",
          width: "100%",
        }}
      >
        {normalized.map((entry, i) => (
          <motion.div
            key={entry.name}
            initial={{ width: 0 }}
            animate={{ width: `${entry.displayPercent}%` }}
            transition={{ duration: 0.5, delay: i * 0.05 }}
            style={{ backgroundColor: entry.color, height: "100%" }}
          />
        ))}
      </div>

      {/* Legend */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0.25rem 1rem",
          fontSize: "0.7rem",
          color: "#cbd5e1",
        }}
      >
        {normalized.map((entry) => (
          <div key={entry.name} style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <span
              style={{
                display: "inline-block",
                width: 10,
                height: 10,
                borderRadius: "50%",
                backgroundColor: entry.color,
                flexShrink: 0,
              }}
            />
            <span>{entry.name}</span>
            <span style={{ color: "#94a3b8" }}>{entry.percentage.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
