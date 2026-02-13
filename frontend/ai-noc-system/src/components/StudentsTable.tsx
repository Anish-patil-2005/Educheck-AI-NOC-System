import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Progress } from './ui/progress';
import { CheckCircle, XCircle, AlertTriangle, FileText, Eye } from 'lucide-react';

// Mock student data with attendance and NOC status
const students = [
  {
    id: 1,
    name: 'John Smith',
    rollNumber: 'CS21001',
    email: 'john.smith@student.edu',
    attendance: 92,
    nocRequired: false,
    nocStatus: 'Not Required',
    assignmentSubmitted: true,
    plagiarismStatus: 'Clear',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face'
  },
  {
    id: 2,
    name: 'Sarah Johnson',
    rollNumber: 'CS21002',
    email: 'sarah.johnson@student.edu',
    attendance: 68,
    nocRequired: true,
    nocStatus: 'Pending Assignment',
    assignmentSubmitted: false,
    plagiarismStatus: 'Pending',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=40&h=40&fit=crop&crop=face'
  },
  {
    id: 3,
    name: 'Michael Brown',
    rollNumber: 'CS21003',
    email: 'michael.brown@student.edu',
    attendance: 71,
    nocRequired: true,
    nocStatus: 'Assignment Submitted',
    assignmentSubmitted: true,
    plagiarismStatus: 'Clear',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face'
  },
  {
    id: 4,
    name: 'Emily Davis',
    rollNumber: 'CS21004',
    email: 'emily.davis@student.edu',
    attendance: 85,
    nocRequired: false,
    nocStatus: 'Not Required',
    assignmentSubmitted: true,
    plagiarismStatus: 'Clear',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face'
  },
  {
    id: 5,
    name: 'David Wilson',
    rollNumber: 'CS21005',
    email: 'david.wilson@student.edu',
    attendance: 62,
    nocRequired: true,
    nocStatus: 'Assignment Submitted',
    assignmentSubmitted: true,
    plagiarismStatus: 'Flagged',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face'
  },
  {
    id: 6,
    name: 'Lisa Chen',
    rollNumber: 'CS21006',
    email: 'lisa.chen@student.edu',
    attendance: 78,
    nocRequired: false,
    nocStatus: 'Not Required',
    assignmentSubmitted: true,
    plagiarismStatus: 'Clear',
    avatar: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=40&h=40&fit=crop&crop=face'
  }
];

export function StudentsTable() {
  const getComplianceStatus = (student: any) => {
    if (student.attendance >= 75 && student.plagiarismStatus === 'Clear') {
      return { status: 'compliant', color: 'bg-green-500', icon: CheckCircle, text: 'Compliant' };
    } else if (student.attendance < 75 && student.nocStatus === 'Assignment Submitted' && student.plagiarismStatus === 'Clear') {
      return { status: 'noc-cleared', color: 'bg-green-500', icon: CheckCircle, text: 'NOC Cleared' };
    } else if (student.attendance < 75 && !student.assignmentSubmitted) {
      return { status: 'noc-pending', color: 'bg-red-500', icon: XCircle, text: 'NOC Required' };
    } else if (student.plagiarismStatus === 'Flagged') {
      return { status: 'flagged', color: 'bg-red-500', icon: AlertTriangle, text: 'Flagged' };
    } else {
      return { status: 'under-review', color: 'bg-orange-500', icon: AlertTriangle, text: 'Under Review' };
    }
  };

  const getAttendanceBadge = (attendance: number) => {
    if (attendance >= 75) {
      return <Badge className="bg-green-100 text-green-800">{attendance}%</Badge>;
    } else {
      return <Badge variant="destructive">{attendance}%</Badge>;
    }
  };

  const getNOCStatusBadge = (status: string) => {
    switch (status) {
      case 'Not Required':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Not Required</Badge>;
      case 'Pending Assignment':
        return <Badge variant="destructive">Pending Assignment</Badge>;
      case 'Assignment Submitted':
        return <Badge className="bg-blue-100 text-blue-800">Under Review</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPlagiarismBadge = (status: string) => {
    switch (status) {
      case 'Clear':
        return <Badge className="bg-green-100 text-green-800">Clear</Badge>;
      case 'Flagged':
        return <Badge variant="destructive">Flagged</Badge>;
      case 'Pending':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Student</TableHead>
          <TableHead>Roll Number</TableHead>
          <TableHead>Attendance</TableHead>
          <TableHead>NOC Status</TableHead>
          <TableHead>Plagiarism Check</TableHead>
          <TableHead>Compliance</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {students.map((student) => {
          const compliance = getComplianceStatus(student);
          const ComplianceIcon = compliance.icon;
          
          return (
            <TableRow key={student.id} className="hover:bg-gray-50">
              <TableCell>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={student.avatar} />
                      <AvatarFallback>{student.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    {/* Visual Flag Indicator */}
                    <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${compliance.color} border-2 border-white`}></div>
                  </div>
                  <div>
                    <p className="text-sm">{student.name}</p>
                    <p className="text-xs text-gray-500">{student.email}</p>
                  </div>
                </div>
              </TableCell>
              
              <TableCell className="text-sm">{student.rollNumber}</TableCell>
              
              <TableCell>
                <div className="space-y-1">
                  {getAttendanceBadge(student.attendance)}
                  <Progress value={student.attendance} className="w-16 h-2" />
                </div>
              </TableCell>
              
              <TableCell>
                {getNOCStatusBadge(student.nocStatus)}
              </TableCell>
              
              <TableCell>
                {getPlagiarismBadge(student.plagiarismStatus)}
              </TableCell>
              
              <TableCell>
                <div className="flex items-center space-x-2">
                  <ComplianceIcon className={`w-4 h-4 text-white p-0.5 rounded-full ${compliance.color}`} />
                  <span className="text-sm">{compliance.text}</span>
                </div>
              </TableCell>
              
              <TableCell>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline">
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  {student.nocRequired && (
                    <Button size="sm" variant="ghost">
                      <FileText className="w-4 h-4 mr-1" />
                      NOC
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}