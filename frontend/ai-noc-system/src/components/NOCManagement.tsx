import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Input } from './ui/input';
import {
  Users, Filter, Search, Eye, Award, CheckCircle, Clock, FileText,
  ThumbsUp, ThumbsDown, Loader2, AlertCircle, XCircle, Mail, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

// ===================================================================
// Type Definitions
// ===================================================================

type NocStatus = "Pending" | "Completed" | "Granted" | "Refused";
type NocType = 'Theory' | 'Lab' | 'Tutorial';

interface TeacherProfile {
  id: number;
  name: string;
  user: { id: number; email: string; role: 'teacher' };
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

interface NocDetailRow {
  status_record_id: number;
  student: StudentOut;
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

interface SubjectFilterData {
  id: number;
  name: string;
  year: string;
  has_cie: boolean;
  has_ha: boolean;
  has_lab: boolean;
  has_tw: boolean;
}

interface FilterOptions {
  subjects: SubjectFilterData[];
  divisions: { id: number; name: string }[];
}

interface NOCManagementProps {
  onBack: () => void;
  authToken: string;
  currentUser: TeacherProfile;
}

const API_BASE_URL = 'http://127.0.0.1:8000';

// ===================================================================
// Main Component
// ===================================================================

export function NOCManagement({ onBack, authToken, currentUser }: NOCManagementProps) {
  const [nocData, setNocData] = useState<NocDetailRow[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isTableLoading, setIsTableLoading] = useState<boolean>(false);
  const [tableError, setTableError] = useState<string | null>(null);

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedDivisionId, setSelectedDivisionId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedNocType, setSelectedNocType] = useState<string>('all');
  const [selectedNocStatus, setSelectedNocStatus] = useState<string>('all');

  const [showActionDialog, setShowActionDialog] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [selectedRecord, setSelectedRecord] = useState<NocDetailRow | null>(null);
  const [actionType, setActionType] = useState<'grant' | 'refuse' | null>(null);
  const [reason, setReason] = useState('');

  const [showMailDialog, setShowMailDialog] = useState(false);
  const [mailSubject, setMailSubject] = useState('');
  const [mailMessage, setMailMessage] = useState('');

  // --- Data Fetching ---
  const fetchNOCData = async () => {
    if (!selectedSubjectId || !selectedDivisionId) {
      setNocData([]);
      return;
    }
    setIsTableLoading(true);
    setTableError(null);
    try {
      const recalculateResponse = await fetch(`${API_BASE_URL}/noc/recalculate?subject_id=${selectedSubjectId}&division_id=${selectedDivisionId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      if (!recalculateResponse.ok){ 
        const errorData = await recalculateResponse.json();
        throw new Error(errorData.detail || 'An unknown server error occurred.');
      }

      const detailsResponse = await fetch(`${API_BASE_URL}/noc/details?subject_id=${selectedSubjectId}&division_id=${selectedDivisionId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      if (!detailsResponse.ok) {
        const errData = await detailsResponse.json();
        throw new Error(errData.detail || "Failed to fetch NOC data.");
      }
      
      const data: NocDetailRow[] = await detailsResponse.json();
      setNocData(data);
      console.log(data);
    } catch (err: any) {
      setTableError(err.message);
      
    } finally {
      setIsTableLoading(false);
    }
  };

  useEffect(() => {
    const fetchFilterOptions = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/noc/filter-options`, { headers: { 'Authorization': `Bearer ${authToken}` } });
        if (!response.ok) throw new Error("Failed to load filter options.");
        const data: FilterOptions = await response.json()
        setFilterOptions(data);
        console.log(data);
      } catch (err: any) {
        setTableError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    if (authToken) fetchFilterOptions();
  }, [authToken]);

  useEffect(() => {
    fetchNOCData();
  }, [selectedSubjectId, selectedDivisionId, authToken]);

  // --- Filtering and Data Calculation ---
  const selectedSubjectDetails = useMemo(() => {
    return filterOptions?.subjects.find(s => s.id.toString() === selectedSubjectId);
  }, [selectedSubjectId, filterOptions]);

  const filteredAndSearchedData = useMemo(() => {
    return nocData.filter(record => {
      const searchMatch = !searchTerm || record.student.name.toLowerCase().includes(searchTerm.toLowerCase()) || record.student.roll_number?.toLowerCase().includes(searchTerm.toLowerCase());
      const typeMatch = selectedNocType === 'all' || record.noc_type === selectedNocType;
      const statusMatch = selectedNocStatus === 'all' || record.noc_status === selectedNocStatus;
      return searchMatch && typeMatch && statusMatch;
    });
  }, [nocData, searchTerm, selectedNocType, selectedNocStatus]);

  const summaryStats = useMemo(() => {
    const studentStatuses = new Map<number, { isGranted: boolean; isRefused: boolean }>();
    nocData.forEach(rec => {
      if (!studentStatuses.has(rec.student.id)) {
        studentStatuses.set(rec.student.id, { isGranted: true, isRefused: false });
      }
      const status = studentStatuses.get(rec.student.id)!;
      if (rec.noc_status !== 'Granted') status.isGranted = false;
      if (rec.noc_status === 'Refused') status.isRefused = true;
    });
    let granted = 0, refused = 0;
    studentStatuses.forEach(s => {
      if (s.isRefused) refused++;
      else if (s.isGranted) granted++;
    });
    return {
      totalStudents: studentStatuses.size,
      grantedNOCs: granted,
      refusedNOCs: refused,
      pendingNOCs: studentStatuses.size - granted - refused,
    };
  }, [nocData]);

  // --- Event Handlers ---
  const handleRefresh = () => fetchNOCData();

  const openActionDialog = (record: NocDetailRow, type: 'grant' | 'refuse') => {
    setSelectedRecord(record);
    setActionType(type);
    setReason('');
    setShowActionDialog(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedRecord || !actionType) return;
    setIsUpdating(true);
    try {
      const response = await fetch(`${API_BASE_URL}/noc/status/${selectedRecord.status_record_id}?noc_type=${selectedRecord.noc_type}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify({
          noc_status: actionType === 'grant' ? 'Granted' : 'Refused',
          
          reason: reason
        }),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Failed to update NOC status.");
      }
      setShowActionDialog(false);
      toast.success(`NOC status updated for ${selectedRecord.student.name}`);
      setNocData(prev => prev.map(rec =>
        rec.status_record_id === selectedRecord.status_record_id && rec.noc_type === selectedRecord.noc_type
          ? { ...rec, noc_status: actionType === 'grant' ? 'Granted' : 'Refused' }
          : rec
      ));
    } catch (err: any) {
      toast.error(`Update failed: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSendMail = () => {
    const studentIds = [...new Set(filteredAndSearchedData.map(r => r.student.id))];
    toast.success(`Mail prepared for ${studentIds.length} students.`);
    setShowMailDialog(false);
  };

  // --- UI Helper Functions ---
  const getStatusCell = (component: NocComponentStatus) => {
    if (!component.is_applicable) return <span className="text-gray-400">N/A</span>;
    if (component.status === 'Completed') return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
    if (component.status.includes('%')) {
      const percent = parseInt(component.status);
      return <Badge className={percent >= 70 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>{component.status}</Badge>;
    }
    if (component.status === 'N/A') return <span className="text-gray-400">N/A</span>;
    return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
  };

  const getNocStatusBadge = (status: NocStatus) => {
    if (status === 'Completed') return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
    if (status === 'Granted') return <Badge className="bg-blue-100 text-blue-800">Granted</Badge>;
    if (status === 'Refused') return <Badge className="bg-red-100 text-red-800">Refused</Badge>;
    return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
  };

  // --- Render Logic ---
  if (isLoading) { return <div className="flex items-center justify-center h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>; }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4">
        <Button variant="ghost" onClick={onBack} className="mb-2  shadow-sm bg-blue-500 text-white"><Eye className="w-4 h-4 mr-2 " />Back</Button>
        <h1 className="text-2xl font-bold">NOC Management Dashboard</h1>
      </div>
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader><CardTitle>Filters</CardTitle><CardDescription>Select a subject and division to view records.</CardDescription></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
              <SelectTrigger><SelectValue placeholder="Select a subject..." /></SelectTrigger>
              <SelectContent>{filterOptions?.subjects.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name} ({s.year})</SelectItem>)}</SelectContent>
            </Select>
            <Select value={selectedDivisionId} onValueChange={setSelectedDivisionId}>
              <SelectTrigger><SelectValue placeholder="Select a division..." /></SelectTrigger>
              <SelectContent>{filterOptions?.divisions.map(d => <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>)}</SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedSubjectId && selectedDivisionId && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card><CardHeader className="pb-3"><CardTitle>Total Students</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{summaryStats.totalStudents}</div></CardContent></Card>
              <Card><CardHeader className="pb-3"><CardTitle>Granted NOCs</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{summaryStats.grantedNOCs}</div></CardContent></Card>
              <Card><CardHeader className="pb-3"><CardTitle>Pending NOCs</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-yellow-600">{summaryStats.pendingNOCs}</div></CardContent></Card>
              <Card><CardHeader className="pb-3"><CardTitle>Refused NOCs</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">{summaryStats.refusedNOCs}</div></CardContent></Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Student NOC Records</span>
                  <div className="flex items-center gap-2">
                    <Select value={selectedNocType} onValueChange={setSelectedNocType}><SelectTrigger className="w-[140px]"><SelectValue placeholder="NOC Type" /></SelectTrigger><SelectContent><SelectItem value="all">All Types</SelectItem><SelectItem value="Theory">Theory</SelectItem><SelectItem value="Lab">Lab</SelectItem><SelectItem value="Tutorial">Tutorial</SelectItem></SelectContent></Select>
                    <Select value={selectedNocStatus} onValueChange={setSelectedNocStatus}><SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">All Statuses</SelectItem><SelectItem value="Pending">Pending</SelectItem><SelectItem value="Completed">Completed</SelectItem><SelectItem value="Granted">Granted</SelectItem><SelectItem value="Refused">Refused</SelectItem></SelectContent></Select>
                    <Button size="icon" variant="outline" onClick={() => setShowMailDialog(true)}><Mail className="w-4 h-4" /></Button>
                    <Button size="sm" variant="outline" onClick={handleRefresh} disabled={isTableLoading}><RefreshCw className={`w-4 h-4 mr-2 ${isTableLoading ? 'animate-spin' : ''}`} />Refresh</Button>
                    <div className="relative w-56"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><Input placeholder="Search students..." className="pl-9" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative h-[600px] overflow-y-auto border rounded-md">
                  <Table>
                    <TableHeader className='sticky top-0 z-10 bg-white shadow-sm'>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead className="text-center">NOC Type</TableHead>
                        <TableHead className="text-center">Attendance</TableHead>
                        {selectedSubjectDetails.has_cie && <TableHead className="text-center">CIE</TableHead>}
                        {selectedSubjectDetails.has_ha && <TableHead className="text-center">HA</TableHead>}
                        <TableHead className="text-center">Assignments</TableHead>
                        <TableHead className="text-center">Defaulter</TableHead>
                        <TableHead className="text-center">SCE</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody >
                      {isTableLoading ? (
                        <TableRow><TableCell colSpan={10} className="text-center h-24"><Loader2 className="w-8 h-8 mx-auto animate-spin" /></TableCell></TableRow>
                      ) : tableError ? (
                        <TableRow><TableCell colSpan={10} className="text-center h-24 text-red-600"><AlertCircle className="mx-auto mb-2 w-8 h-8" /><p>{tableError}</p></TableCell></TableRow>
                      ) : filteredAndSearchedData.length > 0 ? filteredAndSearchedData.map((record) => (
                        <TableRow key={`${record.status_record_id}-${record.noc_type}`}>
                          <TableCell><div className="font-medium">{record.student.name}</div><div className="text-sm text-gray-500">{record.student.roll_number}</div></TableCell>
                          <TableCell className="text-center"><Badge variant={record.noc_type === 'Theory' ? 'default' : 'secondary'}>{record.noc_type}</Badge></TableCell>
                          <TableCell className="text-center">{getStatusCell(record.attendance)}</TableCell>
                          {selectedSubjectDetails?.has_cie && <TableCell className="text-center">{getStatusCell(record.cie)}</TableCell>}
                          {selectedSubjectDetails?.has_ha && <TableCell className="text-center">{getStatusCell(record.home_assignment)}</TableCell>}
                          <TableCell className="text-center">{getStatusCell(record.assignments)}</TableCell>
                          <TableCell className="text-center">{getStatusCell(record.defaulter_assignment)}</TableCell>
                          <TableCell className="text-center">{getStatusCell(record.sce_status)}</TableCell>
                          <TableCell className="text-center">{getNocStatusBadge(record.noc_status)}</TableCell>
                          <TableCell className="text-center">
                            {record.is_updatable && (
                              <div className="flex gap-2 justify-center">
                                <Button size="icon" className="bg-green-500 hover:bg-green-600" onClick={() => openActionDialog(record, 'grant')} disabled={record.noc_status !== 'Completed'}><ThumbsUp className="w-4 h-4" /></Button>
                                <Button size="icon" variant="destructive" className="bg-red-500 hover:bg-red-600" onClick={() => openActionDialog(record, 'refuse')} disabled={record.noc_status === 'Refused'}><ThumbsDown className="w-4 h-4" /></Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      )) : (
                        <TableRow><TableCell colSpan={10} className="text-center h-24">No student records found.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="capitalize">{actionType} NOC</DialogTitle>
            <DialogDescription>For {selectedRecord?.student.name}'s {selectedRecord?.noc_type} component.</DialogDescription>
          </DialogHeader>
          {actionType === 'refuse' && (
            <div className="py-4"><Label htmlFor="reason">Reason for Refusal</Label><Textarea id="reason" value={reason} onChange={e => setReason(e.target.value)} className="mt-2" /></div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowActionDialog(false)}>Cancel</Button>
            <Button onClick={handleConfirmAction} disabled={isUpdating} className={actionType === 'grant' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}>
              {isUpdating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirm {actionType && (actionType.charAt(0).toUpperCase() + actionType.slice(1))}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={showMailDialog} onOpenChange={setShowMailDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Send Mail</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Subject</Label><Input value={mailSubject} onChange={e => setMailSubject(e.target.value)} /></div>
            <div><Label>Message</Label><Textarea rows={5} value={mailMessage} onChange={e => setMailMessage(e.target.value)} /></div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowMailDialog(false)}>Cancel</Button>
            <Button onClick={handleSendMail}>Send Mail</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}