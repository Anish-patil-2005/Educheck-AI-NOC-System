import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Input } from './ui/input';
import { 
  Home, 
  Users, 
  FileText, 
  BarChart3, 
  BookOpen, 
  GraduationCap, 
  Bell, 
  Settings,
  LogOut,
  Search,
  AlertTriangle,
  XCircle,
  Upload
} from 'lucide-react';
import { StudentsTable } from './StudentsTable';
import { NOCManagement } from './NOCManagement';
import { AttendanceInput } from './AttendanceInput';

/* ================================
   Types
================================ */

interface TeacherProfile {
  id: number;
  name: string;
  user: {
    id: number;
    email: string;
    role: 'teacher';
  };
}

interface TeacherDashboardProps {
  onLogout: () => void;
  authToken: string;
  currentUser: TeacherProfile;
}

/* ================================
   Component
================================ */

export function TeacherDashboard({ onLogout, authToken, currentUser }: TeacherDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'attendance', label: 'Attendance', icon: Users },
    { id: 'noc-management', label: 'NOC Management', icon: FileText },
    { id: 'assignments', label: 'Assignments', icon: BookOpen },
    { id: 'plagiarism', label: 'Plagiarism Check', icon: AlertTriangle },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  const stats = {
    totalStudents: 45,
    lowAttendance: 8,
    nocRequired: 6,
    assignmentsPending: 12,
    plagiarismFlagged: 3
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'attendance':
        return <AttendanceInput />;

      case 'noc-management':
        return (
          <NOCManagement
            onBack={() => setActiveTab('overview')}
            authToken={authToken}
            currentUser={currentUser}
          />
        );

      default:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Students</p>
                      <p className="text-2xl">{stats.totalStudents}</p>
                    </div>
                    <Users className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Low Attendance</p>
                      <p className="text-2xl text-red-600">{stats.lowAttendance}</p>
                    </div>
                    <XCircle className="w-8 h-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">NOC Required</p>
                      <p className="text-2xl text-orange-600">{stats.nocRequired}</p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Assignments Pending</p>
                      <p className="text-2xl text-blue-600">{stats.assignmentsPending}</p>
                    </div>
                    <Upload className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Plagiarism Flagged</p>
                      <p className="text-2xl text-red-600">{stats.plagiarismFlagged}</p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>

            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Student Attendance & NOC Status</span>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input placeholder="Search students..." className="pl-10 w-64" />
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <StudentsTable />
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      
      <div className="w-64 bg-gray-900 text-white p-4">
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-6">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="text-lg">Teacher Portal</span>
          </div>
        </div>

        <nav className="space-y-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeTab === item.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
                {item.id === 'notifications' && (
                  <Badge variant="destructive" className="ml-auto">5</Badge>
                )}
                {item.id === 'noc-management' && (
                  <Badge variant="secondary" className="ml-auto bg-orange-100 text-orange-800">
                    {stats.nocRequired}
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-4 left-4 right-4 space-y-2">
          <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </button>
          <button 
            onClick={onLogout}
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-red-600 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl text-gray-900">Teacher Dashboard</h1>
              <p className="text-gray-600">Monitor attendance, NOC clearance, and assignment compliance</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Active Session
              </Badge>
              <Button variant="ghost" size="sm">
                <Bell className="w-4 h-4" />
              </Button>
              <Avatar>
                <AvatarImage src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face" />
                <AvatarFallback>
                  {currentUser?.name?.slice(0,2).toUpperCase() || "TR"}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>

        <div className="p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
