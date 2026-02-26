"use client";

import { motion } from "framer-motion";
import { THEMES } from "@/data/themes";

interface ThemeSelectorProps {
  currentTheme: string;
  onChange: (themeId: string) => void;
}

export default function ThemeSelector({ currentTheme, onChange }: ThemeSelectorProps) {
  return (
    <div
      style={{
        display: "flex",
        gap: "0.5rem",
        justifyContent: "center",
        alignItems: "center",
        padding: "0.5rem",
      }}
    >
      {THEMES.map((theme) => {
        const isActive = theme.id === currentTheme;
        return (
          <button
            key={theme.id}
            onClick={() => onChange(theme.id)}
            aria-label={`Select ${theme.name} theme`}
            style={{
              position: "relative",
              width: 24,
              height: 24,
              borderRadius: "50%",
              background: theme.background,
              border: "none",
              cursor: "pointer",
              padding: 0,
              flexShrink: 0,
            }}
          >
            {isActive && (
              <motion.span
                layoutId="theme-ring"
                style={{
                  position: "absolute",
                  inset: -3,
                  borderRadius: "50%",
                  border: "2px solid #ffffff",
                  pointerEvents: "none",
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
