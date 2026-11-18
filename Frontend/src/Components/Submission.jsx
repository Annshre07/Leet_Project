import React, { useCallback, useEffect, useState } from "react";
import { Table, Spin, Alert, Tag } from "antd";
import api, { errorMessage } from "../api/client";

export const verdictColor = (v) =>
  ({ Accepted: "green", "Wrong Answer": "red", "Compilation Error": "orange", "Runtime Error": "volcano", "Time Limit Exceeded": "gold", "Memory Limit Exceeded": "purple" }[v] || "default");

// Lists the signed-in user's own submissions for one problem. Code is fetched on demand when a row is expanded.
export default function Submission({ questionId, refreshTrigger }) {
  const [data, setData] = useState({ items: [], total: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [details, setDetails] = useState({});

  const load = useCallback(async () => {
    if (!questionId) return;
    setLoading(true);
    try {
      const { data: d } = await api.get("/api/submissions", { params: { questionId, page, limit: 10 } });
      setData(d);
      setError("");
    } catch (e) { setError(errorMessage(e, "Could not load submissions")); }
    finally { setLoading(false); }
  }, [questionId, page]);

  useEffect(() => { load(); }, [load, refreshTrigger]);
  useEffect(() => { setPage(1); setDetails({}); }, [questionId]);

  const expand = async (open, record) => {
    if (!open || details[record._id]) return;
    try {
      const { data: d } = await api.get(`/api/submissions/${record._id}`);
      setDetails((x) => ({ ...x, [record._id]: d }));
    } catch (e) { setDetails((x) => ({ ...x, [record._id]: { error: errorMessage(e) } })); }
  };

  const columns = [
    { title: "ID", dataIndex: "_id", key: "id", render: (id) => <code>{String(id).slice(-6)}</code> },
    { title: "Time", dataIndex: "time", key: "time", render: (t) => new Date(t).toLocaleString() },
    { title: "Language", dataIndex: "language", key: "language" },
    { title: "Verdict", dataIndex: "verdict", key: "verdict", render: (v, r) => <span><Tag color={verdictColor(v)}>{v}</Tag>{!r.serverVerified && <Tag title="Graded by the old browser-side checker; not verified by the server">legacy</Tag>}</span> },
    { title: "Passed", key: "passed", render: (_, r) => (r.totalCount ? `${r.passedCount}/${r.totalCount}` : "–") },
    { title: "Score", dataIndex: "score", key: "score", render: (s) => (s === undefined || s === null ? "–" : `${s}%`) },
    { title: "Runtime", dataIndex: "executionTime", key: "rt", render: (t) => (t === undefined || t === null ? "–" : `${t} ms`) },
    { title: "Memory", dataIndex: "memoryUsed", key: "mem", render: (m) => (m === undefined || m === null ? "–" : `${m} KB`) },
  ];

  return (
    <div style={{ padding: 12, background: "#fff", borderRadius: 5, boxShadow: "0 0 5px #ddd" }}>
      <h3>My submissions</h3>
      <p style={{ color: "#666", fontSize: 12 }}>Runtime and memory are measured on this server and depend on its hardware; compare them only with each other.</p>
      {error && <Alert message={error} type="error" showIcon />}
      <Spin spinning={loading}>
        <Table
          size="small" rowKey="_id" columns={columns} dataSource={data.items} locale={{ emptyText: "No submissions yet." }}
          pagination={{ current: page, pageSize: 10, total: data.total, onChange: setPage, showSizeChanger: false }}
          expandable={{
            onExpand: expand,
            expandedRowRender: (r) => {
              const d = details[r._id];
              if (!d) return <Spin size="small" />;
              if (d.error) return <Alert type="error" message={d.error} />;
              return (
                <div>
                  {d.compileOutput && <pre style={{ background: "#fff4f0", padding: 8, whiteSpace: "pre-wrap" }}>{d.compileOutput}</pre>}
                  <pre style={{ maxHeight: 240, overflow: "auto", background: "#f5f5f5", padding: 8 }}>{d.code}</pre>
                </div>
              );
            },
          }}
        />
      </Spin>
    </div>
  );
}
