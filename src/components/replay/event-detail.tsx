"use client";

import { motion } from "framer-motion";
import type { TimelineEvent } from "./timeline";
import type { PipelineData } from "@/data/types";

interface EventDetailProps {
  event: TimelineEvent;
  data: PipelineData;
}

function fmtTimestamp(ts: string): string {
  const d = new Date(ts);
  return `${d.toISOString().slice(0, 10)} ${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")} UTC`;
}

const REVIEW_STATE_STYLES: Record<string, string> = {
  APPROVED: "bg-green-900 text-green-300",
  CHANGES_REQUESTED: "bg-red-900 text-red-300",
  COMMENTED: "bg-gray-700 text-gray-300",
  DISMISSED: "bg-gray-700 text-gray-300",
};

export function EventDetail({ event, data }: EventDetailProps) {
  const content = (() => {
    if (event.type === "issue") {
      const num = parseInt(event.id.replace("issue-created-", ""), 10);
      const issue = data.issues.find((i) => i.number === num);
      if (!issue) return <p className="text-gray-400 text-sm">{event.title}</p>;
      return (
        <>
          <h3 className="text-white font-semibold mb-2">{issue.title}</h3>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {issue.labels.map((label) => (
              <span
                key={label.name}
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{
                  backgroundColor: `#${label.color}33`,
                  color: `#${label.color}`,
                  border: `1px solid #${label.color}66`,
                }}
              >
                {label.name}
              </span>
            ))}
          </div>
          {issue.body && (
            <p className="text-gray-400 text-sm leading-relaxed line-clamp-4">
              {issue.body.slice(0, 500)}
            </p>
          )}
        </>
      );
    }

    if (event.type === "pr") {
      const num = parseInt(event.id.replace("pr-opened-", ""), 10);
      const pr = data.pullRequests.find((p) => p.number === num);
      if (!pr) return <p className="text-gray-400 text-sm">{event.title}</p>;
      const closingMatch = pr.body?.match(/Closes\s+#(\d+)/i);
      const linkedIssue = closingMatch ? parseInt(closingMatch[1], 10) : null;
      return (
        <>
          <h3 className="text-white font-semibold mb-2">{pr.title}</h3>
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="text-green-400 font-mono">+{pr.additions}</span>
            <span className="text-red-400 font-mono">-{pr.deletions}</span>
            <span className="text-gray-400">{pr.changedFiles} file{pr.changedFiles !== 1 ? "s" : ""} changed</span>
            {linkedIssue && (
              <span className="text-blue-400 font-mono">Closes #{linkedIssue}</span>
            )}
          </div>
        </>
      );
    }

    if (event.type === "review") {
      // id format: review-{prNumber}-{index}
      const parts = event.id.split("-");
      const prNum = parseInt(parts[1], 10);
      const idx = parseInt(parts[2], 10);
      const pr = data.pullRequests.find((p) => p.number === prNum);
      const review = pr?.reviews[idx];
      if (!review) return <p className="text-gray-400 text-sm">{event.title}</p>;
      return (
        <>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-white font-semibold">{review.author}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${REVIEW_STATE_STYLES[review.state] ?? "bg-gray-700 text-gray-300"}`}>
              {review.state === "CHANGES_REQUESTED" ? "REQUEST_CHANGES" : review.state}
            </span>
          </div>
          {review.body && (
            <p className="text-gray-400 text-sm">{review.body}</p>
          )}
        </>
      );
    }

    if (event.type === "merge") {
      const num = parseInt(event.id.replace("pr-merged-", ""), 10);
      const pr = data.pullRequests.find((p) => p.number === num);
      if (!pr) return <p className="text-gray-400 text-sm">{event.title}</p>;
      return (
        <>
          <h3 className="text-white font-semibold mb-2">{pr.title}</h3>
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="text-gray-400">{pr.mergedAt ? fmtTimestamp(pr.mergedAt) : "—"}</span>
            <span className="bg-purple-900 text-purple-300 text-xs px-2 py-0.5 rounded-full font-medium">
              Auto-merged via squash
            </span>
          </div>
        </>
      );
    }

    return null;
  })();

  return (
    <motion.div
      key={event.id}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="bg-gray-800 rounded-lg px-6 py-4"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">{content}</div>
        <span className="text-gray-500 text-xs font-mono flex-shrink-0 mt-0.5">
          {fmtTimestamp(event.timestamp)}
        </span>
      </div>
    </motion.div>
  );
}
