import React, { useCallback, useEffect, useState } from "react";
import { Table, Spin, Alert } from "antd";

const Submission = ({ questionId, output, message, refreshTrigger }) => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const fetchSubmissions = useCallback(async () => {
    if (!questionId) {
      setSubmissions([]); // Reset when no question is selected
      return;
    }
  
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/submissions?questionId=${questionId}`);
      const data = await response.json();
  
      if (response.ok) {
        const processedData = data.map(submission => ({
          ...submission,
          executionTime: submission.executionTime || "N/A",
          memoryUsed: submission.memoryUsed || "N/A"
        }));
        setSubmissions(processedData);
        setError("");
      } else {
        setError("Failed to fetch submissions");
      }
    } catch (err) {
      setError("Error fetching submissions");
    } finally {
      setLoading(false);
    }
  }, [questionId]);
  
  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions, refreshTrigger]);

  
  const columns = [
    {
      title: "Username",
      dataIndex: "username",
      key: "username",
      sorter: (a, b) => a.username.localeCompare(b.username),
    },
    {
      title: "Execution Time (ms)",
      dataIndex: "executionTime",
      key: "executionTime",
      sorter: (a, b) => {
        const aValue = parseFloat(a.executionTime) || 0;
        const bValue = parseFloat(b.executionTime) || 0;
        return aValue - bValue;
      },
      render: (time) => <span>{time !== "N/A" ? `${time} ms` : "N/A"}</span>,
    },
    {
      title: "Memory Used (KB)",
      dataIndex: "memoryUsed",
      key: "memoryUsed",
      sorter: (a, b) => {
        const aValue = parseFloat(a.memoryUsed) || 0;
        const bValue = parseFloat(b.memoryUsed) || 0;
        return aValue - bValue;
      },
      render: (memory) => <span>{memory !== "N/A" ? `${memory} KB` : "N/A"}</span>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <span style={{ color: status === "Passed" ? "green" : "red", fontWeight: "bold" }}>
          {status}
        </span>
      ),
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
                <pre>{output}</pre>
                <p><strong>Execution Time:</strong></p>
                <p><strong>Memory Used:</strong></p>

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
      <pre style={{ background: "#eef", padding: "10px", borderRadius: "5px" }}>
        {output || "No output yet."}
      </pre>

      {message && <p style={{ color: "blue", fontWeight: "bold" }}>{message}</p>}
    </div>
  );
};

export default Submission;
