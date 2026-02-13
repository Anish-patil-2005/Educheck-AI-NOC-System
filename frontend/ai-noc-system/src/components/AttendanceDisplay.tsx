import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { 
  Users, 
  Filter, 
  Eye,
  Calendar,
  BookOpen,
  GraduationCap,
  CheckCircle,
  AlertTriangle,
  Clock,
  Monitor,
  FlaskConical,
  User
} from 'lucide-react';

interface AttendanceRecord {
  id: string;
  studentName: string;
  studentRollNo: string;
  class: string;
  division: string;
  batch: string;
  year: string;
  subject: string;
  attendanceType: 'Theory' | 'Practical' | 'Tutorial';
  totalClasses: number;
  attendedClasses: number;
  attendancePercentage: number;
  lastUpdated: string;
}

interface AttendanceDisplayProps {
  onBack: () => void;
  userRole: 'student' | 'admin' | 'teacher';
}

export function AttendanceDisplay({ onBack, userRole }: AttendanceDisplayProps) {
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [selectedBatch, setSelectedBatch] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedAttendanceType, setSelectedAttendanceType] = useState<string>('all');

  // Current student data (for student view)
  const currentStudent = {
    name: 'Gaurang Chavan',
    rollNo: '21310104',
    class: 'TE IT',
    division: 'A',
    batch: 'Batch 1',
    year: '2024-25'
  };

  // Mock attendance data - for student view, only show current student's data
  const allAttendanceRecords: AttendanceRecord[] = userRole === 'student' ? [
    // Current student's attendance records
    {
      id: '1',
      studentName: currentStudent.name,
      studentRollNo: currentStudent.rollNo,
      class: currentStudent.class,
      division: currentStudent.division,
      batch: currentStudent.batch,
      year: currentStudent.year,
      subject: 'Data Structures',
      attendanceType: 'Theory',
      totalClasses: 45,
      attendedClasses: 38,
      attendancePercentage: 84,
      lastUpdated: '2024-11-22'
    },
    {
      id: '2',
      studentName: currentStudent.name,
      studentRollNo: currentStudent.rollNo,
      class: currentStudent.class,
      division: currentStudent.division,
      batch: currentStudent.batch,
      year: currentStudent.year,
      subject: 'Data Structures',
      attendanceType: 'Practical',
      totalClasses: 30,
      attendedClasses: 28,
      attendancePercentage: 93,
      lastUpdated: '2024-11-21'
    },
    {
      id: '3',
      studentName: currentStudent.name,
      studentRollNo: currentStudent.rollNo,
      class: currentStudent.class,
      division: currentStudent.division,
      batch: currentStudent.batch,
      year: currentStudent.year,
      subject: 'Data Structures',
      attendanceType: 'Tutorial',
      totalClasses: 15,
      attendedClasses: 12,
      attendancePercentage: 80,
      lastUpdated: '2024-11-20'
    },
    {
      id: '4',
      studentName: currentStudent.name,
      studentRollNo: currentStudent.rollNo,
      class: currentStudent.class,
      division: currentStudent.division,
      batch: currentStudent.batch,
      year: currentStudent.year,
      subject: 'Computer Networks',
      attendanceType: 'Theory',
      totalClasses: 42,
      attendedClasses: 36,
      attendancePercentage: 86,
      lastUpdated: '2024-11-22'
    },
    {
      id: '5',
      studentName: currentStudent.name,
      studentRollNo: currentStudent.rollNo,
      class: currentStudent.class,
      division: currentStudent.division,
      batch: currentStudent.batch,
      year: currentStudent.year,
      subject: 'Computer Networks',
      attendanceType: 'Practical',
      totalClasses: 25,
      attendedClasses: 23,
      attendancePercentage: 92,
      lastUpdated: '2024-11-21'
    },
    {
      id: '6',
      studentName: currentStudent.name,
      studentRollNo: currentStudent.rollNo,
      class: currentStudent.class,
      division: currentStudent.division,
      batch: currentStudent.batch,
      year: currentStudent.year,
      subject: 'Database Management',
      attendanceType: 'Theory',
      totalClasses: 40,
      attendedClasses: 29,
      attendancePercentage: 73,
      lastUpdated: '2024-11-22'
    },
    {
      id: '7',
      studentName: currentStudent.name,
      studentRollNo: currentStudent.rollNo,
      class: currentStudent.class,
      division: currentStudent.division,
      batch: currentStudent.batch,
      year: currentStudent.year,
      subject: 'Database Management',
      attendanceType: 'Practical',
      totalClasses: 28,
      attendedClasses: 26,
      attendancePercentage: 93,
      lastUpdated: '2024-11-21'
    },
    {
      id: '8',
      studentName: currentStudent.name,
      studentRollNo: currentStudent.rollNo,
      class: currentStudent.class,
      division: currentStudent.division,
      batch: currentStudent.batch,
      year: currentStudent.year,
      subject: 'Web Technologies',
      attendanceType: 'Theory',
      totalClasses: 38,
      attendedClasses: 27,
      attendancePercentage: 71,
      lastUpdated: '2024-11-22'
    },
    {
      id: '9',
      studentName: currentStudent.name,
      studentRollNo: currentStudent.rollNo,
      class: currentStudent.class,
      division: currentStudent.division,
      batch: currentStudent.batch,
      year: currentStudent.year,
      subject: 'Web Technologies',
      attendanceType: 'Practical',
      totalClasses: 32,
      attendedClasses: 30,
      attendancePercentage: 94,
      lastUpdated: '2024-11-21'
    },
    {
      id: '10',
      studentName: currentStudent.name,
      studentRollNo: currentStudent.rollNo,
      class: currentStudent.class,
      division: currentStudent.division,
      batch: currentStudent.batch,
      year: currentStudent.year,
      subject: 'Software Engineering',
      attendanceType: 'Theory',
      totalClasses: 44,
      attendedClasses: 41,
      attendancePercentage: 93,
      lastUpdated: '2024-11-22'
    }
  ] : [
    // All students data for teacher view (sample data)
    {
      id: '1',
      studentName: 'Aarav Sharma',
      studentRollNo: '21310101',
      class: 'TE IT',
      division: 'A',
      batch: 'Batch 1',
      year: '2024-25',
      subject: 'Data Structures',
      attendanceType: 'Theory',
      totalClasses: 45,
      attendedClasses: 38,
      attendancePercentage: 84,
      lastUpdated: '2024-11-22'
    },
    {
      id: '2',
      studentName: 'Vivaan Patel',
      studentRollNo: '21310102',
      class: 'TE IT',
      division: 'A',
      batch: 'Batch 1',
      year: '2024-25',
      subject: 'Data Structures',
      attendanceType: 'Theory',
      totalClasses: 45,
      attendedClasses: 42,
      attendancePercentage: 93,
      lastUpdated: '2024-11-22'
    },
    // Add more sample records as needed
  ];

  const classes = ['TE IT', 'BE IT', 'SE IT', 'FE IT'];
  const subjects = ['Data Structures', 'Computer Networks', 'Database Management', 'Web Technologies', 'Software Engineering', 'Machine Learning', 'Artificial Intelligence', 'Operating Systems'];
  const divisions = ['A', 'B', 'C'];
  const batches = ['Batch 1', 'Batch 2', 'Batch 3', 'Batch 4'];
  const years = ['2024-25', '2023-24', '2022-23', '2021-22'];
  const attendanceTypes = ['Theory', 'Practical', 'Tutorial'];

  const filteredAttendanceRecords = allAttendanceRecords.filter(record => {
    const classMatch = selectedClass === 'all' || record.class === selectedClass;
    const subjectMatch = selectedSubject === 'all' || record.subject === selectedSubject;
    const divisionMatch = selectedDivision === 'all' || record.division === selectedDivision;
    const batchMatch = selectedBatch === 'all' || record.batch === selectedBatch;
    const yearMatch = selectedYear === 'all' || record.year === selectedYear;
    const attendanceTypeMatch = selectedAttendanceType === 'all' || record.attendanceType === selectedAttendanceType;

    return classMatch && subjectMatch && divisionMatch && batchMatch && yearMatch && attendanceTypeMatch;
  });

  const getAttendanceStatus = (percentage: number) => {
    if (percentage >= 75) {
      return { status: 'Good', color: 'bg-green-100 text-green-800', icon: CheckCircle };
    } else if (percentage >= 65) {
      return { status: 'Warning', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle };
    } else {
      return { status: 'Critical', color: 'bg-red-100 text-red-800', icon: AlertTriangle };
    }
  };

  const getAttendanceTypeIcon = (type: string) => {
    switch (type) {
      case 'Theory':
        return <BookOpen className="w-4 h-4" />;
      case 'Practical':
        return <Monitor className="w-4 h-4" />;
      case 'Tutorial':
        return <FlaskConical className="w-4 h-4" />;
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  };

  // Calculate summary statistics
  const totalRecords = filteredAttendanceRecords.length;
  const goodAttendance = filteredAttendanceRecords.filter(r => r.attendancePercentage >= 75).length;
  const warningAttendance = filteredAttendanceRecords.filter(r => r.attendancePercentage >= 65 && r.attendancePercentage < 75).length;
  const criticalAttendance = filteredAttendanceRecords.filter(r => r.attendancePercentage < 65).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <Button variant="ghost" onClick={onBack} className="mb-2">
              <Eye className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl mb-2">
              {userRole === 'student' ? 'My Attendance' : 'Attendance Display'}
            </h1>
            <p className="text-gray-600">
              {userRole === 'student' 
                ? 'View your attendance records across all subjects and types'
                : 'Monitor student attendance across classes and subjects'
              }
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Student Info Card (for student view) */}
        {userRole === 'student' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Student Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium">{currentStudent.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Roll Number</p>
                  <p className="font-medium">{currentStudent.rollNo}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Class & Division</p>
                  <p className="font-medium">{currentStudent.class} {currentStudent.division}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Batch</p>
                  <p className="font-medium">{currentStudent.batch}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="w-5 h-5 text-blue-600" />
                Total Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{totalRecords}</div>
              <p className="text-sm text-gray-600">Attendance records</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Good (≥75%)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{goodAttendance}</div>
              <p className="text-sm text-gray-600">Subjects/Types</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                Warning (65-74%)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{warningAttendance}</div>
              <p className="text-sm text-gray-600">Need attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Critical (&lt;65%)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{criticalAttendance}</div>
              <p className="text-sm text-gray-600">Urgent action</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filter Attendance Records
            </CardTitle>
            <CardDescription>
              Filter attendance by subject, class, and type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
              {userRole === 'teacher' && (
                <>
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
                </>
              )}

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
                <Label htmlFor="filter-attendance-type">Attendance Type</Label>
                <Select value={selectedAttendanceType} onValueChange={setSelectedAttendanceType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {attendanceTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {userRole === 'teacher' && (
                <div>
                  <Label htmlFor="filter-year">Academic Year</Label>
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
              )}
            </div>
          </CardContent>
        </Card>

        {/* Attendance Records Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Attendance Records
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {filteredAttendanceRecords.length} records
              </Badge>
            </CardTitle>
            <CardDescription>
              {userRole === 'student' 
                ? 'Your attendance records across all subjects'
                : 'Student attendance records'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredAttendanceRecords.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="mb-2">No attendance records found</h3>
                <p className="text-gray-600">Try adjusting your filters to see more records</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {userRole === 'teacher' && <TableHead>Student</TableHead>}
                      <TableHead>Subject</TableHead>
                      <TableHead>Type</TableHead>
                      {userRole === 'teacher' && <TableHead>Class Info</TableHead>}
                      <TableHead>Classes</TableHead>
                      <TableHead>Percentage</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAttendanceRecords.map((record) => {
                      const attendanceStatus = getAttendanceStatus(record.attendancePercentage);
                      const StatusIcon = attendanceStatus.icon;

                      return (
                        <TableRow key={record.id}>
                          {userRole === 'teacher' && (
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                                  {record.studentName.charAt(0)}
                                </div>
                                <div>
                                  <div className="font-medium">{record.studentName}</div>
                                  <div className="text-sm text-gray-500">{record.studentRollNo}</div>
                                </div>
                              </div>
                            </TableCell>
                          )}
                          <TableCell>
                            <div className="font-medium">{record.subject}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getAttendanceTypeIcon(record.attendanceType)}
                              <span className="text-sm">{record.attendanceType}</span>
                            </div>
                          </TableCell>
                          {userRole === 'teacher' && (
                            <TableCell>
                              <div className="text-sm">
                                <div>{record.class} {record.division}</div>
                                <div className="text-gray-500">{record.batch}</div>
                              </div>
                            </TableCell>
                          )}
                          <TableCell>
                            <div className="text-sm">
                              <div className="font-medium">{record.attendedClasses}/{record.totalClasses}</div>
                              <div className="text-gray-500">Attended/Total</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-lg">{record.attendancePercentage}%</div>
                          </TableCell>
                          <TableCell>
                            <Badge className={attendanceStatus.color}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {attendanceStatus.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="w-3 h-3" />
                              {new Date(record.lastUpdated).toLocaleDateString()}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
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