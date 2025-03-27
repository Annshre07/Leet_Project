import React, { useCallback, useEffect, useState } from "react";
import { Table, Spin, Alert } from "antd";

const Submission = ({ questionId, output, message, refreshTrigger }) => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  console.log("Current questionId:", questionId); // 🔹 Debugging

  // ✅ Fetch Submissions Function
  const fetchSubmissions = useCallback(async () => {
    if (!questionId) {
      setSubmissions([]); // 🔹 Reset when no question is selected
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/submissions?questionId=${questionId}`);
      const data = await response.json();
      if (response.ok) {
        setSubmissions(data);
        setError("");
      } else {
        setError("Failed to fetch submissions");
      }
    } catch (err) {
      setError("Error fetching submissions");
    } finally {
      setLoading(false);
    }
  }, [questionId]); // 🔹 Dependencies updated

  // ✅ useEffect - calls fetchSubmissions whenever questionId or refreshTrigger changes.
  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions, refreshTrigger]); // 🔹 Triggers fetch on ID change

  const columns = [
    {
      title: "Username",
      dataIndex: "username",
      key: "username",
      sorter: (a, b) => a.username.localeCompare(b.username),
    },
  ];

  return (
    <div style={{ padding: "20px", background: "#fff", borderRadius: "5px", boxShadow: "0px 0px 5px #ddd" }}>
      <h3>Submissions for Question ID: {questionId || "None Selected"}</h3>

      {loading ? (
        <Spin size="large" />
      ) : error ? (
        <Alert message={error} type="error" showIcon />
      ) : submissions.length > 0 ? (
        <Table
          columns={columns}
          dataSource={submissions.map((item, index) => ({ ...item, key: index }))}
          pagination={{ pageSize: 5 }}
          expandable={{
            expandedRowRender: (record) => (
              <div style={{ padding: "10px", background: "#f9f9f9", borderRadius: "5px" }}>
                <p>
                  <strong>Code:</strong>
                  <pre style={{ maxWidth: "300px", overflowX: "auto", background: "#f5f5f5", padding: "5px" }}>
                    {record.code}
                  </pre>
                </p>
                <p>
                  <strong>Time:</strong> {new Date(record.time).toLocaleString()}
                </p>
                <p>
                  <strong>Status:</strong>
                  <span style={{ color: record.status === "Passed" ? "green" : "red", fontWeight: "bold" }}>
                    {record.status}
                  </span>
                </p>
              </div>
            ),
            rowExpandable: () => true,
          }}
        />
      ) : (
        <p>No submissions yet.</p>
      )}

      <h4>Output:</h4>
      <pre style={{ background: "#eef", padding: "10px", borderRadius: "5px" }}>{output || "No output yet."}</pre>

      {message && <p style={{ color: "blue", fontWeight: "bold" }}>{message}</p>}
    </div>
  );
};

export default Submission;
