import * as React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead,
  TablePagination, TableRow, TextField, Dialog, DialogActions,
  DialogContent, DialogTitle
} from '@mui/material';

const columns = [
  
  { id: 'title', label: 'Title', minWidth: 200 },
  { id: 'difficulty', label: 'Difficulty', minWidth: 150, align: 'right' },
];

export default function Question() {
  console.log("Question component loaded");

  const [questions, setQuestions] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const [newQuestion, setNewQuestion] = useState({
   
    title: '',
    question: '',
    description: '',
    difficulty: '',
    testCases: [{ input: '', expectedOutput: '' }]
  });

  // Fetch questions from the backend
  useEffect(() => {
    axios.get('http://localhost:5000/api/questions')
      .then(response => {
        console.log("Fetched Questions:", response.data);
        setQuestions(response.data);
      })
      .catch(error => console.error('Error fetching questions:', error));
  }, []);

  // Handle pagination
  const handleChangePage = (_, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  // Handle modal open/close
  const handleClickOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setNewQuestion(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle test case input change
  const handleTestCaseChange = (index, field, value) => {
    const updatedTestCases = [...newQuestion.testCases];
    updatedTestCases[index][field] = value;
    setNewQuestion(prev => ({ ...prev, testCases: updatedTestCases }));
  };

  // Add a new test case
  const addTestCase = () => {
    setNewQuestion(prev => ({
      ...prev,
      testCases: [...prev.testCases, { input: '', expectedOutput: '' }]
    }));
  };

  // Handle adding a new question
  const handleAddQuestion = () => {
    const formattedQuestion = {
     
      title: newQuestion.title.trim(),
      question: newQuestion.question.trim(),
      description: newQuestion.description.trim(),
     
      
      difficulty: newQuestion.difficulty.trim(),
      testCases: newQuestion.testCases.filter(tc => tc.input.trim() !== '' && tc.expectedOutput.trim() !== '')
    };

    if (
        !['Easy', 'Medium', 'Hard'].includes(formattedQuestion.difficulty) ) {
      alert("Invalid input. Check Difficulty");
      return;
    }

    axios.post("http://localhost:5000/api/questions", formattedQuestion)
      .then(response => {
        setQuestions(prev => [...prev, response.data]);
        setNewQuestion({
         
          title: '',
          question: '',
          description: '',
          difficulty: '',
          testCases: [{ input: '', expectedOutput: '' }]
        });
        handleClose();
      })
      .catch(error => console.error("Error adding question:", error));
  };

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden', padding: 2 }}>
      <Button variant="contained" color="primary" onClick={handleClickOpen}>
        Add Question
      </Button>

      {questions.length === 0 ? (
        <p>No questions available.</p>
      ) : (
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader aria-label="question table">
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell key={column.id} align={column.align} style={{ minWidth: column.minWidth }}>
                    {column.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {questions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => (
                <TableRow hover key={row._id || row.title} onClick={() => navigate('/admin-dashboard/Question/Problem', { state: row })}>
                  {columns.map((column) => (
                    <TableCell key={column.id} align={column.align}>{row[column.id]}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

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
         
          <TextField margin="dense" label="Title" name="title" fullWidth onChange={handleInputChange} />
          <TextField margin="dense" label="Question" name="question" fullWidth multiline rows={2} onChange={handleInputChange} />
          <TextField margin="dense" label="Description" name="description" fullWidth multiline rows={2} onChange={handleInputChange} />
          <TextField margin="dense" label="Difficulty" name="difficulty" fullWidth onChange={handleInputChange} />

          {/* Test Cases */}
          {newQuestion.testCases.map((testCase, index) => (
            <div key={index} style={{ marginTop: 10 }}>
              <TextField
                margin="dense"
                label={`Test Case ${index + 1} - Input`}
                fullWidth
                multiline
                rows={2}
                value={testCase.input}
                onChange={(e) => handleTestCaseChange(index, "input", e.target.value)}
              />
              <TextField
                margin="dense"
                label={`Test Case ${index + 1} - Expected Output`}
                fullWidth
                value={testCase.expectedOutput}
                onChange={(e) => handleTestCaseChange(index, "expectedOutput", e.target.value)}
              />
            </div>
          ))}

          <Button variant="contained" onClick={addTestCase} sx={{ mt: 1 }}>
            + Add Test Case
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="secondary">Cancel</Button>
          <Button onClick={handleAddQuestion} color="primary">Add</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
