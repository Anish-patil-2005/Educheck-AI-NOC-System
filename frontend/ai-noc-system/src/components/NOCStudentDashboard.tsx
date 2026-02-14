import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import {
  Users, Eye, Award, CheckCircle, Clock, FileText,
  Loader2, AlertCircle, BookOpen
} from 'lucide-react';
import toast from 'react-hot-toast';

// ===================================================================
// Type Definitions
// ===================================================================

type NocStatus = "Pending" | "Completed" | "Granted" | "Refused" | "Pending Verification";
type NocType = 'Theory' | 'Lab' | 'Tutorial';

interface StudentProfile {
  id: number;
  name: string;
  roll_number?: string;
  user: { id: number; email: string; role: 'student' };
}

interface StudentOut {
  id: number;
  name: string;
  roll_number?: string;
}

interface NocComponentStatus {
  status: string;
  is_applicable: boolean;
}

// Updated to include the nested subject object
interface NocDetailRow {
  status_record_id: number;
  student: StudentOut;
  subject:   string; // Needed for the first column
  noc_type: NocType;
  attendance: NocComponentStatus;
  cie: NocComponentStatus;
  home_assignment: NocComponentStatus;
  assignments: NocComponentStatus;
  defaulter_assignment: NocComponentStatus;
  sce_status: NocComponentStatus;
  noc_status: NocStatus;
  is_updatable: boolean;
}

interface StudentNOCViewProps {
  onBack: () => void;
  authToken: string;
  currentUser: StudentProfile;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ===================================================================
// Main Component
// ===================================================================

export function StudentNOCView({ onBack, authToken, currentUser }: StudentNOCViewProps) {
  const [nocData, setNocData] = useState<NocDetailRow[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // --- Data Fetching ---
  useEffect(() => {
    const fetchStudentNOCData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/noc/student/me`, {
          headers: { 'Authorization': `Bearer ${authToken}` },
        });
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.detail || "Failed to fetch your NOC data.");
        }
        const data: NocDetailRow[] = await response.json();
        setNocData(data);
        console.log(data)
      } catch (err: any) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    if (authToken) fetchStudentNOCData();
  }, [authToken]);

  // --- Data Calculation & Grouping ---
  const summaryStats = useMemo(() => {
    const subjectIds = new Set(nocData.map(d => d.status_record_id));
    let grantedCount = 0, refusedCount = 0;
    subjectIds.forEach(id => {
      const subjectRecords = nocData.filter(rec => rec.status_record_id === id);
      const isGranted = subjectRecords.every(rec => rec.noc_status === 'Granted');
      const isRefused = subjectRecords.some(rec => rec.noc_status === 'Refused');
      if (isRefused) refusedCount++;
      else if (isGranted) grantedCount++;
    });
    return {
      totalSubjects: subjectIds.size,
      grantedNOCs: grantedCount,
      refusedNOCs: refusedCount,
      pendingNOCs: subjectIds.size - grantedCount - refusedCount,
    };
  }, [nocData]);

  // Determine which optional columns to show based on the fetched data
  const columnsToShow = useMemo(() => {
    return {
      cie: nocData.some(row => row.cie.is_applicable),
      ha: nocData.some(row => row.home_assignment.is_applicable),
      defaulter: nocData.some(row => row.defaulter_assignment.is_applicable),
    }
  }, [nocData]);

  // --- UI Helper Functions ---
  const getStatusCell = (component: NocComponentStatus) => {
    if (!component.is_applicable) return <span className="text-gray-400">N/A</span>;
    if (component.status === 'Completed') return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
    if (component.status.includes('%')) {
      const percent = parseInt(component.status);
      return <Badge className={percent >= 70 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>{component.status}</Badge>;
    }
    return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
  };

  const getNocStatusBadge = (status: NocStatus) => {
    if (status === 'Completed') return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
    if (status === 'Granted') return <Badge className="bg-blue-100 text-blue-800">Granted</Badge>;
    if (status === 'Refused') return <Badge variant="destructive">Refused</Badge>;
    return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
  };

  // --- Render Logic ---
  if (isLoading) { return <div className="flex items-center justify-center h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>; }
  if (error) { return <div className="p-6 text-center text-red-600"><AlertCircle className="mx-auto w-12 h-12" /><h2 className="mt-4 text-xl font-semibold">Could not load NOC data</h2><p>{error}</p></div>; }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4">
         <Button variant="ghost" onClick={onBack} className="mb-2  shadow-sm bg-blue-500 text-white"><Eye className="w-4 h-4 mr-2 " />Back</Button>
        <h1 className="text-2xl font-bold">My NOC Status</h1>
        <p className="text-gray-600">Your NOC compliance status across all enrolled subjects.</p>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card><CardHeader className="pb-3"><CardTitle>Total Subjects</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{summaryStats.totalSubjects}</div></CardContent></Card>
          <Card><CardHeader className="pb-3"><CardTitle>Granted NOCs</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{summaryStats.grantedNOCs}</div></CardContent></Card>
          <Card><CardHeader className="pb-3"><CardTitle>Pending NOCs</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-yellow-600">{summaryStats.pendingNOCs}</div></CardContent></Card>
          <Card><CardHeader className="pb-3"><CardTitle>Refused NOCs</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">{summaryStats.refusedNOCs}</div></CardContent></Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Subject-wise NOC Status</CardTitle>
            <CardDescription>Your detailed NOC status for each subject.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative h-[600px] overflow-y-auto border rounded-md">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-white shadow-sm">
                  <TableRow>
                    <TableHead className="w-[250px]">Subject</TableHead>
                    <TableHead className="text-center">NOC Type</TableHead>
                    <TableHead className="text-center">Attendance</TableHead>
                    {columnsToShow.cie && <TableHead className="text-center">CIE</TableHead>}
                    {columnsToShow.ha && <TableHead className="text-center">HA</TableHead>}
                    <TableHead className="text-center">Assignments</TableHead>
                    {columnsToShow.defaulter && <TableHead className="text-center">Defaulter</TableHead>}
                    <TableHead className="text-center">SCE</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {nocData.length > 0 ? (
                    nocData.map((record) => (
                      <TableRow key={`${record.status_record_id}-${record.noc_type}`}>
                        <TableCell className="font-medium">{record.subject}</TableCell>
                        <TableCell className="text-center"><Badge variant={record.noc_type === 'Theory' ? 'default' : 'secondary'}>{record.noc_type}</Badge></TableCell>
                        <TableCell className="text-center">{getStatusCell(record.attendance)}</TableCell>
                        {columnsToShow.cie && <TableCell className="text-center">{getStatusCell(record.cie)}</TableCell>}
                        {columnsToShow.ha && <TableCell className="text-center">{getStatusCell(record.home_assignment)}</TableCell>}
                        <TableCell className="text-center">{getStatusCell(record.assignments)}</TableCell>
                        {columnsToShow.defaulter && <TableCell className="text-center">{getStatusCell(record.defaulter_assignment)}</TableCell>}
                        <TableCell className="text-center">{getStatusCell(record.sce_status)}</TableCell>
                        <TableCell className="text-center">{getNocStatusBadge(record.noc_status)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center h-24">No NOC data found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}