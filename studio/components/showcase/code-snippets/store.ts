"use client";

import { useState, useEffect, useCallback } from "react";

export interface Snippet {
  id: string;
  title: string;
  code: string;
  language: string;
  tags: string[];
  createdAt: string;
}

const STORAGE_KEY = "showcase-snippets";
const SEEDED_KEY = "showcase-snippets-seeded";

const SEED_SNIPPETS: Snippet[] = [
  {
    id: "seed-1",
    title: "Hello World",
    code: `console.log("Hello, World!");

// A simple greeting function
function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet("pipeline"));`,
    language: "JavaScript",
    tags: ["basics", "beginner"],
    createdAt: "2026-02-01T10:00:00Z",
  },
  {
    id: "seed-2",
    title: "Binary Search",
    code: `function binarySearch<T>(arr: T[], target: T): number {
  let low = 0;
  let high = arr.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) low = mid + 1;
    else high = mid - 1;
  }

  return -1; // not found
}`,
    language: "TypeScript",
    tags: ["algorithms", "search"],
    createdAt: "2026-02-02T10:00:00Z",
  },
  {
    id: "seed-3",
    title: "CSS Grid Layout",
    code: `.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  padding: 2rem;
}

.grid-item {
  background: var(--surface);
  border-radius: 8px;
  padding: 1.5rem;
  border: 1px solid var(--rule);
}

@media (max-width: 640px) {
  .grid-container {
    grid-template-columns: 1fr;
    padding: 1rem;
  }
}`,
    language: "CSS",
    tags: ["layout", "responsive"],
    createdAt: "2026-02-03T10:00:00Z",
  },
  {
    id: "seed-4",
    title: "Express Route Handler",
    code: `import { Router, Request, Response } from "express";

const router = Router();

router.get("/snippets", async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    const snippets = await db.findAll(q as string);
    res.json({ snippets });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/snippets", async (req: Request, res: Response) => {
  const { title, code, language, tags } = req.body;
  const snippet = await db.create({ title, code, language, tags });
  res.status(201).json({ snippet });
});

export default router;`,
    language: "TypeScript",
    tags: ["backend", "express"],
    createdAt: "2026-02-04T10:00:00Z",
  },
];

function loadFromStorage(): Snippet[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Snippet[];
  } catch {
    return [];
  }
}

function saveToStorage(snippets: Snippet[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snippets));
  } catch {
    // ignore storage errors
  }
}

function seedIfNeeded(): Snippet[] {
  try {
    if (localStorage.getItem(SEEDED_KEY)) {
      return loadFromStorage();
    }
    saveToStorage(SEED_SNIPPETS);
    localStorage.setItem(SEEDED_KEY, "1");
    return SEED_SNIPPETS;
  } catch {
    return SEED_SNIPPETS;
  }
}

export function useSnippets() {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const loaded = seedIfNeeded();
    setSnippets(loaded);
    setHydrated(true);
  }, []);

  const addSnippet = useCallback(
    (data: Omit<Snippet, "id" | "createdAt">) => {
      const next: Snippet = {
        ...data,
        id: `snip-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: new Date().toISOString(),
      };
      setSnippets((prev) => {
        const updated = [next, ...prev];
        saveToStorage(updated);
        return updated;
      });
    },
    []
  );

  const deleteSnippet = useCallback((id: string) => {
    setSnippets((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      saveToStorage(updated);
      return updated;
    });
  }, []);

  const searchSnippets = useCallback(
    (query: string): Snippet[] => {
      if (!query.trim()) return snippets;
      const q = query.toLowerCase();
      return snippets.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.code.toLowerCase().includes(q)
      );
    },
    [snippets]
  );

  return { snippets, hydrated, addSnippet, deleteSnippet, searchSnippets };
}
