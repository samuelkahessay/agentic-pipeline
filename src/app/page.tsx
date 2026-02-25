import Link from "next/link";
import { getPipelineData } from "@/data/index";

const viewCards = [
  {
    href: "/simulator",
    title: "Simulator",
    description: "Explore how the pipeline works",
  },
  {
    href: "/replay",
    title: "Replay",
    description: "Watch the Code Snippet Manager run",
  },
  {
    href: "/forensics",
    title: "Forensics",
    description: "Inspect agent decisions and reviews",
  },
];

export default async function Home() {
  const data = await getPipelineData();

  const featuresShipped = data.issues.filter(
    (i) => i.state === "closed" && i.labels.some((l) => l.name === "feature")
  ).length;
  const prsMerged = data.pullRequests.filter((pr) => pr.state === "merged").length;

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-gray-900 to-gray-950 py-24 px-6 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Pipeline Observatory
        </h1>
        <p className="text-lg text-gray-400 max-w-xl mx-auto">
          Visualize, replay, and inspect an autonomous AI development pipeline
        </p>
      </section>

      {/* View cards */}
      <section className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        {viewCards.map(({ href, title, description }) => (
          <Link
            key={href}
            href={href}
            className="block rounded-xl bg-gray-900 border border-gray-800 p-8 hover:bg-gray-800 transition-colors"
          >
            <h2 className="text-xl font-semibold text-white mb-2">{title}</h2>
            <p className="text-gray-400">{description}</p>
          </Link>
        ))}
      </section>

      {/* Stats bar */}
      <section className="max-w-5xl mx-auto px-6 pb-16 flex flex-wrap gap-8 justify-center text-gray-400 text-sm">
        <span>{featuresShipped} features shipped</span>
        <span>{prsMerged} PRs merged</span>
        <span>~2 hours end-to-end</span>
      </section>
    </div>
  );
}

