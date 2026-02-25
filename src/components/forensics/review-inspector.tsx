import type { PipelinePR } from "@/data/types";

interface ReviewInspectorProps {
  pullRequests: PipelinePR[];
}

function fmtTime(ts: string): string {
  const d = new Date(ts);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")} UTC`;
}

export function ReviewInspector({ pullRequests }: ReviewInspectorProps) {
  // Flatten and sort all reviews by submittedAt
  const reviews = pullRequests
    .flatMap((pr) =>
      pr.reviews.map((r) => ({
        pr,
        review: r,
      }))
    )
    .sort(
      (a, b) =>
        new Date(a.review.submittedAt).getTime() -
        new Date(b.review.submittedAt).getTime()
    );

  if (reviews.length === 0) {
    return <p className="text-gray-400">No reviews found.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {reviews.map(({ pr, review }, i) => {
        const isApproved = review.state === "APPROVED";
        const isChangesRequested = review.state === "CHANGES_REQUESTED";
        const isFallback =
          review.body.toLowerCase().includes("ai review was unavailable");

        return (
          <div
            key={`${pr.number}-${i}`}
            className="bg-gray-800 rounded-xl p-6 border border-gray-700"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className="text-gray-500 font-mono text-sm mr-2">
                  #{pr.number}
                </span>
                <span className="text-white font-medium">{pr.title}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                {isFallback && (
                  <span className="text-xs bg-yellow-900 text-yellow-300 px-2 py-0.5 rounded font-medium">
                    Fallback Review
                  </span>
                )}
                {isApproved && (
                  <span className="text-xs bg-green-900 text-green-300 px-2 py-0.5 rounded font-semibold">
                    APPROVED
                  </span>
                )}
                {isChangesRequested && (
                  <span className="text-xs bg-red-900 text-red-300 px-2 py-0.5 rounded font-semibold">
                    CHANGES REQUESTED
                  </span>
                )}
                {!isApproved && !isChangesRequested && (
                  <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded font-medium">
                    {review.state}
                  </span>
                )}
              </div>
            </div>

            {/* Meta */}
            <div className="text-sm text-gray-400 mb-3">
              <span className="font-mono">{review.author}</span>
              {review.submittedAt && (
                <span className="ml-3 text-gray-500">
                  {fmtTime(review.submittedAt)}
                </span>
              )}
            </div>

            {/* Review body */}
            {review.body && (
              <div className="overflow-y-auto max-h-48 bg-gray-900 rounded-lg p-4">
                <pre className="font-mono text-xs text-gray-300 whitespace-pre-wrap">
                  {review.body}
                </pre>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
