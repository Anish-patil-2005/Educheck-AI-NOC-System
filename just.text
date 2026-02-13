import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  CheckCircle,
  Clock,
  Filter,
  Search,
  Users,
  Eye,
  BookOpen,
  GraduationCap,
  Award,
  FileText,
  Calendar
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Label } from "./ui/label";
import { Input } from "./ui/input";

// Interface for NOC student data
interface NOCStudent {
  id: string;
  studentName: string;
  rollNumber: string;
  class: string;
  division: string;
  batch: string;
  year: string;
  attendance: number;
  sceStatus: 'completed' | 'not-completed';
  cieStatus: 'completed' | 'not-completed';
  assignmentStatus: 'completed' | 'not-completed';
  nocStatus: 'approved' | 'rejected' | 'pending';
  subject: string;
}

// Interface for student subject data
interface StudentSubject {
  id: string;
  subject: string;
  subjectType: 'theory' | 'practical' | 'tutorial';
  attendance: number;
  sceStatus: 'completed' | 'not-completed';
  cieStatus: 'completed' | 'not-completed';
  assignmentStatus: 'completed' | 'not-completed';
  nocStatus: 'approved' | 'rejected' | 'pending';
}

interface NOCManagementProps {
  onBack: () => void;
  userRole: 'student' |'admin'| 'teacher';
}

