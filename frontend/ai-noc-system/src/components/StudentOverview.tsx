import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { 
  Users, 
  Filter, 
  Search, 
  Eye,
  FileText,
  Calendar,
  GraduationCap,
  UserCheck,
  Mail,
  Phone,
  BookOpen
} from 'lucide-react';

interface Student {
  id: string;
  name: string;
  rollNo: string;
  email: string;
  phoneNumber: string;
  class: string;
  division: string;
  batch: string;
  year: string;
  status: 'active' | 'inactive';
  admissionDate: string;
  program: string;
}

interface StudentOverviewProps {
  onBack: () => void;
}

export function StudentOverview({ onBack }: StudentOverviewProps) {
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [selectedBatch, setSelectedBatch] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Comprehensive mock data for 50 students
  const allStudents: Student[] = [
    // TE IT A Division - Batch 1 (10 students)
    { id: '1', name: 'Aarav Sharma', rollNo: '21310101', email: 'aarav.sharma@viit.edu.in', phoneNumber: '+91 9876543210', class: 'TE IT', division: 'A', batch: 'Batch 1', year: '2024-25', status: 'active', admissionDate: '2022-08-15', program: 'BTech Information Technology' },
    { id: '2', name: 'Vivaan Patel', rollNo: '21310102', email: 'vivaan.patel@viit.edu.in', phoneNumber: '+91 9876543211', class: 'TE IT', division: 'A', batch: 'Batch 1', year: '2024-25', status: 'active', admissionDate: '2022-08-15', program: 'BTech Information Technology' },
    { id: '3', name: 'Aditya Kumar', rollNo: '21310103', email: 'aditya.kumar@viit.edu.in', phoneNumber: '+91 9876543212', class: 'TE IT', division: 'A', batch: 'Batch 1', year: '2024-25', status: 'active', admissionDate: '2022-08-15', program: 'BTech Information Technology' },
    { id: '4', name: 'Gaurang Chavan', rollNo: '21310104', email: 'gaurang.chavan@viit.edu.in', phoneNumber: '+91 9876543213', class: 'TE IT', division: 'A', batch: 'Batch 1', year: '2024-25', status: 'active', admissionDate: '2022-08-15', program: 'BTech Information Technology' },
    { id: '5', name: 'Arjun Gupta', rollNo: '21310105', email: 'arjun.gupta@viit.edu.in', phoneNumber: '+91 9876543214', class: 'TE IT', division: 'A', batch: 'Batch 1', year: '2024-25', status: 'active', admissionDate: '2022-08-15', program: 'BTech Information Technology' },
    { id: '6', name: 'Sai Reddy', rollNo: '21310106', email: 'sai.reddy@viit.edu.in', phoneNumber: '+91 9876543215', class: 'TE IT', division: 'A', batch: 'Batch 1', year: '2024-25', status: 'active', admissionDate: '2022-08-15', program: 'BTech Information Technology' },
    { id: '7', name: 'Reyansh Agarwal', rollNo: '21310107', email: 'reyansh.agarwal@viit.edu.in', phoneNumber: '+91 9876543216', class: 'TE IT', division: 'A', batch: 'Batch 1', year: '2024-25', status: 'active', admissionDate: '2022-08-15', program: 'BTech Information Technology' },
    { id: '8', name: 'Ayaan Khan', rollNo: '21310108', email: 'ayaan.khan@viit.edu.in', phoneNumber: '+91 9876543217', class: 'TE IT', division: 'A', batch: 'Batch 1', year: '2024-25', status: 'active', admissionDate: '2022-08-15', program: 'BTech Information Technology' },
    { id: '9', name: 'Ishaan Verma', rollNo: '21310109', email: 'ishaan.verma@viit.edu.in', phoneNumber: '+91 9876543218', class: 'TE IT', division: 'A', batch: 'Batch 1', year: '2024-25', status: 'active', admissionDate: '2022-08-15', program: 'BTech Information Technology' },
    { id: '10', name: 'Vihaan Joshi', rollNo: '21310110', email: 'vihaan.joshi@viit.edu.in', phoneNumber: '+91 9876543219', class: 'TE IT', division: 'A', batch: 'Batch 1', year: '2024-25', status: 'active', admissionDate: '2022-08-15', program: 'BTech Information Technology' },
    
    // TE IT A Division - Batch 2 (10 students)
    { id: '11', name: 'Priya Sharma', rollNo: '21310111', email: 'priya.sharma@viit.edu.in', phoneNumber: '+91 9876543220', class: 'TE IT', division: 'A', batch: 'Batch 2', year: '2024-25', status: 'active', admissionDate: '2022-08-15', program: 'BTech Information Technology' },
    { id: '12', name: 'Ananya Patel', rollNo: '21310112', email: 'ananya.patel@viit.edu.in', phoneNumber: '+91 9876543221', class: 'TE IT', division: 'A', batch: 'Batch 2', year: '2024-25', status: 'active', admissionDate: '2022-08-15', program: 'BTech Information Technology' },
    { id: '13', name: 'Kavya Kumar', rollNo: '21310113', email: 'kavya.kumar@viit.edu.in', phoneNumber: '+91 9876543222', class: 'TE IT', division: 'A', batch: 'Batch 2', year: '2024-25', status: 'active', admissionDate: '2022-08-15', program: 'BTech Information Technology' },
    { id: '14', name: 'Isha Singh', rollNo: '21310114', email: 'isha.singh@viit.edu.in', phoneNumber: '+91 9876543223', class: 'TE IT', division: 'A', batch: 'Batch 2', year: '2024-25', status: 'active', admissionDate: '2022-08-15', program: 'BTech Information Technology' },
    { id: '15', name: 'Diya Gupta', rollNo: '21310115', email: 'diya.gupta@viit.edu.in', phoneNumber: '+91 9876543224', class: 'TE IT', division: 'A', batch: 'Batch 2', year: '2024-25', status: 'active', admissionDate: '2022-08-15', program: 'BTech Information Technology' },
    { id: '16', name: 'Saanvi Reddy', rollNo: '21310116', email: 'saanvi.reddy@viit.edu.in', phoneNumber: '+91 9876543225', class: 'TE IT', division: 'A', batch: 'Batch 2', year: '2024-25', status: 'active', admissionDate: '2022-08-15', program: 'BTech Information Technology' },
    { id: '17', name: 'Myra Agarwal', rollNo: '21310117', email: 'myra.agarwal@viit.edu.in', phoneNumber: '+91 9876543226', class: 'TE IT', division: 'A', batch: 'Batch 2', year: '2024-25', status: 'active', admissionDate: '2022-08-15', program: 'BTech Information Technology' },
    { id: '18', name: 'Kiara Khan', rollNo: '21310118', email: 'kiara.khan@viit.edu.in', phoneNumber: '+91 9876543227', class: 'TE IT', division: 'A', batch: 'Batch 2', year: '2024-25', status: 'active', admissionDate: '2022-08-15', program: 'BTech Information Technology' },
    { id: '19', name: 'Zara Verma', rollNo: '21310119', email: 'zara.verma@viit.edu.in', phoneNumber: '+91 9876543228', class: 'TE IT', division: 'A', batch: 'Batch 2', year: '2024-25', status: 'active', admissionDate: '2022-08-15', program: 'BTech Information Technology' },
    { id: '20', name: 'Aahana Joshi', rollNo: '21310120', email: 'aahana.joshi@viit.edu.in', phoneNumber: '+91 9876543229', class: 'TE IT', division: 'A', batch: 'Batch 2', year: '2024-25', status: 'active', admissionDate: '2022-08-15', program: 'BTech Information Technology' },

    // TE IT B Division - Batch 1 (10 students)
    { id: '21', name: 'Rajesh Desai', rollNo: '21310201', email: 'rajesh.desai@viit.edu.in', phoneNumber: '+91 9876543230', class: 'TE IT', division: 'B', batch: 'Batch 1', year: '2024-25', status: 'active', admissionDate: '2022-08-15', program: 'BTech Information Technology' },
    { id: '22', name: 'Suresh Kulkarni', rollNo: '21310202', email: 'suresh.kulkarni@viit.edu.in', phoneNumber: '+91 9876543231', class: 'TE IT', division: 'B', batch: 'Batch 1', year: '2024-25', status: 'active', admissionDate: '2022-08-15', program: 'BTech Information Technology' },
    { id: '23', name: 'Mahesh Patil', rollNo: '21310203', email: 'mahesh.patil@viit.edu.in', phoneNumber: '+91 9876543232', class: 'TE IT', division: 'B', batch: 'Batch 1', year: '2024-25', status: 'active', admissionDate: '2022-08-15', program: 'BTech Information Technology' },
    { id: '24', name: 'Ganesh Jadhav', rollNo: '21310204', email: 'ganesh.jadhav@viit.edu.in', phoneNumber: '+91 9876543233', class: 'TE IT', division: 'B', batch: 'Batch 1', year: '2024-25', status: 'active', admissionDate: '2022-08-15', program: 'BTech Information Technology' },
    { id: '25', name: 'Ramesh Bhosale', rollNo: '21310205', email: 'ramesh.bhosale@viit.edu.in', phoneNumber: '+91 9876543234', class: 'TE IT', division: 'B', batch: 'Batch 1', year: '2024-25', status: 'active', admissionDate: '2022-08-15', program: 'BTech Information Technology' },
    { id: '26', name: 'Nilesh Shinde', rollNo: '21310206', email: 'nilesh.shinde@viit.edu.in', phoneNumber: '+91 9876543235', class: 'TE IT', division: 'B', batch: 'Batch 1', year: '2024-25', status: 'active', admissionDate: '2022-08-15', program: 'BTech Information Technology' },
    { id: '27', name: 'Kiran Gaikwad', rollNo: '21310207', email: 'kiran.gaikwad@viit.edu.in', phoneNumber: '+91 9876543236', class: 'TE IT', division: 'B', batch: 'Batch 1', year: '2024-25', status: 'active', admissionDate: '2022-08-15', program: 'BTech Information Technology' },
    { id: '28', name: 'Vikas Mane', rollNo: '21310208', email: 'vikas.mane@viit.edu.in', phoneNumber: '+91 9876543237', class: 'TE IT', division: 'B', batch: 'Batch 1', year: '2024-25', status: 'active', admissionDate: '2022-08-15', program: 'BTech Information Technology' },
    { id: '29', name: 'Sagar Pawar', rollNo: '21310209', email: 'sagar.pawar@viit.edu.in', phoneNumber: '+91 9876543238', class: 'TE IT', division: 'B', batch: 'Batch 1', year: '2024-25', status: 'active', admissionDate: '2022-08-15', program: 'BTech Information Technology' },
    { id: '30', name: 'Akash Sawant', rollNo: '21310210', email: 'akash.sawant@viit.edu.in', phoneNumber: '+91 9876543239', class: 'TE IT', division: 'B', batch: 'Batch 1', year: '2024-25', status: 'active', admissionDate: '2022-08-15', program: 'BTech Information Technology' },

    // TE IT B Division - Batch 2 (10 students)
    { id: '31', name: 'Sneha Joshi', rollNo: '21310211', email: 'sneha.joshi@viit.edu.in', phoneNumber: '+91 9876543240', class: 'TE IT', division: 'B', batch: 'Batch 2', year: '2024-25', status: 'active', admissionDate: '2022-08-15', program: 'BTech Information Technology' },
    { id: '32', name: 'Pooja Desai', rollNo: '21310212', email: 'pooja.desai@viit.edu.in', phoneNumber: '+91 9876543241', class: 'TE IT', division: 'B', batch: 'Batch 2', year: '2024-25', status: 'active', admissionDate: '2022-08-15', program: 'BTech Information Technology' },
    { id: '33', name: 'Manisha Kulkarni', rollNo: '21310213', email: 'manisha.kulkarni@viit.edu.in', phoneNumber: '+91 9876543242', class: 'TE IT', division: 'B', batch: 'Batch 2', year: '2024-25', status: 'active', admissionDate: '2022-08-15', program: 'BTech Information Technology' },
    { id: '34', name: 'Swati Patil', rollNo: '21310214', email: 'swati.patil@viit.edu.in', phoneNumber: '+91 9876543243', class: 'TE IT', division: 'B', batch: 'Batch 2', year: '2024-25', status: 'active', admissionDate: '2022-08-15', program: 'BTech Information Technology' },
    { id: '35', name: 'Neha Jadhav', rollNo: '21310215', email: 'neha.jadhav@viit.edu.in', phoneNumber: '+91 9876543244', class: 'TE IT', division: 'B', batch: 'Batch 2', year: '2024-25', status: 'active', admissionDate: '2022-08-15', program: 'BTech Information Technology' },
    { id: '36', name: 'Priyanka Bhosale', rollNo: '21310216', email: 'priyanka.bhosale@viit.edu.in', phoneNumber: '+91 9876543245', class: 'TE IT', division: 'B', batch: 'Batch 2', year: '2024-25', status: 'active', admissionDate: '2022-08-15', program: 'BTech Information Technology' },
    { id: '37', name: 'Rupali Shinde', rollNo: '21310217', email: 'rupali.shinde@viit.edu.in', phoneNumber: '+91 9876543246', class: 'TE IT', division: 'B', batch: 'Batch 2', year: '2024-25', status: 'active', admissionDate: '2022-08-15', program: 'BTech Information Technology' },
    { id: '38', name: 'Shital Gaikwad', rollNo: '21310218', email: 'shital.gaikwad@viit.edu.in', phoneNumber: '+91 9876543247', class: 'TE IT', division: 'B', batch: 'Batch 2', year: '2024-25', status: 'active', admissionDate: '2022-08-15', program: 'BTech Information Technology' },
    { id: '39', name: 'Madhuri Mane', rollNo: '21310219', email: 'madhuri.mane@viit.edu.in', phoneNumber: '+91 9876543248', class: 'TE IT', division: 'B', batch: 'Batch 2', year: '2024-25', status: 'active', admissionDate: '2022-08-15', program: 'BTech Information Technology' },
    { id: '40', name: 'Kavita Pawar', rollNo: '21310220', email: 'kavita.pawar@viit.edu.in', phoneNumber: '+91 9876543249', class: 'TE IT', division: 'B', batch: 'Batch 2', year: '2024-25', status: 'active', admissionDate: '2022-08-15', program: 'BTech Information Technology' },

    // BE IT A Division (10 students)
    { id: '41', name: 'Aryan Verma', rollNo: '22310101', email: 'aryan.verma@viit.edu.in', phoneNumber: '+91 9876543250', class: 'BE IT', division: 'A', batch: 'Batch 1', year: '2024-25', status: 'active', admissionDate: '2021-08-15', program: 'BTech Information Technology' },
    { id: '42', name: 'Kartik Joshi', rollNo: '22310102', email: 'kartik.joshi@viit.edu.in', phoneNumber: '+91 9876543251', class: 'BE IT', division: 'A', batch: 'Batch 1', year: '2024-25', status: 'active', admissionDate: '2021-08-15', program: 'BTech Information Technology' },
    { id: '43', name: 'Atharv Pandey', rollNo: '22310103', email: 'atharv.pandey@viit.edu.in', phoneNumber: '+91 9876543252', class: 'BE IT', division: 'A', batch: 'Batch 1', year: '2024-25', status: 'active', admissionDate: '2021-08-15', program: 'BTech Information Technology' },
    { id: '44', name: 'Rohit Chavan', rollNo: '22310104', email: 'rohit.chavan@viit.edu.in', phoneNumber: '+91 9876543253', class: 'BE IT', division: 'A', batch: 'Batch 1', year: '2024-25', status: 'active', admissionDate: '2021-08-15', program: 'BTech Information Technology' },
    { id: '45', name: 'Om Desai', rollNo: '22310105', email: 'om.desai@viit.edu.in', phoneNumber: '+91 9876543254', class: 'BE IT', division: 'A', batch: 'Batch 2', year: '2024-25', status: 'active', admissionDate: '2021-08-15', program: 'BTech Information Technology' },
    { id: '46', name: 'Shivansh Mehta', rollNo: '22310106', email: 'shivansh.mehta@viit.edu.in', phoneNumber: '+91 9876543255', class: 'BE IT', division: 'A', batch: 'Batch 2', year: '2024-25', status: 'active', admissionDate: '2021-08-15', program: 'BTech Information Technology' },
    { id: '47', name: 'Rudra Shah', rollNo: '22310107', email: 'rudra.shah@viit.edu.in', phoneNumber: '+91 9876543256', class: 'BE IT', division: 'A', batch: 'Batch 2', year: '2024-25', status: 'active', admissionDate: '2021-08-15', program: 'BTech Information Technology' },
    { id: '48', name: 'Arjun Nair', rollNo: '22310108', email: 'arjun.nair@viit.edu.in', phoneNumber: '+91 9876543257', class: 'BE IT', division: 'A', batch: 'Batch 2', year: '2024-25', status: 'active', admissionDate: '2021-08-15', program: 'BTech Information Technology' },
    { id: '49', name: 'Yash Soni', rollNo: '22310109', email: 'yash.soni@viit.edu.in', phoneNumber: '+91 9876543258', class: 'BE IT', division: 'A', batch: 'Batch 2', year: '2024-25', status: 'active', admissionDate: '2021-08-15', program: 'BTech Information Technology' },
    { id: '50', name: 'Dev Rao', rollNo: '22310110', email: 'dev.rao@viit.edu.in', phoneNumber: '+91 9876543259', class: 'BE IT', division: 'A', batch: 'Batch 2', year: '2024-25', status: 'active', admissionDate: '2021-08-15', program: 'BTech Information Technology' }
  ];

  const classes = ['TE IT', 'BE IT', 'SE IT', 'FE IT'];
  const divisions = ['A', 'B', 'C'];
  const batches = ['Batch 1', 'Batch 2', 'Batch 3', 'Batch 4'];
  const years = ['2024-25', '2023-24', '2022-23', '2021-22'];

  const filteredStudents = allStudents.filter(student => {
    const classMatch = selectedClass === 'all' || student.class === selectedClass;
    const divisionMatch = selectedDivision === 'all' || student.division === selectedDivision;
    const batchMatch = selectedBatch === 'all' || student.batch === selectedBatch;
    const yearMatch = selectedYear === 'all' || student.year === selectedYear;
    const searchMatch = !searchTerm || 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.rollNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase());

    return classMatch && divisionMatch && batchMatch && yearMatch && searchMatch;
  });

  // Calculate summary statistics
  const totalStudents = filteredStudents.length;
  const activeStudents = filteredStudents.filter(s => s.status === 'active').length;
  const inactiveStudents = totalStudents - activeStudents;
  const totalClasses = [...new Set(filteredStudents.map(s => s.class))].length;
  const totalDivisions = [...new Set(filteredStudents.map(s => `${s.class} ${s.division}`))].length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <Button variant="ghost" onClick={onBack} className="mb-2">
              <Eye className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl mb-2">Student Overview</h1>
            <p className="text-gray-600">Monitor and manage student information across classes and divisions</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
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
              <p className="text-sm text-gray-600">Enrolled students</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <UserCheck className="w-5 h-5 text-green-600" />
                Active Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{activeStudents}</div>
              <p className="text-sm text-gray-600">Currently active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <GraduationCap className="w-5 h-5 text-purple-600" />
                Classes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{totalClasses}</div>
              <p className="text-sm text-gray-600">Different classes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="w-5 h-5 text-orange-600" />
                Divisions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{totalDivisions}</div>
              <p className="text-sm text-gray-600">Class divisions</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filter Students
            </CardTitle>
            <CardDescription>
              Select filters to view students from specific classes, divisions, and batches
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
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

        {/* Students Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Students List
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {filteredStudents.length} students
              </Badge>
            </CardTitle>
            <CardDescription>
              Students matching your filter criteria
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
                      <TableHead>Academic Info</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Program</TableHead>
                      <TableHead>Admission Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => {
                      return (
                        <TableRow key={student.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-medium">
                                {student.name.charAt(0)}
                              </div>
                              <div>
                                <div className="font-medium">{student.name}</div>
                                <div className="text-sm text-gray-500">{student.rollNo}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{student.class} {student.division}</div>
                              <div className="text-sm text-gray-500">{student.batch} • {student.year}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="flex items-center gap-1 text-sm">
                                <Mail className="w-3 h-3" />
                                {student.email}
                              </div>
                              <div className="flex items-center gap-1 text-sm text-gray-500">
                                <Phone className="w-3 h-3" />
                                {student.phoneNumber}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {student.program}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="w-3 h-3" />
                              {new Date(student.admissionDate).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={student.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              {student.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                              <Button variant="outline" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                <FileText className="w-4 h-4 mr-1" />
                                Details
                              </Button>
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