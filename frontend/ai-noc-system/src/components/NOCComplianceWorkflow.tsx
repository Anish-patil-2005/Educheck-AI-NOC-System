import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Clock, 
  FileText, 
  Users, 
  Award,
  Eye,
  Calendar,
  Upload,
  AlertTriangle,
  BookOpen,
  Presentation,
  Code,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

interface Student {
  id: string;
  name: string;
  rollNo: string;
  email: string;
  attendance: number;
  assignments: Assignment[];
  sceComponents: SCEComponent[];
  nocStatus: 'pending' | 'approved' | 'rejected';
}

interface Assignment {
  id: string;
  title: string;
  dueDate: string;
  submittedDate: string | null;
  status: 'submitted' | 'late' | 'missing';
  plagiarismScore: number;
  maxPlagiarismAllowed: number;
  fileUrl?: string;
}

interface SCEComponent {
  id: string;
  type: 'PBL' | 'Project' | 'Presentation' | 'Tutorial';
  title: string;
  status: 'completed' | 'in-progress' | 'not-started';
  submissionDate: string | null;
  grade?: number;
  feedback?: string;
}

interface NOCComplianceWorkflowProps {
  student: Student;
  onUpdateStudent: (student: Student) => void;
  onBack: () => void;
}

export function NOCComplianceWorkflow({ student, onUpdateStudent, onBack }: NOCComplianceWorkflowProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [stepStatuses, setStepStatuses] = useState({
    attendance: 'pending' as 'pass' | 'fail' | 'pending',
    assignments: 'pending' as 'pass' | 'fail' | 'pending',
    sce: 'pending' as 'pass' | 'fail' | 'pending',
    final: 'pending' as 'approved' | 'rejected' | 'pending'
  });

  const steps = [
    { 
      id: 1, 
      title: 'Attendance Verification', 
      description: 'Check if student has ≥75% attendance',
      icon: Users,
      key: 'attendance' as keyof typeof stepStatuses
    },
    { 
      id: 2, 
      title: 'Assignment Compliance', 
      description: 'Verify deadlines and plagiarism checks',
      icon: FileText,
      key: 'assignments' as keyof typeof stepStatuses
    },
    { 
      id: 3, 
      title: 'SCE Components', 
      description: 'Check PBL, projects, presentations, tutorials',
      icon: BookOpen,
      key: 'sce' as keyof typeof stepStatuses
    },
    { 
      id: 4, 
      title: 'NOC Approval', 
      description: 'Final compliance decision',
      icon: Award,
      key: 'final' as keyof typeof stepStatuses
    }
  ];

  useEffect(() => {
    checkStepStatuses();
  }, [student]);

  const checkStepStatuses = () => {
    const newStatuses = { ...stepStatuses };
    
    // Step 1: Attendance
    newStatuses.attendance = student.attendance >= 75 ? 'pass' : 'fail';
    
    // Step 2: Assignments
    const assignmentsPassed = student.assignments.every(assignment => 
      assignment.status === 'submitted' && 
      assignment.plagiarismScore <= assignment.maxPlagiarismAllowed
    );
    newStatuses.assignments = assignmentsPassed ? 'pass' : 'fail';
    
    // Step 3: SCE Components
    const sceCompleted = student.sceComponents.every(component => 
      component.status === 'completed'
    );
    newStatuses.sce = sceCompleted ? 'pass' : 'fail';
    
    // Step 4: Final NOC
    if (newStatuses.attendance === 'pass' && 
        newStatuses.assignments === 'pass' && 
        newStatuses.sce === 'pass') {
      newStatuses.final = 'approved';
    } else {
      newStatuses.final = 'rejected';
    }
    
    setStepStatuses(newStatuses);
  };

  const getStepIcon = (step: typeof steps[0], status: string) => {
    if (status === 'pass' || status === 'approved') {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    } else if (status === 'fail' || status === 'rejected') {
      return <XCircle className="w-5 h-5 text-red-500" />;
    } else {
      return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStepBadge = (status: string) => {
    if (status === 'pass' || status === 'approved') {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Pass</Badge>;
    } else if (status === 'fail' || status === 'rejected') {
      return <Badge variant="destructive">Fail</Badge>;
    } else {
      return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const approveNOC = () => {
    const updatedStudent = { ...student, nocStatus: 'approved' as const };
    onUpdateStudent(updatedStudent);
  };

  const rejectNOC = () => {
    const updatedStudent = { ...student, nocStatus: 'rejected' as const };
    onUpdateStudent(updatedStudent);
  };

  const renderAttendanceStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Attendance Verification
        </CardTitle>
        <CardDescription>
          Minimum requirement: 75% attendance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Current Attendance</h4>
              <p className="text-sm text-gray-600">{student.name} - {student.rollNo}</p>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${student.attendance >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                {student.attendance}%
              </div>
              {getStepBadge(stepStatuses.attendance)}
            </div>
          </div>
          
          <Progress value={student.attendance} className="h-3" />
          
          {student.attendance < 75 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="font-medium text-red-800">Attendance Requirement Not Met</span>
              </div>
              <p className="text-red-700 text-sm">
                Student needs {(75 - student.attendance).toFixed(1)}% more attendance to be eligible for NOC.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderAssignmentsStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Assignment Compliance
        </CardTitle>
        <CardDescription>
          All assignments must be submitted on time with acceptable plagiarism scores
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {student.assignments.map((assignment) => (
            <div key={assignment.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{assignment.title}</h4>
                <Badge 
                  className={
                    assignment.status === 'submitted' ? 'bg-green-100 text-green-800' :
                    assignment.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }
                >
                  {assignment.status}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <span>Due Date: </span>
                  <span className="font-medium">{assignment.dueDate}</span>
                </div>
                <div>
                  <span>Submitted: </span>
                  <span className="font-medium">
                    {assignment.submittedDate || 'Not submitted'}
                  </span>
                </div>
              </div>
              
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">Plagiarism Score</span>
                  <span className={`text-sm font-medium ${
                    assignment.plagiarismScore <= assignment.maxPlagiarismAllowed 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {assignment.plagiarismScore}% / {assignment.maxPlagiarismAllowed}%
                  </span>
                </div>
                <Progress 
                  value={assignment.plagiarismScore} 
                  className="h-2"
                  max={100}
                />
                {assignment.plagiarismScore > assignment.maxPlagiarismAllowed && (
                  <p className="text-xs text-red-600 mt-1">
                    Exceeds maximum allowed plagiarism threshold
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const renderSCEStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          SCE Components
        </CardTitle>
        <CardDescription>
          Problem-Based Learning, Projects, Presentations, and Tutorials
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {student.sceComponents.map((component) => {
            const getComponentIcon = (type: string) => {
              switch (type) {
                case 'PBL': return <BookOpen className="w-5 h-5" />;
                case 'Project': return <Code className="w-5 h-5" />;
                case 'Presentation': return <Presentation className="w-5 h-5" />;
                case 'Tutorial': return <FileText className="w-5 h-5" />;
                default: return <FileText className="w-5 h-5" />;
              }
            };

            return (
              <div key={component.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getComponentIcon(component.type)}
                    <h4 className="font-medium">{component.type}</h4>
                  </div>
                  <Badge 
                    className={
                      component.status === 'completed' ? 'bg-green-100 text-green-800' :
                      component.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }
                  >
                    {component.status}
                  </Badge>
                </div>
                
                <p className="text-sm font-medium mb-2">{component.title}</p>
                
                {component.submissionDate && (
                  <p className="text-xs text-gray-600 mb-2">
                    Submitted: {component.submissionDate}
                  </p>
                )}
                
                {component.grade && (
                  <p className="text-xs text-gray-600 mb-2">
                    Grade: {component.grade}/100
                  </p>
                )}
                
                {component.feedback && (
                  <p className="text-xs text-gray-600 italic">
                    "{component.feedback}"
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );

  const renderFinalStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="w-5 h-5" />
          NOC Approval Decision
        </CardTitle>
        <CardDescription>
          Final compliance status based on all requirements
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                {getStepIcon(steps[0], stepStatuses.attendance)}
                <span className="font-medium">Attendance</span>
              </div>
              <p className="text-2xl font-bold">{student.attendance}%</p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                {getStepIcon(steps[1], stepStatuses.assignments)}
                <span className="font-medium">Assignments</span>
              </div>
              <p className="text-2xl font-bold">
                {student.assignments.filter(a => a.status === 'submitted' && 
                  a.plagiarismScore <= a.maxPlagiarismAllowed).length}/
                {student.assignments.length}
              </p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                {getStepIcon(steps[2], stepStatuses.sce)}
                <span className="font-medium">SCE</span>
              </div>
              <p className="text-2xl font-bold">
                {student.sceComponents.filter(c => c.status === 'completed').length}/
                {student.sceComponents.length}
              </p>
            </div>
          </div>
          
          {/* Final Decision */}
          <div className={`p-6 border-2 rounded-lg text-center ${
            stepStatuses.final === 'approved' 
              ? 'border-green-200 bg-green-50' 
              : 'border-red-200 bg-red-50'
          }`}>
            <div className="flex items-center justify-center gap-2 mb-4">
              {stepStatuses.final === 'approved' ? (
                <CheckCircle className="w-8 h-8 text-green-500" />
              ) : (
                <XCircle className="w-8 h-8 text-red-500" />
              )}
              <h3 className={`text-xl font-bold ${
                stepStatuses.final === 'approved' ? 'text-green-800' : 'text-red-800'
              }`}>
                {stepStatuses.final === 'approved' ? 'NOC Approved' : 'NOC Rejected'}
              </h3>
            </div>
            
            <p className={`text-sm mb-4 ${
              stepStatuses.final === 'approved' ? 'text-green-700' : 'text-red-700'
            }`}>
              {stepStatuses.final === 'approved' 
                ? 'Student meets all requirements for NOC clearance.'
                : 'Student does not meet the minimum requirements for NOC clearance.'
              }
            </p>
            
            <div className="flex gap-3 justify-center">
              {stepStatuses.final === 'approved' ? (
                <Button 
                  onClick={approveNOC}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={student.nocStatus === 'approved'}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {student.nocStatus === 'approved' ? 'Already Approved' : 'Approve NOC'}
                </Button>
              ) : (
                <Button 
                  onClick={rejectNOC}
                  variant="destructive"
                  disabled={student.nocStatus === 'rejected'}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  {student.nocStatus === 'rejected' ? 'Already Rejected' : 'Reject NOC'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <Button variant="ghost" onClick={onBack} className="mb-2">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Students
            </Button>
            <h1 className="text-2xl font-bold">NOC Compliance Workflow</h1>
            <p className="text-gray-600">{student.name} ({student.rollNo})</p>
          </div>
          <div className="text-right">
            <Badge 
              className={
                student.nocStatus === 'approved' ? 'bg-green-100 text-green-800' :
                student.nocStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }
            >
              {student.nocStatus.toUpperCase()}
            </Badge>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div 
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    currentStep >= step.id 
                      ? 'bg-blue-500 border-blue-500 text-white' 
                      : 'bg-white border-gray-300 text-gray-500'
                  } cursor-pointer`}
                  onClick={() => setCurrentStep(step.id)}
                >
                  {getStepIcon(step, stepStatuses[step.key]) || <span>{step.id}</span>}
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-1 w-24 mx-4 ${
                    currentStep > step.id ? 'bg-blue-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          
          <div className="text-center">
            <h2 className="text-lg font-semibold">{steps[currentStep - 1].title}</h2>
            <p className="text-gray-600">{steps[currentStep - 1].description}</p>
          </div>
        </div>

        {/* Step Content */}
        <div className="max-w-4xl mx-auto">
          {currentStep === 1 && renderAttendanceStep()}
          {currentStep === 2 && renderAssignmentsStep()}
          {currentStep === 3 && renderSCEStep()}
          {currentStep === 4 && renderFinalStep()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-8 max-w-4xl mx-auto">
          <Button 
            variant="outline"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          <Button 
            onClick={() => setCurrentStep(Math.min(4, currentStep + 1))}
            disabled={currentStep === 4}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}