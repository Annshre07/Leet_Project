import * as React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment-timezone';

import {
  Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead,
  TablePagination, TableRow, TextField, Dialog, DialogActions,
  DialogContent, DialogTitle
} from '@mui/material';

const columns = [
  
  { id: 'title', label: 'Title', minWidth: 200 },
  { id: 'difficulty', label: 'Difficulty', minWidth: 150, align: 'right' },
  { id: 'deadline', label: 'Deadline', minWidth: 200, align: 'right' },  // ✅ Add Deadline Column

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
    deadline:'',
    testCases: [{ input: '', expectedOutput: '' }]
  });

  // Fetch questions from the backend
  useEffect(() => {
    const fetchQuestions = () => {
      axios.get('http://localhost:5000/api/questions')
    .then(response => {
        console.log("Fetched Questions:", response.data);
        const questionsWithIST = response.data.map(q => ({
            ...q,
            deadline: q.deadline ? moment(q.deadline).format("YYYY-MM-DD") : "No Deadline" 
        }));
        setQuestions(questionsWithIST);
    })
//Idhar
        .catch(error => console.error('Error fetching questions:', error));
    };
    
    fetchQuestions();
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
      language: newQuestion.language.trim(), 
      difficulty: newQuestion.difficulty.trim(),
      testCases: newQuestion.testCases,  // Don't filter out empty test cases

     // Store deadline in IST format
    deadline: newQuestion.deadline
    ? moment(newQuestion.deadline).format("YYYY-MM-DD")  // Send only the date (YYYY-MM-DD)
    : null

    };

    if (
        !['Easy', 'Medium', 'Hard'].includes(formattedQuestion.difficulty) ) {
      alert("Invalid input. Check Difficulty");
      return;
    }

    axios.post("http://localhost:5000/api/questions", formattedQuestion)
      .then(response => {
        axios.get('http://localhost:5000/api/questions')
        .then(response => {
            setQuestions(response.data);
        })
        .catch(error => console.error('Error fetching updated questions:', error));
    
        setNewQuestion({
         
          title: '',
          question: '',
          description: '',
          difficulty: '',
           language: '',
          deadline:'',
          testCases: [{ input: '', expectedOutput: '' }]
        });
        handleClose();
      })
      .catch(error => console.error("Error adding question:", error));
  };
  // Function to handle question deletion
  const handleDeleteQuestion = (id) => {
    if (window.confirm("Are you sure you want to delete this question?")) {
      axios.delete(`http://localhost:5000/api/questions/${id}`, {
        headers: { admin: "true" } //  Send the admin header
    })
    .then(() => {
        setQuestions(prev => prev.filter(question => question._id !== id));
    })
    .catch(error => console.error(" Error deleting question:", error));
    
    }
  };
  // Added delete functionality above ⬆️

 

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
                 <TableCell>Actions</TableCell> {/* Added Actions column for delete button */}
              </TableRow>
            </TableHead>
            <TableBody>
  {questions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => (
    <TableRow 
      hover 
      key={row._id || row.title} 
      onClick={() => navigate('/admin-dashboard/Question/Problem', { state: row })}
    >
      {columns.map((column) => (
        <TableCell key={column.id} align={column.align}>
          {column.id === 'deadline' ? row[column.id] || "No Deadline" : row[column.id]}
        </TableCell>
      ))}
      <TableCell>
        <Button 
          variant="contained" 
          color="secondary" 
          onClick={(e) => {
            e.stopPropagation(); // Prevents row click navigation when deleting
            handleDeleteQuestion(row._id);
          }}
        >
          Delete
        </Button>
      </TableCell>
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

      {/* Add suestion Modal */}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Add New Question</DialogTitle>
        <DialogContent>
         
          <TextField margin="dense" label="Title" name="title" fullWidth onChange={handleInputChange} />
          <TextField margin="dense" label="Question" name="question" fullWidth multiline rows={2} onChange={handleInputChange} />
          <TextField margin="dense" label="Language" name="language" fullWidth multiline rows={2} onChange={handleInputChange} />      
          <TextField margin="dense" label="Description" name="description" fullWidth multiline rows={2} onChange={handleInputChange} />
          <TextField margin="dense" label="Difficulty" name="difficulty" fullWidth onChange={handleInputChange} />
          <TextField margin="dense" label="Deadline YYYY-MM-DD" name="deadline" fullWidth multiline rows={2} onChange={handleInputChange} />
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
