import React from "react";

export default function Description({ problem }) {
  if (!problem) return <p>Loading…</p>;
  return (
    <div style={{ padding: 10 }}>
      <h3>Problem</h3>
      <p style={{ whiteSpace: "pre-wrap" }}>{problem.question}</p>
      <h3>Details</h3>
      <p style={{ whiteSpace: "pre-wrap" }}>{problem.description || "No description available."}</p>
      {problem.tags?.length > 0 && <p><strong>Tags:</strong> {problem.tags.join(", ")}</p>}
    </div>
  );
}
