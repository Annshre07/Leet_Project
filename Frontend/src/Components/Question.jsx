import * as React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
//axios.post('http://localhost:5000/api/questions', newQuestion)

const columns = [
  { id: 'status', label: 'Status', minWidth: 100 },
  { id: 'title', label: 'Title', minWidth: 200 },
  { id: 'solution', label: 'Solution', minWidth: 150 },
  { id: 'acceptance', label: 'Acceptance', minWidth: 150, align: 'right' },
  { id: 'difficulty', label: 'Difficulty', minWidth: 150, align: 'right' },
];

export default function Question() {
  const [questions, setQuestions] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    status: '',
    title: '',
    solution: '',
    acceptance: '',
    difficulty: ''
  });

  // Fetch questions from the backend
  useEffect(() => {
    axios.get('http://localhost:5000/api/questions')
      .then(response => setQuestions(response.data))
      .catch(error => console.error('Error fetching questions:', error));
  }, []);

  // Handle pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  // Handle modal open/close
  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  // Handle input change
  const handleInputChange = (event) => {
    setNewQuestion({ ...newQuestion, [event.target.name]: event.target.value });
  };

  // Handle adding a new question
  const handleAddQuestion = () => {
    // Convert acceptance to a number and trim values
    const formattedQuestion = {
      status: newQuestion.status.trim(),
      title: newQuestion.title.trim(),
      solution: newQuestion.solution.trim(),
      acceptance: Number(newQuestion.acceptance), // Convert string to number
      difficulty: newQuestion.difficulty.trim(),
    };
  
    // Validation checks
    if (
      !['Pending', 'Solved', 'Attempted'].includes(formattedQuestion.status) ||
      !['Easy', 'Medium', 'Hard'].includes(formattedQuestion.difficulty) ||
      isNaN(formattedQuestion.acceptance) ||
      formattedQuestion.acceptance < 0 ||
      formattedQuestion.acceptance > 100
    ) {
      alert("Please enter valid values:\n- Status: Pending, Solved, Attempted\n- Difficulty: Easy, Medium, Hard\n- Acceptance: A number between 0-100");
      return;
    }
  
    // Send POST request to backend
    axios
      .post("http://localhost:5000/api/questions", formattedQuestion)
      .then(response => {
        setQuestions(prevQuestions => [...prevQuestions, response.data]); // Correct state update
        setNewQuestion({ status: '', title: '', solution: '', acceptance: '', difficulty: '' }); // Reset form
        handleClose(); // Close modal
      })
      .catch(error => {
        console.error("Error adding question:", error.response?.data || error.message);
        alert("Failed to add question. Please check your input.");
      });
  };
  

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden', padding: 2 }}>
      <Button variant="contained" color="primary" onClick={handleClickOpen}>
        Add Question
      </Button>

      <TableContainer sx={{ maxHeight: 440 }}>
        <Table stickyHeader aria-label="question table">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align}
                  style={{ minWidth: column.minWidth }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {questions
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row) => (
                <TableRow hover role="checkbox" tabIndex={-1} key={row._id} onClick={() => navigate('/problem', { state: row })}>
                  {columns.map((column) => {
                    const value = row[column.id];
                    return <TableCell key={column.id} align={column.align}>{value}</TableCell>;
                  })}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={questions.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />

      {/* Add Question Modal */}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Add New Question</DialogTitle>
        <DialogContent>
          <TextField margin="dense" label="Status" name="status" fullWidth onChange={handleInputChange} />
          <TextField margin="dense" label="Title" name="title" fullWidth onChange={handleInputChange} />
          <TextField margin="dense" label="Solution" name="solution" fullWidth onChange={handleInputChange} />
          <TextField margin="dense" label="Acceptance" name="acceptance" fullWidth onChange={handleInputChange} />
          <TextField margin="dense" label="Difficulty" name="difficulty" fullWidth onChange={handleInputChange} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="secondary">Cancel</Button>
          <Button onClick={handleAddQuestion} color="primary">Add</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
