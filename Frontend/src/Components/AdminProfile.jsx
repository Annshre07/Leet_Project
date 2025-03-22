import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination
} from "@mui/material";
import "../Utils/AdminProfile.css";

const AdminProfile = () => {
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const navigate = useNavigate();
  const token = localStorage.getItem("authToken");

  const adminEmail = "sashankcherukuri7@gmail.com";

  useEffect(() => {
    const fetchUsers = async () => {

      try {
        const response = await axios.get("http://localhost:5000/api/admin/users", {
          headers: {
            Authorization: `Bearer ${token}`, // Send token in request
          },
        });

        setUsers(response.data); // Update state with fetched users
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  });

  // Promote a user to admin
  const handleMakeAdmin = async (userId) => {
    try {
      const token = localStorage.getItem("authToken"); // Retrieve token
  
      const response = await axios.post(
        "http://localhost:5000/api/auth/promote",
        { userId },
        {
          headers: { Authorization: `Bearer ${token}` }, // Pass token for authentication
        }
      );
  
      alert(response.data.message);
      setUsers(users.map(user =>
        user._id === userId ? { ...user, role: "admin" } : user
      ));
    } catch (error) {
      console.error("Error promoting user:", error);
      alert(error.response?.data?.message || "Failed to promote user");
    }
  };
  

  return (
    <div className="admin-container">
      <h2 className="admin-title">Admin Profile</h2>
      
      {/* Admin Information */}
      <div className="admin-info">
        <p><strong>Username:</strong> sashank</p>
        <p><strong>Email:</strong> {adminEmail}</p>
        <p><strong>Role:</strong> admin</p>
      </div>

      {/* Users Table */}
      <h3 className="admin-title">Promote Users</h3>
      <TableContainer component={Paper} className="table-container">
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell className="table-header">Username</TableCell>
              <TableCell className="table-header">Email</TableCell>
              <TableCell className="table-header">Role</TableCell>
              <TableCell className="table-header">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((user) => (
              <TableRow key={user._id} className="table-row">
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>
                  {user.role !== "admin" && (
                    <Button
                      className="make-admin-btn"
                      onClick={() => handleMakeAdmin(user._id)}
                    >
                      Make Admin
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        className="pagination"
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={users.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        onRowsPerPageChange={(event) => {
          setRowsPerPage(+event.target.value);
          setPage(0);
        }}
      />

      {/* Back to Dashboard */}
      <button className="back-btn" onClick={() => navigate("/Dashboard")}>
        Back to Dashboard
      </button>
    </div>
  );
};

export default AdminProfile;