export function NOCManagement({ onBack, userRole }: NOCManagementProps) {
  // Sample NOC student data for teacher view
  const nocStudents: NOCStudent[] = [
    {
      id: '1',
      studentName: 'Aarav Sharma',
      rollNumber: '21310101',
      class: 'TE IT',
      division: 'A',
      batch: 'Batch 1',
      year: '2024-25',
      subject: 'Data Structures',
      attendance: 68,
      sceStatus: 'completed',
      cieStatus: 'completed',
      assignmentStatus: 'not-completed',
      nocStatus: 'pending'
    },
    {
      id: '2',
      studentName: 'Vivaan Patel',
      rollNumber: '21310102',
      class: 'TE IT',
      division: 'A',
      batch: 'Batch 1',
      year: '2024-25',
      subject: 'Data Structures',
      attendance: 72,
      sceStatus: 'completed',
      cieStatus: 'completed',
      assignmentStatus: 'completed',
      nocStatus: 'approved'
    },
    {
      id: '3',
      studentName: 'Aditya Kumar',
      rollNumber: '21310103',
      class: 'TE IT',
      division: 'A',
      batch: 'Batch 2',
      year: '2024-25',
      subject: 'Computer Networks',
      attendance: 65,
      sceStatus: 'not-completed',
      cieStatus: 'completed',
      assignmentStatus: 'completed',
      nocStatus: 'pending'
    },
    {
      id: '4',
      studentName: 'Priya Sharma',
      rollNumber: '21310201',
      class: 'TE IT',
      division: 'B',
      batch: 'Batch 1',
      year: '2024-25',
      subject: 'Database Management',
      attendance: 78,
      sceStatus: 'completed',
      cieStatus: 'completed',
      assignmentStatus: 'completed',
      nocStatus: 'approved'
    },
    {
      id: '5',
      studentName: 'Aryan Verma',
      rollNumber: '22310101',
      class: 'BE IT',
      division: 'A',
      batch: 'Batch 1',
      year: '2024-25',
      subject: 'Machine Learning',
      attendance: 82,
      sceStatus: 'completed',
      cieStatus: 'completed',
      assignmentStatus: 'completed',
      nocStatus: 'approved'
    },
    {
      id: '6',
      studentName: 'Kavya Singh',
      rollNumber: '21310104',
      class: 'TE IT',
      division: 'A',
      batch: 'Batch 2',
      year: '2024-25',
      subject: 'Web Technologies',
      attendance: 69,
      sceStatus: 'completed',
      cieStatus: 'not-completed',
      assignmentStatus: 'completed',
      nocStatus: 'pending'
    },
    {
      id: '7',
      studentName: 'Rohit Mehta',
      rollNumber: '21310105',
      class: 'TE IT',
      division: 'B',
      batch: 'Batch 2',
      year: '2024-25',
      subject: 'Software Engineering',
      attendance: 58,
      sceStatus: 'not-completed',
      cieStatus: 'not-completed',
      assignmentStatus: 'not-completed',
      nocStatus: 'rejected'
    },
    {
      id: '8',
      studentName: 'Sneha Reddy',
      rollNumber: '22310102',
      class: 'BE IT',
      division: 'B',
      batch: 'Batch 1',
      year: '2024-25',
      subject: 'Artificial Intelligence',
      attendance: 75,
      sceStatus: 'completed',
      cieStatus: 'completed',
      assignmentStatus: 'completed',
      nocStatus: 'approved'
    }
  ];

  // Sample student subject data for student view
  const studentSubjects: StudentSubject[] = [
    {
      id: '1',
      subject: 'Data Structures',
      subjectType: 'theory',
      attendance: 72,
      sceStatus: 'completed',
      cieStatus: 'completed',
      assignmentStatus: 'completed',
      nocStatus: 'approved'
    },
    {
      id: '2',
      subject: 'Data Structures Lab',
      subjectType: 'practical',
      attendance: 78,
      sceStatus: 'completed',
      cieStatus: 'completed',
      assignmentStatus: 'completed',
      nocStatus: 'approved'
    },
    {
      id: '3',
      subject: 'Computer Networks',
      subjectType: 'theory',
      attendance: 68,
      sceStatus: 'completed',
      cieStatus: 'not-completed',
      assignmentStatus: 'completed',
      nocStatus: 'pending'
    },
    {
      id: '4',
      subject: 'Computer Networks Lab',
      subjectType: 'practical',
      attendance: 71,
      sceStatus: 'completed',
      cieStatus: 'completed',
      assignmentStatus: 'not-completed',
      nocStatus: 'pending'
    },
    {
      id: '5',
      subject: 'Database Management',
      subjectType: 'theory',
      attendance: 85,
      sceStatus: 'completed',
      cieStatus: 'completed',
      assignmentStatus: 'completed',
      nocStatus: 'approved'
    },
    {
      id: '6',
      subject: 'Database Tutorial',
      subjectType: 'tutorial',
      attendance: 82,
      sceStatus: 'completed',
      cieStatus: 'completed',
      assignmentStatus: 'completed',
      nocStatus: 'approved'
    },
    {
      id: '7',
      subject: 'Web Technologies',
      subjectType: 'theory',
      attendance: 69,
      sceStatus: 'not-completed',
      cieStatus: 'completed',
      assignmentStatus: 'completed',
      nocStatus: 'pending'
    },
    {
      id: '8',
      subject: 'Web Technologies Lab',
      subjectType: 'practical',
      attendance: 74,
      sceStatus: 'completed',
      cieStatus: 'completed',
      assignmentStatus: 'completed',
      nocStatus: 'approved'
    }
  ];

  const classes = ['TE IT', 'BE IT', 'SE IT', 'FE IT'];
  const subjects = ['Data Structures', 'Computer Networks', 'Database Management', 'Web Technologies', 'Software Engineering', 'Machine Learning', 'Artificial Intelligence', 'Operating Systems'];
  const divisions = ['A', 'B', 'C'];
  const batches = ['Batch 1', 'Batch 2', 'Batch 3', 'Batch 4'];
  const years = ['2024-25', '2023-24', '2022-23', '2021-22'];

  // Teacher filters
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [selectedBatch, setSelectedBatch] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Filter students for teacher view
  const filteredStudents = nocStudents.filter(student => {
    const classMatch = selectedClass === 'all' || student.class === selectedClass;
    const subjectMatch = selectedSubject === 'all' || student.subject === selectedSubject;
    const divisionMatch = selectedDivision === 'all' || student.division === selectedDivision;
    const batchMatch = selectedBatch === 'all' || student.batch === selectedBatch;
    const yearMatch = selectedYear === 'all' || student.year === selectedYear;
    const searchMatch = !searchTerm || 
      student.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase());

    return classMatch && subjectMatch && divisionMatch && batchMatch && yearMatch && searchMatch;
  });

  const getStatusBadge = (status: 'completed' | 'not-completed' | 'approved' | 'rejected' | 'pending') => {
    switch (status) {
      case 'completed':
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'not-completed':
        return <Badge className="bg-red-100 text-red-800">Not Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getNOCStatusBadge = (status: 'approved' | 'rejected' | 'pending') => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getAttendanceBadge = (attendance: number) => {
    if (attendance >= 75) {
      return <Badge className="bg-green-100 text-green-800">{attendance}%</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800">{attendance}%</Badge>;
    }
  };

  const getSubjectTypeBadge = (type: 'theory' | 'practical' | 'tutorial') => {
    const colors = {
      'theory': 'bg-blue-100 text-blue-800',
      'practical': 'bg-green-100 text-green-800',
      'tutorial': 'bg-purple-100 text-purple-800'
    };
    return <Badge className={colors[type]}>{type.charAt(0).toUpperCase() + type.slice(1)}</Badge>;
  };

  // Calculate summary statistics
  const totalStudents = filteredStudents.length;
  const approvedNOCs = filteredStudents.filter(s => s.nocStatus === 'approved').length;
  const pendingNOCs = filteredStudents.filter(s => s.nocStatus === 'pending').length;
  const rejectedNOCs = filteredStudents.filter(s => s.nocStatus === 'rejected').length;

  if (userRole === 'teacher') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Button variant="ghost" onClick={onBack} className="mb-2">
                <Eye className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <h1 className="text-2xl mb-2">NOC Management Dashboard</h1>
              <p className="text-gray-600">Monitor and manage NOC compliance status for students</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filter Students
              </CardTitle>
              <CardDescription>
                Select filters to view students from specific classes, subjects, and divisions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
                <div>
                  <Label htmlFor="filter-class">Class</Label>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Classes</SelectItem>
                      {classes.map(cls => (
                        <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="filter-subject">Subject</Label>
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Subjects</SelectItem>
                      {subjects.map(subject => (
                        <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="filter-division">Division</Label>
                  <Select value={selectedDivision} onValueChange={setSelectedDivision}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select division" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Divisions</SelectItem>
                      {divisions.map(div => (
                        <SelectItem key={div} value={div}>{div}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="filter-batch">Batch</Label>
                  <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select batch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Batches</SelectItem>
                      {batches.map(batch => (
                        <SelectItem key={batch} value={batch}>{batch}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="filter-year">Year</Label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Years</SelectItem>
                      {years.map(year => (
                        <SelectItem key={year} value={year}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="search"
                      placeholder="Search students..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="w-5 h-5 text-blue-600" />
                  Total Students
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{totalStudents}</div>
                <p className="text-sm text-gray-600">in current filter</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Approved NOCs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{approvedNOCs}</div>
                <p className="text-sm text-gray-600">students cleared</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="w-5 h-5 text-yellow-600" />
                  Pending NOCs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{pendingNOCs}</div>
                <p className="text-sm text-gray-600">awaiting review</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="w-5 h-5 text-red-600" />
                  Rejected NOCs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{rejectedNOCs}</div>
                <p className="text-sm text-gray-600">need attention</p>
              </CardContent>
            </Card>
          </div>

          {/* Students NOC Status Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Students NOC Status
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {filteredStudents.length} students
                </Badge>
              </CardTitle>
              <CardDescription>
                NOC compliance status for all students with component-wise breakdown
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredStudents.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="mb-2">No students found</h3>
                  <p className="text-gray-600">Try adjusting your filters to see more students</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student Details</TableHead>
                        <TableHead className="text-center">Attendance</TableHead>
                        <TableHead className="text-center">SCE</TableHead>
                        <TableHead className="text-center">CIE</TableHead>
                        <TableHead className="text-center">Assignments</TableHead>
                        <TableHead className="text-center">NOC Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-medium">
                                {student.studentName.charAt(0)}
                              </div>
                              <div>
                                <div className="font-medium">{student.studentName}</div>
                                <div className="text-sm text-gray-500">{student.rollNumber}</div>
                                <div className="text-xs text-gray-400">
                                  {student.class} {student.division} • {student.subject}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {getAttendanceBadge(student.attendance)}
                          </TableCell>
                          <TableCell className="text-center">
                            {getStatusBadge(student.sceStatus)}
                          </TableCell>
                          <TableCell className="text-center">
                            {getStatusBadge(student.cieStatus)}
                          </TableCell>
                          <TableCell className="text-center">
                            {getStatusBadge(student.assignmentStatus)}
                          </TableCell>
                          <TableCell className="text-center">
                            {getNOCStatusBadge(student.nocStatus)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Student view
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <Button variant="ghost" onClick={onBack} className="mb-2">
              <Eye className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl mb-2">NOC Status</h1>
            <p className="text-gray-600">View your NOC compliance status across all subjects</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Summary Cards for Student */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="w-5 h-5 text-blue-600" />
                Total Subjects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{studentSubjects.length}</div>
              <p className="text-sm text-gray-600">enrolled</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Approved NOCs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {studentSubjects.filter(s => s.nocStatus === 'approved').length}
              </div>
              <p className="text-sm text-gray-600">subjects cleared</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="w-5 h-5 text-yellow-600" />
                Pending NOCs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {studentSubjects.filter(s => s.nocStatus === 'pending').length}
              </div>
              <p className="text-sm text-gray-600">under review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="w-5 h-5 text-red-600" />
                Action Required
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {studentSubjects.filter(s => s.nocStatus === 'rejected').length}
              </div>
              <p className="text-sm text-gray-600">need completion</p>
            </CardContent>
          </Card>
        </div>

        {/* Student Subject NOC Status Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Subject-wise NOC Status
            </CardTitle>
            <CardDescription>
              Your NOC compliance status for each enrolled subject
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject Details</TableHead>
                    <TableHead className="text-center">Attendance</TableHead>
                    <TableHead className="text-center">SCE</TableHead>
                    <TableHead className="text-center">CIE</TableHead>
                    <TableHead className="text-center">Assignments</TableHead>
                    <TableHead className="text-center">NOC Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentSubjects.map((subject) => (
                    <TableRow key={subject.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-medium">
                            {subject.subject.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium">{subject.subject}</div>
                            <div className="mt-1">
                              {getSubjectTypeBadge(subject.subjectType)}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {getAttendanceBadge(subject.attendance)}
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(subject.sceStatus)}
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(subject.cieStatus)}
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(subject.assignmentStatus)}
                      </TableCell>
                      <TableCell className="text-center">
                        {getNOCStatusBadge(subject.nocStatus)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}