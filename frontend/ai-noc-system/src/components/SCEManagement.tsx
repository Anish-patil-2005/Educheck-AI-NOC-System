import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import {
  Users, Filter, Search, Eye, Presentation, Briefcase,
  CheckCircle, AlertCircle, Edit, XCircle, Save, Loader2, X,
  RefreshCw
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import toast from 'react-hot-toast';

// ===================================================================
// Type Definitions to match Backend Schemas
// ===================================================================

type SCEStatus = 'completed' | 'pending' | 'late';
type SCEComponentType = 'pbl_status' | 'presentation_status' | 'certification_status';

interface StudentDetail {
  id: number;
  name: string;
  roll_number?: string;
}

interface SCERecord {
  id: number;
  student: StudentDetail;
  subject: { id: number; name: string; year: string };
  pbl_status: SCEStatus;
  pbl_score?: number;
  pbl_title?: string;
  presentation_status: SCEStatus;
  presentation_score?: number;
  presentation_topic?: string;
  certification_status: SCEStatus;
  certification_name?: string;
  certification_provider?: string;
  last_updated: string;
}
interface authorities {
  subject_id: number,
  division_id: number
  authority_type: string
}
interface FilterOptions {
  subjects: { id: number; name: string; year: string }[];
  divisions: { id: number; name: string }[];
  years: string[];
  authorities: [authorities];
}

interface SCEManagementProps {
  onBack: () => void;
  authToken: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const PIE_COLORS = { 'completed': '#10B981', 'late': '#F59E0B', 'pending': '#EF4444' };

// ===================================================================
// Main Component
// ===================================================================

export function SCEManagement({ onBack, authToken }: SCEManagementProps) {
  // --- State for Data, Loading, and Errors ---
  const [sceData, setSceData] = useState<{ can_update: SCERecord[], can_view_only: SCERecord[] } | null>(null);
  // ... other state ...
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isTableLoading, setIsTableLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [tableError, setTableError] = useState<string | null>(null);
  // --- State for Filters and Search ---
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedDivisionId, setSelectedDivisionId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [chartFilter, setChartFilter] = useState<{ type: SCEComponentType; status: SCEStatus } | null>(null);

  // --- State for UI interactions ---
  const [editingRowId, setEditingRowId] = useState<number | null>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [editedStatuses, setEditedStatuses] = useState<{ pbl_status?: SCEStatus, presentation_status?: SCEStatus, certification_status?: SCEStatus }>({});



  // In SCEManagement.tsx, after your state declarations

  const canUpdate = useMemo(() => {
    // Return false if data isn't loaded or filters aren't selected
    if (!filterOptions || !selectedSubjectId || !selectedDivisionId) {
      return false;
    }

    // Check if there is at least one authority entry that grants update permission
    // for the currently selected subject and division.
    return filterOptions.authorities.some(auth =>
      auth.subject_id === Number(selectedSubjectId) &&
      auth.division_id === Number(selectedDivisionId) &&
      (auth.authority_type === 'Lab' || auth.authority_type === 'Tutorial')
    );
  }, [filterOptions, selectedSubjectId, selectedDivisionId]);




  // --- Data Fetching ---
  useEffect(() => {
    const fetchFilterOptions = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/teacher/filter-options`, {
          headers: { 'Authorization': `Bearer ${authToken}` },
        });
        if (!response.ok) throw new Error("Failed to load filter options.");
        const data: FilterOptions = await response.json();
        setFilterOptions(data);
        console.log(data)
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    if (authToken) fetchFilterOptions();
  }, [authToken]);

  
    const fetchSCEData = async () => {
      if (!selectedSubjectId || !selectedDivisionId) {
        // CORRECTED: Set state to null to clear it, matching its type
        setSceData(null);
        setChartFilter(null);
        return;
      }
      setIsTableLoading(true);
      setError(null);
      setTableError(null)
      try {
        const response = await fetch(`${API_BASE_URL}/sce-details?subject_id=${selectedSubjectId}&division_id=${selectedDivisionId}`, {
          headers: { 'Authorization': `Bearer ${authToken}` },
        });
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.detail || "Failed to fetch SCE data.");
        }
        // CORRECTED: The data type now matches the new API response object
        const data: { can_update: SCERecord[], can_view_only: SCERecord[] } = await response.json();
        setSceData(data);
        console.log(data)
      } catch (err: any) {
        setError(err.message);
        setTableError(err.message)
      } finally {
        setIsTableLoading(false);
      }
    };
    

  useEffect(() => {
    fetchSCEData();
  }, [selectedSubjectId, selectedDivisionId, authToken]);

  // --- Filtering and Data Calculation ---

  const allRecords = useMemo(() => {
    if (!sceData) return [];
    return [...sceData.can_update, ...sceData.can_view_only];
  }, [sceData]);


  const updatableStudentIds = useMemo(() => {
    if (!sceData) return new Set();
    return new Set(sceData.can_update.map(rec => rec.student.id));
  }, [sceData]);


  const finalDisplayedRecords = useMemo(() => {
    // 1. Start with the combined list of all records for the selected group.
    let records = allRecords;

    // 2. First, apply the filter from the pie chart click, if it exists.
    if (chartFilter) {
      records = records.filter(rec => rec[chartFilter.type] === chartFilter.status);
    }

    // 3. Then, apply the search term filter on the *result* of the first filter.
    if (searchTerm) {
      records = records.filter(rec =>
        rec.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.student.roll_number?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return records;
  }, [allRecords, searchTerm, chartFilter]); // The dependencies are now correct

  const getSceStatusData = (components: SCERecord[], sceType: SCEComponentType) => {
    const statusCounts: Record<SCEStatus, number> = { completed: 0, late: 0, pending: 0 };
    components.forEach(comp => statusCounts[comp[sceType]]++);
    return Object.entries(statusCounts).map(([name, value]) => ({ name: name as SCEStatus, value, color: PIE_COLORS[name as SCEStatus] }));
  };

  // CORRECTED: Calculate chart and summary data from the main `SceData` list.
  const pblData = getSceStatusData(allRecords, 'pbl_status');
  const presentationData = getSceStatusData(allRecords, 'presentation_status');
  const certificationData = getSceStatusData(allRecords, 'certification_status');
  const totalCompletedSCE = allRecords.filter(s => s.pbl_status === 'completed' && s.presentation_status === 'completed' && s.certification_status === 'completed').length;
  const totalIncompleteSCE = allRecords.length - totalCompletedSCE;

  // --- Event Handlers ---
  const handleRefresh = () => {
    fetchSCEData()
  }

  const handlePieClick = (data: any, type: SCEComponentType) => {
    if (chartFilter?.type === type && chartFilter?.status === data.name) {
      setChartFilter(null);
    } else {
      setChartFilter({ type, status: data.name });
    }
  };

  const handleEditClick = (component: SCERecord) => {
    setEditingRowId(component.id);
    setEditedStatuses({
      pbl_status: component.pbl_status,
      presentation_status: component.presentation_status,
      certification_status: component.certification_status,
    });
  };

  const handleCancelEdit = () => {
    setEditingRowId(null);
    setEditedStatuses({});
  };

  const handleStatusChange = (field: keyof typeof editedStatuses, value: SCEStatus) => {
    setEditedStatuses(prev => ({ ...prev, [field]: value }));
  };

  const handleConfirmUpdate = async (component: SCERecord) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`${API_BASE_URL}/sce-details`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify({
          student_id: component.student.id,
          subject_id: component.subject.id,
          ...editedStatuses,
        }),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Failed to update status.");
      }
      setEditingRowId(null);
      setEditedStatuses({});
      toast.success("Status updated successfully!");

      // --- CORRECTED STATE UPDATE LOGIC ---
      setSceData(prevState => {
        // If there's no previous state, do nothing.
        if (!prevState) return null;

        // Create new, updated lists by mapping over the old ones.
        const newCanUpdateList = prevState.can_update.map(rec =>
          rec.id === component.id ? { ...rec, ...editedStatuses } : rec
        );
        const newCanViewOnlyList = prevState.can_view_only.map(rec =>
          rec.id === component.id ? { ...rec, ...editedStatuses } : rec
        );

        // Return the new state object with the updated lists.
        return {
          can_update: newCanUpdateList,
          can_view_only: newCanViewOnlyList,
        };
      });

    } catch (err: any) {
      toast.error(`Update failed: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  // --- UI Helper Functions ---
  const getStatusBadge = (status: SCEStatus) => {
    switch (status) {
      case 'completed': return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'late': return <Badge className="bg-orange-100 text-orange-800">Late</Badge>;
      case 'pending': return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      default: return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  // --- Render Logic ---
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
        <p className="ml-4 text-lg text-gray-700">Loading Options...</p>
      </div>
    );
  }

  if (error) {
    return (
      <>
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <Button variant="ghost" onClick={onBack} className="mb-2  shadow-sm bg-blue-500 text-white"><Eye className="w-4 h-4 mr-2 " />Back</Button>
          <h1 className="text-2xl font-bold mb-2">SCE Components Management</h1>
          <p className="text-gray-600">Monitor Project-Based Learning, Presentations, and Certifications.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Select a subject and division to view student records.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Subject</Label>
              <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                <SelectTrigger><SelectValue placeholder="Select a subject..." /></SelectTrigger>
                <SelectContent>
                  {filterOptions?.subjects.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name} ({s.year})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Division</Label>
              <Select value={selectedDivisionId} onValueChange={setSelectedDivisionId}>
                <SelectTrigger><SelectValue placeholder="Select a division..." /></SelectTrigger>
                <SelectContent>
                  {filterOptions?.divisions.map(d => <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        <div className="flex flex-col items-center justify-center min-h-[600px] text-red-600">
          <AlertCircle className="w-12 h-12 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error Loading Data</h2>
          <p>{error}</p>
        </div>
      </>
     
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
       <Button variant="ghost" onClick={onBack} className="mb-2  shadow-sm bg-blue-500 text-white"><Eye className="w-4 h-4 mr-2 " />Back</Button>
        <h1 className="text-2xl font-bold mb-2">SCE Components Management</h1>
        <p className="text-gray-600">Monitor Project-Based Learning, Presentations, and Certifications.</p>
      </div>

      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Select a subject and division to view student records.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Subject</Label>
              <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                <SelectTrigger><SelectValue placeholder="Select a subject..." /></SelectTrigger>
                <SelectContent>
                  {filterOptions?.subjects.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name} ({s.year})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Division</Label>
              <Select value={selectedDivisionId} onValueChange={setSelectedDivisionId}>
                <SelectTrigger><SelectValue placeholder="Select a division..." /></SelectTrigger>
                <SelectContent>
                  {filterOptions?.divisions.map(d => <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {selectedSubjectId && selectedDivisionId && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    SCE Completed
                  </CardTitle>
                  <CardDescription>Students who have completed all SCE components.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{totalCompletedSCE}</div>
                  <p className="text-sm text-gray-600">Students</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    SCE Remaining
                  </CardTitle>
                  <CardDescription>Students with one or more pending components.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-yellow-600">{totalIncompleteSCE}</div>
                  <p className="text-sm text-gray-600">Students</p>
                </CardContent>
              </Card>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader><CardTitle className="text-base">PBL Status</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={100}>
                    <PieChart>
                      <Pie data={pblData} dataKey="value" nameKey="name" innerRadius={25} outerRadius={40} onClick={(data) => handlePieClick(data, 'pbl_status')}>
                        {pblData.map((e) => <Cell key={e.name} fill={e.color} className="cursor-pointer" />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">Presentation Status</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={100}>
                    <PieChart>
                      <Pie data={presentationData} dataKey="value" nameKey="name" innerRadius={25} outerRadius={40} onClick={(data) => handlePieClick(data, 'presentation_status')}>
                        {presentationData.map((e) => <Cell key={e.name} fill={e.color} className="cursor-pointer" />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">Certification Status</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={100}>
                    <PieChart>
                      <Pie data={certificationData} dataKey="value" nameKey="name" innerRadius={25} outerRadius={40} onClick={(data) => handlePieClick(data, 'certification_status')}>
                        {certificationData.map((e) => <Cell key={e.name} fill={e.color} className="cursor-pointer" />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Student Records</span>
                  <div className='flex gap-4 items-center'>
                    <Button size="sm" variant="outline" onClick={handleRefresh} disabled={isTableLoading}><RefreshCw className={`w-4 h-4 mr-2 ${isTableLoading ? 'animate-spin' : ''}`} />Refresh</Button>
                    <div className="relative w-64"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><Input placeholder="Search by name or roll no..." className="pl-9" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
                  </div>
                  
                </CardTitle>
                <CardDescription>
                  {chartFilter ? (
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="capitalize">
                        Filtering for {chartFilter.type.split('_')[0]} with status: {chartFilter.status}
                      </Badge>
                      <Button variant="ghost" size="sm" onClick={() => setChartFilter(null)} className="h-auto p-1 text-red-500 hover:bg-red-100">
                        <X className="w-4 h-4 mr-1" />Clear
                      </Button>
                    </div>
                  ) : `Showing all ${allRecords.length} records for the selected division.`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative h-[500px] overflow-y-auto border rounded-md">
                  <Table>
                    <TableHeader className="sticky top-0 bg-white z-10 shadow-sm">
                      <TableRow>
                        <TableHead className="w-[250px]">Student</TableHead>
                        <TableHead className="text-center">PBL</TableHead>
                        <TableHead className="text-center">Presentation</TableHead>
                        <TableHead className="text-center">Certification</TableHead>
                        {canUpdate && <TableHead className="text-center w-[180px]">Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isTableLoading ? (
                        <TableRow>
                          <TableCell colSpan={canUpdate ? 5 : 4} className="text-center h-[400px]">
                            <Loader2 className="w-8 h-8 mx-auto animate-spin text-blue-500" />
                          </TableCell>
                        </TableRow>
                      ) : finalDisplayedRecords.length > 0 ? (
                        finalDisplayedRecords.map((component) => (
                          <TableRow key={component.id} className="hover:bg-gray-50">
                            <TableCell>
                              <div className="font-medium">{component.student.name}</div>
                              <div className="text-sm text-gray-500">{component.student.roll_number}</div>
                            </TableCell>
                            <TableCell className="text-center">
                              {editingRowId === component.id ? (
                                <Select value={editedStatuses.pbl_status} onValueChange={(v: SCEStatus) => handleStatusChange('pbl_status', v)}>
                                  <SelectTrigger className="w-32 mx-auto"><SelectValue /></SelectTrigger>
                                  <SelectContent>{['completed', 'late', 'pending'].map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                                </Select>
                              ) : getStatusBadge(component.pbl_status)}
                            </TableCell>
                            <TableCell className="text-center">
                              {editingRowId === component.id ? (
                                <Select value={editedStatuses.presentation_status} onValueChange={(v: SCEStatus) => handleStatusChange('presentation_status', v)}>
                                  <SelectTrigger className="w-32 mx-auto"><SelectValue /></SelectTrigger>
                                  <SelectContent>{['completed', 'late', 'pending'].map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                                </Select>
                              ) : getStatusBadge(component.presentation_status)}
                            </TableCell>
                            <TableCell className="text-center">
                              {editingRowId === component.id ? (
                                <Select value={editedStatuses.certification_status} onValueChange={(v: SCEStatus) => handleStatusChange('certification_status', v)}>
                                  <SelectTrigger className="w-32 mx-auto"><SelectValue /></SelectTrigger>
                                  <SelectContent>{['completed', 'late', 'pending'].map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                                </Select>
                              ) : getStatusBadge(component.certification_status)}
                            </TableCell>

                            {/* --- CORRECTED ACTIONS CELL LOGIC --- */}
                            {canUpdate && (
                              <TableCell className="text-center">
                                {/* This new check looks up the specific student's ID */}
                                {updatableStudentIds.has(component.student.id) ? (
                                  editingRowId === component.id ? (
                                    <div className="flex gap-2 justify-center">
                                      <Button size="icon" variant="outline" onClick={() => handleConfirmUpdate(component)} disabled={isUpdating}>
                                        {isUpdating ? <Loader2 className="animate-spin" /> : <Save />}
                                      </Button>
                                      <Button size="icon" variant="ghost" onClick={handleCancelEdit}><XCircle /></Button>
                                    </div>
                                  ) : (
                                    <Button size="sm" variant="outline" onClick={() => handleEditClick(component)}>
                                      <Edit className="w-4 h-4 mr-2" />Edit Status
                                    </Button>
                                  )
                                ) : (
                                  // If the student is not in an updatable batch, show "View Only"
                                  <Badge variant="outline">View Only</Badge>
                                )}
                              </TableCell>
                            )}
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={canUpdate ? 5 : 4} className="text-center h-24 text-gray-500">
                            No records found for the current search or filter.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
