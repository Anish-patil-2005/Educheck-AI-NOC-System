import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import {
  Upload, FileText, Users, Plus, Calendar, BookOpen, GraduationCap, Eye,
  Edit, Trash2, CheckCircle, Send, Star, Monitor, ClipboardList, ArrowLeft,
  Loader2, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
// ===================================================================
// Type Definitions to Match Refactored Backend Schemas
// ===================================================================

interface User {
  id: number;
  email: string;
  role: 'student' | 'teacher' | 'admin';
}

interface Student {
  id: number;
  name: string;
  roll_number?: string;
  user: User;
}

interface Teacher {
  id: number;
  name: string;
  user: User;
}

interface Department {
  id: number;
  name: string;
}

interface Division {
  id: number;
  name: string;
  department: Department;
}

interface Batch {
  id: number;
  name: string;
}

interface Subject {
  id: number;
  name: string;
  department: Department;
  year: string; // <-- ADD THIS LINE
}

interface Submission {
  id: number;
  student: Student;
  submitted_at: string;
  status: string;
  marks?: number;
  feedback?: string;
  file_path?: string;
}

interface Assignment {
  id: number;
  title: string;
  description?: string;
  subject: Subject;
  division: Division;
  batch?: Batch;
  deadline: string;
  created_at: string;
  max_marks: number;
  instructions?: string;
  status: 'draft' | 'published' ;
  teacher: Teacher;
  assignment_type: string;
  submissions: Submission[];
  assignment_file_path?: string;
  solution_file_path?: string;
}

interface FilterOptions {
  subjects: { id: number; name: string; year: string; }[]; // <-- UPDATED
  divisions: { id: number; name: string }[];
  batches: { id: number; name: string; division_id: number }[];
  assignmentTypes: string[];
  years: string[];
}

interface NewAssignmentState {
  title: string;
  description: string;
  year: string | null;
  subject_id: number | null;
  division_id: number | null;
  batch_id?: number;
  deadline: string;
  max_marks: number;
  instructions: string;
  assignment_type: string;
  is_sample: boolean;
  assignmentFile?: File;
  solutionFile?: File;
}

interface AssignmentManagementProps {
  onBack: () => void;
  authToken: string;
}

const API_BASE_URL = 'http://127.0.0.1:8000';

// ===================================================================
// Main Component
// ===================================================================

export function AssignmentManagement({ onBack, authToken }: AssignmentManagementProps) {
  // --- State Management ---
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreateDialog, setShowCreateDialog] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Filters
  const [selectedAssignmentType, setSelectedAssignmentType] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all'); // <-- ADD THIS LINE
  const [selectedBatch, setSelectedBatch] = useState<string>('all'); 

  // Detail & Grading
  const [selectedAssignmentForDetail, setSelectedAssignmentForDetail] = useState<Assignment | null>(null);
  const [showGradeDialog, setShowGradeDialog] = useState<boolean>(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [grade, setGrade] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>('');

  const initialNewAssignmentState: NewAssignmentState = {
    title: '', description: '', year: '',subject_id: null, division_id: null, batch_id: undefined,
    deadline: '', max_marks: 100, instructions: '',
    assignment_type: '', is_sample: false, assignmentFile: undefined, solutionFile: undefined
  };
  const [newAssignment, setNewAssignment] = useState<NewAssignmentState>(initialNewAssignmentState);

  // --- Dynamic Filter Data Extraction ---
  // --- Dynamic Filter Data Extraction ---
  const { years, subjects, divisions, batches, assignmentTypes } = useMemo(() => {
    return {
      years: filterOptions?.years ?? [],
      subjects: filterOptions?.subjects ?? [],
      divisions: filterOptions?.divisions ?? [],
      batches: filterOptions?.batches ?? [],
      assignmentTypes: filterOptions?.assignmentTypes ?? [],
    };
  }, [filterOptions]);
  // Add this inside your AssignmentManagement component
  const availableSubjectsForCreation = useMemo(() => {
    if (!newAssignment.year || !filterOptions?.subjects) return [];
    return filterOptions.subjects.filter(subject => subject.year === newAssignment.year);
  }, [newAssignment.year, filterOptions]);
  // NEW: Create filtered lists for the dropdowns
  const availableSubjects = useMemo(() => {
    if (selectedYear === 'all') return subjects;
    return subjects.filter(subject => subject.year === selectedYear);
  }, [selectedYear, subjects]); // The dependency is now only filterOptions

  // --- Data Fetching ---
  const fetchInitialData = async () => {
    if (!authToken) {
      setIsLoading(false);
      toast.error("Authentication token is missing. Please log in again.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const [assignmentsResponse, filtersResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/assignments/teacher`, { headers: { 'Authorization': `Bearer ${authToken}` } }),
        fetch(`${API_BASE_URL}/teacher/filter-options`, { headers: { 'Authorization': `Bearer ${authToken}` } })
      ]);

      if (!assignmentsResponse.ok) {
        const errorData = await assignmentsResponse.json();
        toast.error(errorData.detail || 'Failed to fetch assignments.');
      }
      if (!filtersResponse.ok) {
        const errorData = await filtersResponse.json();
        toast.error(errorData.detail || 'Failed to fetch filter options.');
      }

      const assignmentsData: Assignment[] = await assignmentsResponse.json();
      console.log(assignmentsData);
      const filtersData: FilterOptions = await filtersResponse.json();
      console.log(filtersData);
      setAssignments(assignmentsData);
      setFilterOptions(filtersData);

    } catch (err: any) {
      toast.error(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [authToken]);

  // --- Filtering Logic ---
  // --- Filtering Logic ---
  const filteredAssignments = assignments.filter(assignment => {
    // CORRECTED: Added the missing yearMatch and batchMatch conditions
    const yearMatch = selectedYear === 'all' || assignment.subject.year === selectedYear;
    const subjectMatch = selectedSubject === 'all' || assignment.subject.id.toString() === selectedSubject;
    const divisionMatch = selectedDivision === 'all' || assignment.division.id.toString() === selectedDivision;
    const batchMatch = selectedBatch === 'all' || !assignment.batch || assignment.batch.id.toString() === selectedBatch;
    const assignmentTypeMatch = selectedAssignmentType === 'all' || assignment.assignment_type === selectedAssignmentType;

    return yearMatch && subjectMatch && divisionMatch && batchMatch && assignmentTypeMatch;
  });

  const filteredSubmissions = selectedAssignmentForDetail ? selectedAssignmentForDetail.submissions : [];

  // --- Event Handlers ---
  // --- Effects ---

  // ... (your existing useEffect for fetchInitialData)

  // NEW: This effect synchronizes the detail view with the main data list.
  useEffect(() => {
    // If an assignment is selected for the detail view...
    if (selectedAssignmentForDetail) {
      // ...find the fresh version of that same assignment from the updated assignments array.
      const updatedAssignment = assignments.find(a => a.id === selectedAssignmentForDetail.id);

      // If found, update the state to ensure the detail view re-renders with the new data.
      if (updatedAssignment) {
        setSelectedAssignmentForDetail(updatedAssignment);
      }
    }
  }, [assignments]); // This effect runs whenever the main 'assignments' array changes.
  const handleDialogClose = (isOpen: boolean) => {
    setShowCreateDialog(isOpen);
    // If the dialog is being closed, reset the form state
    if (!isOpen) {
      setNewAssignment(initialNewAssignmentState);
    }
  };


  const handleCreateAssignment = async (publish:boolean) => {

   console.log(publish);
   console.log(newAssignment)

    if (!newAssignment.title || !newAssignment.subject_id || !newAssignment.division_id || !newAssignment.assignment_type || !newAssignment.deadline) {
      toast.error("Please fill in all required fields: Title, Type, Subject, Division, and Due Date.");
      return;
    }
    const batchRequiredTypes = ["Tutorial Assignment", "Lab Assignment"];

    if (batchRequiredTypes.includes(newAssignment.assignment_type) && !newAssignment.batch_id) {
      toast.error("A batch must be selected for Lab or Tutorial assignments.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const assignmentBody = {
      title: newAssignment.title,
      description: newAssignment.description,
      subject_id: Number(newAssignment.subject_id),
      division_id: Number(newAssignment.division_id),
      batch_id: newAssignment.batch_id ? Number(newAssignment.batch_id) : undefined,
      deadline: new Date(newAssignment.deadline).toISOString(),
      max_marks: Number(newAssignment.max_marks),
      instructions: newAssignment.instructions,
      assignment_type: newAssignment.assignment_type,
      is_sample: newAssignment.is_sample,
      status: publish ? 'published' : 'draft',
    };

    try {
      const response = await fetch(`${API_BASE_URL}/assignments`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(assignmentBody),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'An unknown server error occurred.');
      }
      const createdAssignment = await response.json();
      const assignmentId = createdAssignment.id;

      const uploadFile = async (file: File, fileType: 'assignment' | 'solution') => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('file_type', fileType);
        const fileResponse = await fetch(`${API_BASE_URL}/assignments/${assignmentId}/upload-file`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${authToken}` },
          body: formData,
        });
        if (!fileResponse.ok) toast.error(`Failed to upload ${fileType} file.`);
      };

      if (newAssignment.assignmentFile) await uploadFile(newAssignment.assignmentFile, 'assignment');
      if (newAssignment.solutionFile) await uploadFile(newAssignment.solutionFile, 'solution');

      setShowCreateDialog(false);
      setNewAssignment(initialNewAssignmentState);
      await fetchInitialData();
    } catch (err: any) {
      toast.error(`Error creating assignment: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = (type: 'assignment' | 'solution', file: File | null) => {
    const key = type === 'assignment' ? 'assignmentFile' : 'solutionFile';
    setNewAssignment(prev => ({ ...prev, [key]: file || undefined }));
  };

  const handlePublishAssignment = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/assignments/${id}/publish`, { // Correct URL
        method: 'PATCH', // Correct Method
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
      if (!response.ok) toast.error('Failed to publish assignment.');
      await fetchInitialData();
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    }
  };

  const handleDeleteAssignment = async (id: number) => {
    if (confirm('Are you sure you want to delete this assignment?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/assignments/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${authToken}` },
        });
        if (!response.ok) toast.error('Failed to delete assignment.');
        if (selectedAssignmentForDetail?.id === id) setSelectedAssignmentForDetail(null);
        await fetchInitialData();
      } catch (err: any) {
        toast.error(`Error: ${err.message}`);
      }
    }
  };

  const handleViewAssignmentDetail = (assignment: Assignment) => setSelectedAssignmentForDetail(assignment);
  const handleBackToAssignments = () => setSelectedAssignmentForDetail(null);

  // In AssignmentManagement.tsx

  const handleGradeSubmission = async () => {
    if (!selectedSubmission || !selectedAssignmentForDetail) return;

    const originalAssignments = [...assignments]; // Keep a backup to revert on failure

    // --- 1. Optimistic UI Update ---
    // Update the local state immediately, without waiting for the API.
    setAssignments(prevAssignments =>
      prevAssignments.map(assignment => {
        if (assignment.id !== selectedAssignmentForDetail.id) {
          return assignment;
        }
        // This is the assignment we are grading, find the specific submission
        const updatedSubmissions = assignment.submissions.map(sub => {
          if (sub.id !== selectedSubmission.id) {
            return sub;
          }
          // This is the submission to update
          return { ...sub, marks: grade, feedback: feedback };
        });
        return { ...assignment, submissions: updatedSubmissions };
      })
    );

    // Close the dialog immediately for a snappy feel
    setShowGradeDialog(false);
    toast.success("Grade updated locally. Saving to server...");

    // --- 2. Send to Server in Background ---
    try {
      const response = await fetch(`${API_BASE_URL}/assignments/submissions/${selectedSubmission.id}/grade`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify({ marks: grade, feedback }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to save grade to server.');
      }

      // If the API call was successful, we don't need to do anything else.
      // The UI is already up to date. We will NOT re-fetch.

    } catch (err: any) {
      // --- 3. Revert on Failure ---
      // If the API call fails, show an error and revert the UI to the original state.
      toast.error(`Save failed: ${err.message}. Reverting changes.`);
      setAssignments(originalAssignments);
    }
  };

  const openGradeDialog = (submission: Submission) => {
    setSelectedSubmission(submission);
    // Pre-fill the grade input with the BERT score * the max marks
    const ai_suggested_grade = (submission.marks || 0) ;
    setGrade(Math.round(ai_suggested_grade));
    setFeedback(submission.feedback || '');
    setShowGradeDialog(true);
  };

  // --- UI Helper Functions ---
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published': return <Badge className="bg-green-100 text-green-800">Published</Badge>;
      case 'draft': return <Badge className="bg-yellow-100 text-yellow-800">Draft</Badge>;
      case 'expired': return <Badge className="bg-red-100 text-red-800">Expired</Badge>;
      default: return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getSubmissionStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted': return <Badge className="bg-green-100 text-green-800">On Time</Badge>;
      case 'late': return <Badge className="bg-red-100 text-red-800">Late</Badge>;
      case 'pending': return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      default: return <Badge variant="secondary">Unknown</Badge>;
    }
  };
  const getAssignmentTypeIcon = (type: string) => {
    switch (type) {
      case 'Theory Assignment':
      case 'Home Assignment':
        return <BookOpen className="w-4 h-4" />;
      case 'Lab Assignment':
      case 'Practical Assignment':
        return <Monitor className="w-4 h-4" />;
      case 'Tutorial Assignment':
        return <ClipboardList className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };
  const getAssignmentTypeBadge = (type: string) => {
    const colors: { [key: string]: string } = {
      'Theory Assignment': 'bg-blue-100 text-blue-800',
      'Home Assignment': 'bg-purple-100 text-purple-800',
      'Lab Assignment': 'bg-teal-100 text-teal-800',
      'Practical Assignment': 'bg-green-100 text-green-800',
      'Tutorial Assignment': 'bg-orange-100 text-orange-800',
      'Project-Based Learning': 'bg-indigo-100 text-indigo-800'
    };
    return <Badge className={colors[type] || 'bg-gray-100 text-gray-800'}>{type}</Badge>;
  };

  // --- Render Logic ---
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
        <p className="ml-4 text-lg text-gray-700">Loading Assignments...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-red-600 bg-red-50 p-4">
        <AlertCircle className="w-12 h-12 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Failed to load data</h2>
        <p className="text-center mb-4">{error}</p>
        <Button onClick={fetchInitialData} className="bg-red-600 hover:bg-red-700 text-white">Try Again</Button>
      </div>
    );
  }

  // If an assignment is selected for detail view, show that instead
  if (selectedAssignmentForDetail) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Button variant="ghost" onClick={handleBackToAssignments} className="mb-2">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Assignments
              </Button>
              <h1 className="text-2xl mb-2">{selectedAssignmentForDetail.title}</h1>
              <p className="text-gray-600">Assignment details and student submissions</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <Tabs defaultValue="details" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 gap-5">
              <TabsTrigger
                value="details"
                className="rounded-xl p-3 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-md"
              >
                Assignment Details
              </TabsTrigger>

              <TabsTrigger
                value="submissions"
                className="rounded-xl p-3 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-md"
              >
                Student Submissions
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Assignment Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Title</Label>
                        <p className="text-base">{selectedAssignmentForDetail.title}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Subject</Label>
                        <p className="text-base">{selectedAssignmentForDetail.subject.name}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Assignment Type</Label>
                        <div className="mt-1">
                          {selectedAssignmentForDetail.assignment_type && getAssignmentTypeBadge(selectedAssignmentForDetail.assignment_type)}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Status</Label>
                        <div className="mt-1">
                          {getStatusBadge(selectedAssignmentForDetail.status)}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Class & Division</Label>
                        <p className="text-base">{selectedAssignmentForDetail.subject.year} {selectedAssignmentForDetail.division.name}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Batch</Label>
                        <p className="text-base">{selectedAssignmentForDetail.batch?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Due Date</Label>
                        <p className="text-base">{new Date(selectedAssignmentForDetail.deadline).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Maximum Marks</Label>
                        <p className="text-base">{selectedAssignmentForDetail.max_marks}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-500">Description</Label>
                    <p className="text-base mt-2">{selectedAssignmentForDetail.description}</p>
                  </div>

                  {selectedAssignmentForDetail.instructions && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Instructions</Label>
                      <div className="mt-2 p-4 bg-blue-50 rounded-lg">
                        <p className="text-blue-800">{selectedAssignmentForDetail.instructions}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="submissions">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="w-5 h-5" />
                    Student Submissions
                  </CardTitle>
                  <CardDescription>
                    Review and grade student submissions for this assignment
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {filteredSubmissions.length === 0 ? (
                    <div className="text-center py-12">
                      <Send className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="mb-2">No submissions yet</h3>
                      <p className="text-gray-600">Students haven't submitted this assignment yet</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Submitted</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Grade</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSubmissions.map((submission) => (
                          <TableRow key={submission.id}>
                            <TableCell>
                              <div>
                                {/* CORRECTED: Access the nested student object and its properties */}
                                <div className="font-medium">{submission.student.name}</div>
                                <div className="text-sm text-gray-500">{submission.student.roll_number}</div>
                              </div>
                            </TableCell>
                            {/* CORRECTED: Property name is 'submitted_at' */}
                            <TableCell>
                              {submission.status === 'pending'
                                ? <span className="text-gray-400">N/A</span>
                                : new Date(submission.submitted_at).toLocaleString()
                              }
                            </TableCell>
                            <TableCell>{getSubmissionStatusBadge(submission.status)}</TableCell>
                            <TableCell>
                              {submission.marks !== undefined && submission.marks !== null ? (
                                <div className="flex items-center gap-1 font-medium">
                                  <Star className="w-4 h-4 text-yellow-500" />
                                  {/* Format the score (0-1) as a percentage */}
                                  <span>{`${(submission.marks).toFixed(0)}`}</span>
                                </div>
                              ) : (
                                <span className="text-gray-400">Not Graded</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button variant="outline" size="sm" onClick={() => openGradeDialog(submission)}
                                disabled={submission.status === 'pending'}
                                >
                                <Star className="w-4 h-4 mr-1" />
                                Grade
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Grade Submission Dialog */}
        <Dialog open={showGradeDialog} onOpenChange={setShowGradeDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Grade Submission</DialogTitle>
              <DialogDescription>
                Grade the submission by {selectedSubmission?.student.name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-sm">
                  <p><span className="font-medium">Student:</span> {selectedSubmission?.student.name}</p>
                  <p><span className="font-medium">Roll No:</span> {selectedSubmission?.student.roll_number}</p>
                  <p><span className="font-medium">Assignment:</span> {selectedAssignmentForDetail?.title}</p>
                  <p><span className="font-medium">Max Marks:</span> {selectedAssignmentForDetail?.max_marks}</p>
                </div>
              </div>

              <div>
                <Label htmlFor="grade">Grade (out of {selectedAssignmentForDetail?.max_marks})</Label>
                <Input
                  id="grade"
                  type="number"
                  value={grade}
                  onChange={(e) => setGrade(parseInt(e.target.value) || 0)}
                  max={selectedAssignmentForDetail?.max_marks}
                  min={0}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="feedback">Feedback</Label>
                <Textarea
                  id="feedback"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Provide feedback for the student..."
                  className="min-h-[100px] mt-2"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowGradeDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleGradeSubmission}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                >
                  <Star className="w-4 h-4 mr-2" />
                  Save Grade
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Default view - show assignments list
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <Button variant="ghost" onClick={onBack} className="mb-2  shadow-sm bg-blue-500 text-white"><Eye className="w-4 h-4 mr-2 " />Back</Button>
            <h1 className="text-2xl mb-2">Assignment Management</h1>
            <p className="text-gray-600">Create and manage assignments for your classes</p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
              <Button onClick={() => setShowCreateDialog(true)} className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Assignment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Assignment</DialogTitle>
                <DialogDescription>
                  Fill in the details to create a new assignment for your students.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4 pr-3">
                <div className="grid grid-cols-2 gap-4">
                  {/* NEW: Year selection is now the first step */}
                  <div>
                    <Label htmlFor="year">Year</Label>
                    <Select
                      onValueChange={(value) => {
                        // When year changes, reset all dependent fields
                        setNewAssignment(p => ({
                          ...p,
                          year: value,
                          subject_id: null,
                          division_id: null,
                          batch_id: undefined
                        }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map(year => (
                          <SelectItem key={year} value={year}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Select
                      value={newAssignment.subject_id?.toString()}
                      onValueChange={(v) => setNewAssignment(p => ({ ...p, subject_id: Number(v) }))}
                      disabled={!newAssignment.year} // Disable until a year is selected
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* UPDATED: Maps over the new filtered list */}
                        {availableSubjectsForCreation.map(subject => (
                          <SelectItem key={subject.id} value={subject.id.toString()}>
                            {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="division">Division</Label>
                    <Select
                      value={newAssignment.division_id?.toString()}
                      onValueChange={(v) => setNewAssignment(p => ({ ...p, division_id: Number(v), batch_id: undefined }))}
                      disabled={!newAssignment.subject_id} // Disable until subject is selected
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select division" />
                      </SelectTrigger>
                      <SelectContent>
                        {divisions.map(div => (
                          <SelectItem key={div.id} value={div.id.toString()}>
                            {div.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="assignmentType">Assignment Type</Label>
                    <Select
                      value={newAssignment.assignment_type}
                      onValueChange={(v) => {
                        if (v !== 'Lab Assignment' && v !== 'Tutorial Assignment') {
                          setNewAssignment(p => ({ ...p, assignment_type: v, batch_id: undefined }));
                        } else {
                          setNewAssignment(p => ({ ...p, assignment_type: v }));
                        }
                      }}
                      disabled={!newAssignment.subject_id} // Disable until subject is selected
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select assignment type" />
                      </SelectTrigger>
                      <SelectContent>
                        {assignmentTypes.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Conditional Rendering for the Batch Select */}
                {(newAssignment.assignment_type === 'Lab Assignment' || newAssignment.assignment_type === 'Tutorial Assignment') && (
                  <div>
                    <Label htmlFor="batch">Batch</Label>
                    <Select
                      value={newAssignment.batch_id?.toString()}
                      onValueChange={(v) => setNewAssignment(p => ({ ...p, batch_id: Number(v) }))}
                      disabled={!newAssignment.division_id}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select batch for Lab/Tutorial" />
                      </SelectTrigger>
                      <SelectContent>
                        {batches
                          .filter(batch => batch.division_id === newAssignment.division_id)
                          .map(batch => (
                            <SelectItem key={batch.id} value={batch.id.toString()}>
                              {batch.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label htmlFor="title">Assignment Title</Label>
                  <Input
                    id="title"
                    value={newAssignment.title}
                    onChange={(e) => setNewAssignment(p => ({ ...p, title: e.target.value }))}
                    placeholder="Enter assignment title"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newAssignment.description}
                    onChange={(e) => setNewAssignment(p => ({ ...p, description: e.target.value }))}
                    placeholder="Enter assignment description"
                    className="min-h-[80px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                      id="dueDate"
                      type="datetime-local"
                      value={newAssignment.deadline}
                      onChange={(e) => setNewAssignment(p => ({ ...p, deadline: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxMarks">Maximum Marks</Label>
                    <Input
                      id="maxMarks"
                      type="number"
                      value={newAssignment.max_marks}
                      onChange={(e) => setNewAssignment(p => ({ ...p, max_marks: parseInt(e.target.value) || 100 }))}
                      placeholder="100"
                    />
                  </div>
                </div>

                {/* Other fields like Instructions and File Uploads would go here... */}
                <div>
                  <Label htmlFor="instructions">Instructions</Label>
                  <Textarea
                    id="instructions"
                    value={newAssignment.instructions}
                    onChange={(e) => setNewAssignment(p => ({ ...p, instructions: e.target.value }))}
                    placeholder="Enter detailed instructions for students"
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Assignment File</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => handleFileUpload('assignment', e.target.files?.[0] || null)}
                        className="hidden"
                        id="assignment-file"
                      />
                      <label htmlFor="assignment-file" className="cursor-pointer">
                        <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-gray-600">Click to upload assignment file (PDF, DOC, DOCX)</p>
                        {newAssignment.assignmentFile && (
                          <p className="text-blue-600 mt-2">Selected: {newAssignment.assignmentFile.name}</p>
                        )}
                      </label>
                    </div>
                  </div>

                  <div>
                    <Label>Solution File </Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => handleFileUpload('solution', e.target.files?.[0] || null)}
                        className="hidden"
                        id="solution-file"
                      />
                      <label htmlFor="solution-file" className="cursor-pointer">
                        <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-gray-600">Click to upload solution file (PDF, DOC, DOCX)</p>
                        {newAssignment.solutionFile && (
                          <p className="text-blue-600 mt-2">Selected: {newAssignment.solutionFile.name}</p>
                        )}
                      </label>
                    </div>
                  </div>
                </div>

              </div>
              <div className="flex justify-end gap-3 pt-4 border-t px-6 pb-4">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                <Button type="button" onClick={() => handleCreateAssignment(false)} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Save as Draft
                </Button>
                <Button type="button" onClick={() => handleCreateAssignment(true)} disabled={isSubmitting} className="bg-gradient-to-r from-blue-600 to-cyan-600">
                  {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Publish Assignment
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Created Assignments
            </CardTitle>
            <CardDescription>
              View and manage all your created assignments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 space-y-4">
              <h4 className="text-base font-medium">Filter Assignments</h4>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {/* Year Filter */}
                <div>
                  <Label>Year</Label>
                  <Select
                    value={selectedYear}
                    onValueChange={(value) => {
                      setSelectedYear(value);
                      // When year changes, reset all child filters
                      setSelectedSubject('all');
                      setSelectedDivision('all');
                      setSelectedBatch('all');
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Years</SelectItem>
                      {years.map(year => (
                        <SelectItem key={year} value={year}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Subject Filter (Dependent on Year) */}
                <div>
                  <Label>Subject</Label>
                  <Select
                    value={selectedSubject}
                    onValueChange={(value) => {
                      setSelectedSubject(value);
                      // When subject changes, reset child filters
                      setSelectedDivision('all');
                      setSelectedBatch('all');
                    }}
                    disabled={selectedYear === 'all'}
                  >
                    <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Subjects</SelectItem>
                      {availableSubjects.map(subject => (
                        <SelectItem key={subject.id} value={subject.id.toString()}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Division Filter */}
                <div>
                  <Label>Division</Label>
                  <Select
                    value={selectedDivision}
                    onValueChange={(value) => {
                      setSelectedDivision(value);
                      // When division changes, reset the batch filter
                      setSelectedBatch('all');
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Select division" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Divisions</SelectItem>
                      {divisions.map(div => (
                        <SelectItem key={div.id} value={div.id.toString()}>{div.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Batch Filter (Dependent on Division) */}
                <div>
                  <Label>Batch</Label>
                  <Select
                    value={selectedBatch}
                    onValueChange={setSelectedBatch}
                    disabled={selectedDivision === 'all'}
                  >
                    <SelectTrigger><SelectValue placeholder="Select batch" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Batches</SelectItem>
                      {batches
                        .filter(batch => selectedDivision === 'all' || batch.division_id.toString() === selectedDivision)
                        .map(batch => (
                          <SelectItem key={batch.id} value={batch.id.toString()}>{batch.name}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Assignment Type Filter */}
                <div>
                  <Label>Assignment Type</Label>
                  <Select value={selectedAssignmentType} onValueChange={setSelectedAssignmentType}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {assignmentTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {filteredAssignments.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="mb-2">No assignments found</h3>
                <p className="text-gray-600 mb-4">No assignments match your current filters or you haven't created any yet.</p>
                <Button onClick={() => setShowCreateDialog(true)} className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Assignment
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAssignments.map((assignment) => (
                  <div key={assignment.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center flex-wrap gap-x-3 gap-y-2 mb-2">
                          <h3 className="font-semibold text-lg">{assignment.title}</h3>
                          {getStatusBadge(assignment.status)}
                          {/* CORRECTED: Property name is 'assignment_type' */}
                          {getAssignmentTypeBadge(assignment.assignment_type)}
                          <Badge variant="secondary">
                            {assignment.submissions.filter(s => s.status === 'submitted' || s.status === 'late').length} submitted
                          </Badge>
                          {/* NEW: Badge for remaining (pending) submissions */}
                          <Badge variant="secondary">
                            {assignment.submissions.filter(s => s.status === 'pending').length} Remaining
                          </Badge>
                        </div>
                        <p className="text-gray-600 mb-2 line-clamp-2">{assignment.description}</p>
                        <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                          {/* CORRECTED: Access nested object properties */}
                          <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" />{assignment.subject.name}</span>
                          <span className="flex items-center gap-1"><GraduationCap className="w-4 h-4" />{assignment.subject.year} - {assignment.division.name}</span>
                          <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />Due: {new Date(assignment.deadline).toLocaleDateString()}</span>
                          <span className="flex items-center gap-1"><Users className="w-4 h-4" />Max Marks: {assignment.max_marks}</span>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleViewAssignmentDetail(assignment)}><Eye className="w-4 h-4 mr-1" />View</Button>
                        <Button variant="outline" size="sm" onClick={() => handlePublishAssignment(assignment.id)} disabled={assignment.status === 'published'}><CheckCircle className="w-4 h-4 mr-1" />Publish</Button>
                        <Button variant="outline" size="sm" disabled><Edit className="w-4 h-4 mr-1" />Edit</Button>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteAssignment(assignment.id)}><Trash2 className="w-4 h-4 mr-1" />Delete</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}