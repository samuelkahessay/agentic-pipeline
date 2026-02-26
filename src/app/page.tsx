"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import sampleUser from "../data/fixtures/sample-user.json";

const steps = [
  { icon: "🔍", title: "Enter Username", desc: "Type any GitHub username" },
  { icon: "⬇️", title: "We Fetch Your Data", desc: "We pull your repos, stats, and languages" },
  { icon: "🃏", title: "Get Your Card", desc: "A beautiful developer identity card" },
];

export default function Home() {
  const router = useRouter();
  const [username, setUsername] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (username.trim()) {
      router.push(`/card/${username.trim()}`);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 text-white">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-6 pt-24 pb-16 text-center">
        <motion.h1
          className="text-5xl md:text-6xl font-bold mb-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          DevCard
        </motion.h1>
        <motion.p
          className="text-gray-400 text-lg md:text-xl max-w-lg mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Generate beautiful developer identity cards from any GitHub profile
        </motion.p>

        {/* Username Form */}
        <form onSubmit={handleSubmit} className="flex gap-2 w-full max-w-md">
          <div className="flex items-center bg-gray-800 border border-gray-700 rounded-lg flex-1 px-3">
            <span className="text-gray-400 mr-2">@</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter GitHub username"
              aria-label="GitHub username"
              className="bg-transparent outline-none py-3 text-white flex-1 placeholder-gray-500"
            />
          </div>
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-3 rounded-lg transition-colors"
          >
            Generate Card
          </button>
        </form>
      </section>

      {/* How it works */}
      <section className="px-6 pb-20 max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold text-center mb-10 text-gray-200">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              className="bg-gray-800/60 border border-gray-700 rounded-xl p-6 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
            >
              <div className="text-4xl mb-3">{step.icon}</div>
              <h3 className="font-semibold text-white mb-1">{step.title}</h3>
              <p className="text-gray-400 text-sm">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Example preview */}
      <section className="px-6 pb-24 flex flex-col items-center">
        <h2 className="text-2xl font-semibold text-center mb-8 text-gray-200">See an example</h2>
        <div
          className="border border-gray-700 rounded-2xl bg-gray-800/50 p-6 text-center"
          style={{ transform: "scale(0.6)", transformOrigin: "top center" }}
        >
          <div className="flex items-center gap-4 mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={sampleUser.user.avatarUrl}
              alt={sampleUser.user.name ?? sampleUser.user.login}
              width={64}
              height={64}
              className="rounded-full"
            />
            <div className="text-left">
              <p className="font-bold text-white">{sampleUser.user.name}</p>
              <p className="text-gray-400 text-sm">@{sampleUser.user.login}</p>
            </div>
          </div>
          <p className="text-gray-400 text-sm">{sampleUser.user.bio}</p>
        </div>
        <Link
          href="/card/octocat"
          className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm font-medium"
        >
          Try it →
        </Link>
      </section>
    </main>
  );
}
