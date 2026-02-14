import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Textarea } from './ui/textarea';
import {
  FileText, Download, Calendar, Clock, Upload, Eye, CheckCircle, AlertTriangle,
  Search, Filter, BookOpen, Monitor, ClipboardList, Loader2, XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

// ===================================================================
// Type Definitions
// ===================================================================

interface MySubmission {
  status: 'pending' | 'submitted' | 'late';
  submitted_at: string | null;
  marks?: number;
}

interface StudentAssignment {
  id: number;
  title: string;
  description?: string;
  deadline: string;
  assignment_type: string;
  max_marks: number;
  assignment_file_path?: string;
  subject_name: string;
  teacher_name: string;
  my_submission?: MySubmission;
}

interface Student {
  id: number;
  name: string;
}

interface StudentAssignmentViewProps {
  onBack: () => void;
  authToken: string;
  currentStudent: Student;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ===================================================================
// Main Component
// ===================================================================

export function StudentAssignmentView({ onBack, authToken, currentStudent }: StudentAssignmentViewProps) {
  // --- State Management ---
  const [assignments, setAssignments] = useState<StudentAssignment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedAssignmentType, setSelectedAssignmentType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [showSubmissionDialog, setShowSubmissionDialog] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittingAssignmentId, setSubmittingAssignmentId] = useState<number | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<StudentAssignment | null>(null);
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [submissionContent, setSubmissionContent] = useState<string>('');

  const abortControllerRef = useRef<AbortController | null>(null);

  // --- Data Extraction and Filtering ---
  const subjects = useMemo(() => {
    const subjectsMap = new Map<string, string>();
    assignments.forEach(a => subjectsMap.set(a.subject_name, a.subject_name));
    return Array.from(subjectsMap.keys()).sort();
  }, [assignments]);

  const assignmentTypes = useMemo(() => {
    return [...new Set(assignments.map(a => a.assignment_type))].sort();
  }, [assignments]);

  const filteredAssignments = assignments.filter(assignment => {
    const status = assignment.my_submission?.status ?? 'pending';
    const isOverdue = new Date(assignment.deadline) < new Date();

    const subjectMatch = selectedSubject === 'all' || assignment.subject_name === selectedSubject;
    const assignmentTypeMatch = selectedAssignmentType === 'all' || assignment.assignment_type === selectedAssignmentType;
    const searchMatch = !searchTerm ||
      assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.subject_name.toLowerCase().includes(searchTerm.toLowerCase());

    let statusMatch = true;
    if (selectedStatus !== 'all') {
      if (selectedStatus === 'submitted') statusMatch = (status === 'submitted' || status === 'late');
      else if (selectedStatus === 'pending') statusMatch = (status === 'pending' && !isOverdue);
      else if (selectedStatus === 'overdue') statusMatch = (status === 'pending' && isOverdue);
    }

    return subjectMatch && assignmentTypeMatch && searchMatch && statusMatch;
  });

  // --- Data Fetching ---
  const fetchStudentAssignments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/assignments/student`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch assignments.');
      }
      const data: StudentAssignment[] = await response.json();
      setAssignments(data);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (authToken) {
      fetchStudentAssignments();
    }
  }, [authToken]);

  // --- Event Handlers ---
  const handleOpenSubmitDialog = (assignment: StudentAssignment) => {
    setSelectedAssignment(assignment);
    setShowSubmissionDialog(true);
  };

  const handleDialogClose = () => {
    // This handler now only closes the dialog and resets the form state.
    // It does NOT cancel the request.
     // Prevent closing while submitting
    setShowSubmissionDialog(false);
    setSelectedAssignment(null);
    setSubmissionFile(null);
    setSubmissionContent('');
  };

  const handleCancelSubmission = () => {
    // This is the explicit cancel action, called only from the new cancel button.
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleSubmission = async () => {
    if (!selectedAssignment) return;
    if (!submissionFile) {
      toast.error("Please upload a file for your submission.");
      return;
    }

    setIsSubmitting(true);
    setSubmittingAssignmentId(selectedAssignment.id); // Track which card shows the loader

    abortControllerRef.current = new AbortController();
    const formData = new FormData();
    formData.append('content', submissionContent);
    formData.append('file', submissionFile);

    try {
      const response = await fetch(`${API_BASE_URL}/assignments/${selectedAssignment.id}/submit`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` },
        body: formData,
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to submit assignment.');
      }

      // If successful, close the dialog and then refresh the data from the server.
      setShowSubmissionDialog(false);
      await fetchStudentAssignments();
      toast.success("Assignment submitted successfully!");

    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Fetch aborted by user.');
        toast("Submission cancelled.");
      } else {
        toast.error(`Error: ${err.message}`);
      }
    } finally {
      // This block runs after success, failure, or cancellation.
      setIsSubmitting(false);
      setSubmittingAssignmentId(null);
      abortControllerRef.current = null;
    }
  };

  const handleDownload = async (assignmentId: number, filePath?: string) => {
    if (!filePath) {
      toast.error("No file available for download.");
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/assignments/${assignmentId}/download`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      if (!response.ok) throw new Error('Download failed.');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filePath.split('/').pop() || 'download';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      toast.error(err.message || 'Could not download file.');
    }
  };

  // --- UI Helper Functions ---
  const getStatusBadge = (assignment: StudentAssignment) => {
    const status = assignment.my_submission?.status;
    const isOverdue = new Date(assignment.deadline) < new Date();
    if (status === 'submitted' || status === 'late') {
      return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Submitted</Badge>;
    }
    if (status === 'pending' && isOverdue) {
      return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="w-3 h-3 mr-1" />Overdue</Badge>;
    }
    return <Badge className="bg-blue-100 text-blue-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
  };

  const getAssignmentTypeBadge = (type: string) => {
    const colors: { [key: string]: string } = {
      'Theory Assignment': 'bg-blue-100 text-blue-800',
      'Home Assignment': 'bg-purple-100 text-purple-800',
      'Lab Assignment': 'bg-teal-100 text-teal-800',
    };
    return <Badge className={colors[type] || 'bg-gray-100 text-gray-800'}>{type}</Badge>;
  };

  const getDaysUntilDue = (dueDate: string) => {
    const diff = new Date(dueDate).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  // --- Render Logic ---
  if (isLoading) { return <div>Loading...</div>; }
  if (error) { return <div>Error: {error}</div>; }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4">
        <Button variant="ghost" onClick={onBack} className="mb-2  shadow-sm bg-blue-500 text-white"><Eye className="w-4 h-4 mr-2 " />Back</Button>
        <h1 className="text-2xl font-bold">My Assignments</h1>
      </div>

      <div className="p-6 space-y-6">
        <Card>
          <CardHeader><CardTitle>Filter Assignments</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={selectedSubject} onValueChange={setSelectedSubject}><SelectTrigger><SelectValue placeholder="Filter by Subject" /></SelectTrigger><SelectContent><SelectItem value="all">All Subjects</SelectItem>{subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
            <Select value={selectedAssignmentType} onValueChange={setSelectedAssignmentType}><SelectTrigger><SelectValue placeholder="Filter by Type" /></SelectTrigger><SelectContent><SelectItem value="all">All Types</SelectItem>{assignmentTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}><SelectTrigger><SelectValue placeholder="Filter by Status" /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="submitted">Submitted</SelectItem><SelectItem value="overdue">Overdue</SelectItem></SelectContent></Select>
            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" /></div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {filteredAssignments.map((assignment) => {
            const status = assignment.my_submission?.status;
            const isCurrentlySubmitting = isSubmitting && submittingAssignmentId === assignment.id;

            return (
              <Card key={assignment.id}>
                <CardContent className="p-6 flex flex-col md:flex-row items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="font-semibold text-lg">{assignment.title}</h3>
                      {getStatusBadge(assignment)}
                      {getAssignmentTypeBadge(assignment.assignment_type)}
                    </div>
                    <p className="text-gray-600 mb-3 text-sm">{assignment.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                      <span><BookOpen className="inline w-4 h-4 mr-1" />{assignment.subject_name}</span>
                      <span><Calendar className="inline w-4 h-4 mr-1" />Due: {new Date(assignment.deadline).toLocaleDateString()}</span>
                      {getDaysUntilDue(assignment.deadline) >= 0 && <span><Clock className="inline w-4 h-4 mr-1" />{getDaysUntilDue(assignment.deadline)} days left</span>}
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 gap-2 w-full md:w-auto">
                    {isCurrentlySubmitting ? (
                      <>
                        <Button variant="outline" size="sm" className="flex-1" disabled>
                          <Download className="w-4 h-4 mr-1" /> Download
                        </Button>
                        <Button variant="destructive" onClick={handleCancelSubmission} className="flex-1">
                          <XCircle className="w-4 h-4 mr-1" /> Cancel Submission
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(assignment.id, assignment.assignment_file_path)}
                          disabled={!assignment.assignment_file_path}
                          className="flex-1"
                        >
                          <Download className="w-4 h-4 mr-1" /> Download
                        </Button>
                        {status === 'pending' ? (
                          <Button onClick={() => handleOpenSubmitDialog(assignment)} className="flex-1">
                            <Upload className="w-4 h-4 mr-1" /> Submit
                          </Button>
                        ) : (
                          <Button variant="ghost" disabled className="text-green-600 flex-1">
                            <CheckCircle className="w-4 h-4 mr-1" /> Submitted
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Dialog open={showSubmissionDialog} onOpenChange={setShowSubmissionDialog}>
        <DialogContent onInteractOutside={(e) => { if (isSubmitting) e.preventDefault() }}>
          <DialogHeader><DialogTitle>Submit: {selectedAssignment?.title}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              value={submissionContent}
              onChange={(e) => setSubmissionContent(e.target.value)}
              placeholder="Type any text content for your submission here..."
              rows={5}
              disabled={isSubmitting}
            />
            <div>
              <Label htmlFor="submission-file">Upload Your File (Required)</Label>
              <Input id="submission-file" type="file" onChange={(e) => setSubmissionFile(e.target.files?.[0] || null)} disabled={isSubmitting} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleDialogClose} disabled={!isSubmitting}>Cancel</Button>
              <Button onClick={handleSubmission} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}