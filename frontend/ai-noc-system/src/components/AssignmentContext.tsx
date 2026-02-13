import { createContext, useContext, useState, type ReactNode } from 'react';

export interface Assignment {
  id: string;
  title: string;
  description: string;
  subject: string;
  class: string;
  division: string;
  batch: string;
  dueDate: string;
  createdDate: string;
  assignmentFile?: File | null;
  solutionFile?: File | null;
  maxMarks: number;
  instructions: string;
  status: 'draft' | 'published' | 'expired';
  teacherName?: string;
  createdBy?: string;
  assignmentType?: string; // Added assignment type field
}

export interface StudentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  studentRollNo: string;
  submissionFile?: File | null;
  submissionDate: string;
  status: 'submitted' | 'late' | 'pending';
  grade?: number;
  feedback?: string;
  plagiarismScore?: number;
}

interface AssignmentContextType {
  assignments: Assignment[];
  studentSubmissions: StudentSubmission[];
  addAssignment: (assignment: Assignment) => void;
  updateAssignment: (id: string, assignment: Partial<Assignment>) => void;
  deleteAssignment: (id: string) => void;
  addStudentSubmission: (submission: StudentSubmission) => void;
  updateStudentSubmission: (id: string, submission: Partial<StudentSubmission>) => void;
  getAssignmentsForStudent: (studentClass: string, studentDivision: string) => Assignment[];
  getStudentSubmission: (assignmentId: string, studentId: string) => StudentSubmission | undefined;
}

const AssignmentContext = createContext<AssignmentContextType | undefined>(undefined);

export function AssignmentProvider({ children }: { children: ReactNode }) {
  const [assignments, setAssignments] = useState<Assignment[]>([
    // Sample assignments for testing
    {
      id: '1',
      title: 'Data Structures - Binary Trees Implementation',
      description: 'Implement binary search tree with insert, delete, and search operations',
      subject: 'Data Structures',
      class: 'TE IT',
      division: 'A',
      batch: 'Batch 1',
      dueDate: '2024-02-15',
      createdDate: '2024-01-20',
      maxMarks: 50,
      instructions: 'Implement BST in C++ with proper documentation. Include test cases and time complexity analysis.',
      status: 'published',
      teacherName: 'Prof. Sharma',
      createdBy: 'teacher1',
      assignmentType: 'Practical Assignment'
    },
    {
      id: '2',
      title: 'Database Design Project',
      description: 'Design a complete database system for library management',
      subject: 'Database Management',
      class: 'TE IT',
      division: 'A',
      batch: 'Batch 1',
      dueDate: '2024-02-20',
      createdDate: '2024-01-25',
      maxMarks: 100,
      instructions: 'Create ER diagram, normalize tables, write SQL queries, and implement basic CRUD operations.',
      status: 'published',
      teacherName: 'Prof. Patel',
      createdBy: 'teacher2',
      assignmentType: 'Theory Assignment'
    },
    {
      id: '3',
      title: 'Network Security Analysis',
      description: 'Analyze network security protocols and implement basic encryption',
      subject: 'Computer Networks',
      class: 'TE IT',
      division: 'A',
      batch: 'Batch 1',
      dueDate: '2024-02-25',
      createdDate: '2024-01-30',
      maxMarks: 75,
      instructions: 'Study RSA, DES algorithms. Implement one encryption algorithm and write a report on network security best practices.',
      status: 'published',
      teacherName: 'Prof. Kumar',
      createdBy: 'teacher3',
      assignmentType: 'Home Assignment'
    }
  ]);

  const [studentSubmissions, setStudentSubmissions] = useState<StudentSubmission[]>([
    {
      id: '1',
      assignmentId: '1',
      studentId: 'student1',
      studentName: 'Gaurang Chavan',
      studentRollNo: '21310104',
      submissionDate: '2024-02-14',
      status: 'submitted',
      grade: 45,
      feedback: 'Good implementation, minor optimization needed',
      plagiarismScore: 15
    }
  ]);

  const addAssignment = (assignment: Assignment) => {
    setAssignments(prev => [...prev, assignment]);
  };

  const updateAssignment = (id: string, updatedAssignment: Partial<Assignment>) => {
    setAssignments(prev => prev.map(assignment => 
      assignment.id === id ? { ...assignment, ...updatedAssignment } : assignment
    ));
  };

  const deleteAssignment = (id: string) => {
    setAssignments(prev => prev.filter(assignment => assignment.id !== id));
  };

  const addStudentSubmission = (submission: StudentSubmission) => {
    setStudentSubmissions(prev => [...prev, submission]);
  };

  const updateStudentSubmission = (id: string, updatedSubmission: Partial<StudentSubmission>) => {
    setStudentSubmissions(prev => prev.map(submission => 
      submission.id === id ? { ...submission, ...updatedSubmission } : submission
    ));
  };

  const getAssignmentsForStudent = (studentClass: string, studentDivision: string) => {
    return assignments.filter(assignment => 
      assignment.status === 'published' &&
      assignment.class === studentClass &&
      assignment.division === studentDivision
    );
  };

  const getStudentSubmission = (assignmentId: string, studentId: string) => {
    return studentSubmissions.find(submission => 
      submission.assignmentId === assignmentId && submission.studentId === studentId
    );
  };

  return (
    <AssignmentContext.Provider value={{
      assignments,
      studentSubmissions,
      addAssignment,
      updateAssignment,
      deleteAssignment,
      addStudentSubmission,
      updateStudentSubmission,
      getAssignmentsForStudent,
      getStudentSubmission
    }}>
      {children}
    </AssignmentContext.Provider>
  );
}

export function useAssignments() {
  const context = useContext(AssignmentContext);
  if (context === undefined) {
    throw new Error('useAssignments must be used within an AssignmentProvider');
  }
  return context;
}