export interface Theme {
  id: string;
  name: string;
  background: string;
  textPrimary: string;
  textSecondary: string;
  accentColor: string;
  borderColor: string;
}

export const THEMES: Theme[] = [
  {
    id: "midnight",
    name: "Midnight",
    background: "linear-gradient(135deg, #0f172a, #1e293b)",
    textPrimary: "#ffffff",
    textSecondary: "#94a3b8",
    accentColor: "#3b82f6",
    borderColor: "2px solid #3b82f6",
  },
  {
    id: "aurora",
    name: "Aurora",
    background: "linear-gradient(135deg, #064e3b, #312e81)",
    textPrimary: "#ffffff",
    textSecondary: "#a7f3d0",
    accentColor: "#10b981",
    borderColor: "2px solid #10b981",
  },
  {
    id: "sunset",
    name: "Sunset",
    background: "linear-gradient(135deg, #1c1917, #431407)",
    textPrimary: "#fef3c7",
    textSecondary: "#fcd34d",
    accentColor: "#f97316",
    borderColor: "2px solid #f97316",
  },
  {
    id: "neon",
    name: "Neon",
    background: "#000000",
    textPrimary: "#ffffff",
    textSecondary: "#f9a8d4",
    accentColor: "#ec4899",
    borderColor: "0 0 0 1px #ec4899, 0 0 20px #ec4899",
  },
  {
    id: "arctic",
    name: "Arctic",
    background: "linear-gradient(135deg, #f8fafc, #e2e8f0)",
    textPrimary: "#0f172a",
    textSecondary: "#475569",
    accentColor: "#0ea5e9",
    borderColor: "2px solid #0ea5e9",
  },
  {
    id: "mono",
    name: "Mono",
    background: "#18181b",
    textPrimary: "#ffffff",
    textSecondary: "#a1a1aa",
    accentColor: "#ffffff",
    borderColor: "2px solid #ffffff",
  },
];
