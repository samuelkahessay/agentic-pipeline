import { getPipelineData } from "@/data/index";
import { CycleCard, groupIntoCycles } from "@/components/forensics/cycle-card";
import { ReviewInspector } from "@/components/forensics/review-inspector";
import { FailureTimeline } from "@/components/forensics/failure-timeline";

export default async function ForensicsPage() {
  const data = await getPipelineData();
  const cycles = groupIntoCycles(data.pullRequests, data.issues).reverse(); // newest first

  return (
    <main className="min-h-screen bg-gray-950 py-12 px-6">
      <div className="max-w-4xl mx-auto flex flex-col gap-16">
        {/* Pipeline Cycles */}
        <section>
          <h1 className="text-3xl font-bold text-white mb-2">Pipeline Forensics</h1>
          <p className="text-gray-400 mb-8">
            Inspect agent behaviour: cycle-by-cycle activity and every automated review.
          </p>
          <h2 className="text-xl font-semibold text-white mb-4">Pipeline Cycles</h2>
          <div className="flex flex-col gap-4">
            {cycles.map((cycle, i) => (
              <CycleCard key={cycle.cycleNumber} cycle={cycle} index={i} />
            ))}
          </div>
        </section>

        {/* AI Reviews */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-4">AI Review Inspector</h2>
          <ReviewInspector pullRequests={data.pullRequests} />
        </section>

        {/* Failure Timeline */}
        <FailureTimeline />
      </div>
    </main>
  );
}
