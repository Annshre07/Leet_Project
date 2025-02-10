import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';

const columns = [
  { id: 'status', label: 'Status', minWidth: 100 },
  { id: 'title', label: 'Title', minWidth: 200 },
  { id: 'solution', label: 'Solution', minWidth: 150 },
  { id: 'acceptance', label: 'Acceptance', minWidth: 150, align: 'right' },
  { id: 'difficulty', label: 'Difficulty', minWidth: 150, align: 'right' },
];

function createData(status, title, solution, acceptance, difficulty) {
  return { status, title, solution, acceptance, difficulty };
}

const rows = [
  createData('Completed', 'Two Sum', 'Optimal', '92%', 'Easy'),
  createData('In Progress', 'Binary Search', 'Work in Progress', '85%', 'Medium'),
  createData('Pending', 'Graph Traversal', 'Not Attempted', '76%', 'Hard'),
  createData('Completed', 'Sorting Algorithms', 'Optimal', '95%', 'Easy'),
  createData('Pending', 'Dynamic Programming', 'Not Attempted', '60%', 'Hard'),
];

export default function Question() {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(5);
  const navigate = useNavigate();

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

const handleRowClick = (row) => {
  navigate('/problem', { state: row }); 
};


  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <TableContainer sx={{ maxHeight: 440 }}>
        <Table stickyHeader aria-label="status table">
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
            {rows
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row) => (
                <TableRow hover role="checkbox" tabIndex={-1} key={row.title} onClick={() => handleRowClick(row)}>
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
        count={rows.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
}
