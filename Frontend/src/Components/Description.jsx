import React from "react";

export default function Description({ problem }) {
  return (
    <div style={{ padding: "10px" }}>
      <h3>Description</h3>
      <p>{problem?.description || "No description available."}</p>
    </div>
  );
}
