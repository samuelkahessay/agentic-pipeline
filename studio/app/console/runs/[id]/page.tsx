import { api } from "@/lib/api";
import { StageTrack } from "@/components/console/stage-track";
import { DecisionTrail } from "@/components/console/decision-trail";
import { ArtifactsList } from "@/components/console/artifacts-list";
import styles from "./page.module.css";

export default async function RunDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [run, decisions] = await Promise.all([api.getRun(id), api.getDecisions(id)]);
  if (!run) return <p>Run not found.</p>;
  return (
    <div className={styles.detail}>
      <div className={styles.header}>
        <h2>Run #{run.id.slice(0, 4)} — {run.summary}</h2>
        <span className={styles.meta}>{run.status} · {run.mode} · started {new Date(run.createdAt).toLocaleString()}</span>
      </div>
      <StageTrack events={run.events || []} />
      <h3 className={styles.sectionLabel}>Decision trail</h3>
      <DecisionTrail entries={decisions} />
      <h3 className={styles.sectionLabel}>Artifacts</h3>
      <ArtifactsList run={run} />
    </div>
  );
}
