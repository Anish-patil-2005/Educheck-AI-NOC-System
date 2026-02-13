import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Checkbox } from './ui/checkbox';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { CalendarDays, Save, Upload, Users } from 'lucide-react';

// Mock student data for attendance
const students = [
  {
    id: 1,
    name: 'John Smith',
    rollNumber: 'CS21001',
    currentAttendance: 92,
    isPresent: true,
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face'
  },
  {
    id: 2,
    name: 'Sarah Johnson',
    rollNumber: 'CS21002',
    currentAttendance: 68,
    isPresent: false,
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=40&h=40&fit=crop&crop=face'
  },
  {
    id: 3,
    name: 'Michael Brown',
    rollNumber: 'CS21003',
    currentAttendance: 71,
    isPresent: true,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face'
  },
  {
    id: 4,
    name: 'Emily Davis',
    rollNumber: 'CS21004',
    currentAttendance: 85,
    isPresent: true,
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face'
  },
  {
    id: 5,
    name: 'David Wilson',
    rollNumber: 'CS21005',
    currentAttendance: 62,
    isPresent: false,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face'
  },
  {
    id: 6,
    name: 'Lisa Chen',
    rollNumber: 'CS21006',
    currentAttendance: 78,
    isPresent: true,
    avatar: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=40&h=40&fit=crop&crop=face'
  }
];

export function AttendanceInput() {
  const [attendanceData, setAttendanceData] = useState(students);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCourse, setSelectedCourse] = useState('CS301');

  const handleAttendanceChange = (studentId: number, isPresent: boolean) => {
    setAttendanceData(prev => 
      prev.map(student => 
        student.id === studentId 
          ? { ...student, isPresent }
          : student
      )
    );
  };

  const markAllPresent = () => {
    setAttendanceData(prev => 
      prev.map(student => ({ ...student, isPresent: true }))
    );
  };

  const markAllAbsent = () => {
    setAttendanceData(prev => 
      prev.map(student => ({ ...student, isPresent: false }))
    );
  };

  const saveAttendance = () => {
    console.log('Saving attendance:', { 
      date: selectedDate, 
      course: selectedCourse, 
      attendance: attendanceData 
    });
    // Here you would typically send the data to your backend
  };

  const presentCount = attendanceData.filter(s => s.isPresent).length;
  const absentCount = attendanceData.length - presentCount;

  return (
    <div className="space-y-6">
      {/* Attendance Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CalendarDays className="w-5 h-5" />
            <span>Mark Attendance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="course">Course</Label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger>
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CS301">CS301 - Data Structures</SelectItem>
                  <SelectItem value="CS302">CS302 - Algorithms</SelectItem>
                  <SelectItem value="CS303">CS303 - Database Systems</SelectItem>
                  <SelectItem value="CS304">CS304 - Computer Networks</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end space-x-2">
              <Button variant="outline" onClick={markAllPresent}>
                Mark All Present
              </Button>
              <Button variant="outline" onClick={markAllAbsent}>
                Mark All Absent
              </Button>
            </div>
            <div className="flex items-end">
              <Button onClick={saveAttendance} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                Save Attendance
              </Button>
            </div>
          </div>

          {/* Attendance Summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl text-green-600 mb-1">{presentCount}</div>
                <div className="text-sm text-gray-600">Present</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl text-red-600 mb-1">{absentCount}</div>
                <div className="text-sm text-gray-600">Absent</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl text-blue-600 mb-1">{attendanceData.length}</div>
                <div className="text-sm text-gray-600">Total Students</div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Student Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Student List - {selectedCourse}</span>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Import from VIERP
              </Button>
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                {attendanceData.length} students
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Roll Number</TableHead>
                <TableHead>Current Attendance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Present</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendanceData.map((student) => (
                <TableRow key={student.id} className={student.isPresent ? 'bg-green-50' : 'bg-red-50'}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={student.avatar} />
                        <AvatarFallback>{student.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{student.name}</span>
                    </div>
                  </TableCell>
                  
                  <TableCell className="text-sm">{student.rollNumber}</TableCell>
                  
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant={student.currentAttendance >= 75 ? "secondary" : "destructive"}
                        className={student.currentAttendance >= 75 ? "bg-green-100 text-green-800" : ""}
                      >
                        {student.currentAttendance}%
                      </Badge>
                      {student.currentAttendance < 75 && (
                        <Badge variant="outline" className="text-orange-600 border-orange-300">
                          NOC Required
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge 
                      variant={student.isPresent ? "secondary" : "destructive"}
                      className={student.isPresent ? "bg-green-100 text-green-800" : ""}
                    >
                      {student.isPresent ? 'Present' : 'Absent'}
                    </Badge>
                  </TableCell>
                  
                  <TableCell className="text-center">
                    <Checkbox
                      checked={student.isPresent}
                      onCheckedChange={(checked) => 
                        handleAttendanceChange(student.id, checked as boolean)
                      }
                      className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}