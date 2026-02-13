import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

const assignments = [
  {
    id: 1,
    subject: 'Artificial Intelligence',
    title: 'Assignment 1',
    dueDate: 'May 10, 2024',
    submissionDate: 'May 8, 2024',
    status: 'Submitted'
  },
  {
    id: 2,
    subject: 'Data Structures', 
    title: 'Project Report',
    dueDate: 'May 15, 2024',
    submissionDate: '-',
    status: 'Pending'
  },
  {
    id: 3,
    subject: 'Computer Networks',
    title: 'Homework 3',
    dueDate: 'May 20, 2024',
    submissionDate: 'May 18, 2024',
    status: 'Submitted'
  },
  {
    id: 4,
    subject: 'Operating Systems',
    title: 'Assignment 2',
    dueDate: 'May 25, 2024',
    submissionDate: 'May 25, 2024',
    status: 'Flagged'
  }
];

export function AssignmentsTable() {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Submitted':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">submitted</Badge>;
      case 'Pending':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Pending</Badge>;
      case 'Flagged':
        return <Badge variant="destructive">Plagiarism flagged</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getActionButton = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Button size="sm" variant="outline">Upload</Button>;
      case 'Submitted':
      case 'Flagged':
        return <Button size="sm" variant="ghost">View</Button>;
      default:
        return null;
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Subject</TableHead>
          <TableHead>Title</TableHead>
          <TableHead>Due Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Submission Date</TableHead>
          <TableHead>Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {assignments.map((assignment) => (
          <TableRow key={assignment.id}>
            <TableCell className="text-sm text-gray-600">
              {assignment.subject}
            </TableCell>
            <TableCell>{assignment.title}</TableCell>
            <TableCell>{assignment.dueDate}</TableCell>
            <TableCell>
              {getStatusBadge(assignment.status)}
            </TableCell>
            <TableCell>{assignment.submissionDate}</TableCell>
            <TableCell>
              {getActionButton(assignment.status)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}