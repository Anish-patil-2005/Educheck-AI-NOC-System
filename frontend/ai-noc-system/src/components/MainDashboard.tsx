import { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { AssignmentManagement } from './AssignmentManagement';
import { StudentAssignmentView } from './StudentAssignmentView';
import { SCEManagement } from './SCEManagement';
import { NOCManagement } from './NOCManagement';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { NotificationHandler } from './NotificationHandler';
import { StudentNOCView } from './NOCStudentDashboard';
import { UnderConstructionPage } from './UnderConstructionPage';
import { NotFoundPage } from './NotFoundPage';
import {
  BookOpen, User, UserCheck, FileText, Award, Bell, LogOut, Users
} from 'lucide-react';
import { Button } from './ui/button';
import { Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

// ===================================================================
// Type Definitions
// ===================================================================

type UserRole = 'student' | 'admin' | 'teacher';
type ModuleKey = 'assignments' | 'sce' | 'notifications' | 'overview' | 'attendance' | 'noc';

interface StudentProfile {
  id: number;
  name: string;
  roll_number?: string;
  user: { id: number; email: string; role: 'student' };
}

interface TeacherProfile {
  id: number;
  name: string;
  user: { id: number; email: string; role: 'teacher' };
}

interface MainDashboardProps {
  userRole: UserRole;
  onLogout: () => void;
  authToken: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ===================================================================
// Main Component
// ===================================================================

export function MainDashboard({ userRole, onLogout, authToken }: MainDashboardProps) {
  const [currentUser, setCurrentUser] = useState<StudentProfile | TeacherProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // --- Data Fetching ---
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!authToken) {
        setIsLoading(false);
        setError("Authentication token is missing.");
        return;
      }
      try {
        const response = await fetch(`${API_BASE_URL}/me`, {
          headers: { 'Authorization': `Bearer ${authToken}` },
        });
        if (!response.ok) {
          if (response.status === 401 || response.status === 404) onLogout();
          const errData = await response.json();
          throw new Error(errData.detail || "Failed to fetch user profile.");
        }
        const data: StudentProfile | TeacherProfile = await response.json();
        setCurrentUser(data);
      } catch (err: any) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserProfile();
  }, [authToken, onLogout]);

  // --- Event Handlers ---
  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  // --- Module Definitions ---
  const studentModules = [
    { key: 'assignments', title: 'Assignments', icon: FileText },
    { key: 'attendance', title: 'Attendance', icon: UserCheck },
    { key: 'noc', title: 'NOC Status', icon: Award },
    { key: 'notifications', title: 'Notifications', icon: Bell },
  ];

  const teacherModules = [
    { key: 'assignments', title: 'Assignment Management', icon: FileText },
    { key: 'sce', title: 'SCE Management', icon: BookOpen },
    { key: 'noc', title: 'NOC Management', icon: Award },
    
  ];

  const modules = userRole === 'student' ? studentModules : teacherModules;

  // --- Render Logic ---
  if (isLoading || !currentUser) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
        <p className="ml-4 text-lg text-gray-700">Loading Your Dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-red-600 bg-red-50">
        <AlertCircle className="w-12 h-12 mb-4" />
        <h2 className="text-xl font-semibold mb-2">An Error Occurred</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {userRole === 'student' && currentUser && (
        <NotificationHandler userId={currentUser.id} authToken={authToken} />
      )}

      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-md flex items-center justify-center">
            <span className="text-white font-bold">AI</span>
          </div>
          <h1 className="text-lg font-semibold text-gray-900">AI-NOC System</h1>
        </div>
        <div className="flex items-center space-x-4">
          <Bell className="w-5 h-5 text-gray-500 hover:text-blue-600 cursor-pointer" />
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
            {currentUser.name.charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      <div className="bg-white border-b px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-gray-600" />
          </div>
          <div>
            <span className="font-medium text-gray-900 uppercase">{currentUser.name}</span>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-500">Online</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-8">
          {userRole === 'student' && 'roll_number' in currentUser && (
            <div className="text-center">
              <span className="text-sm text-gray-500">Roll Number</span>
              <div className="font-medium">{currentUser.roll_number}</div>
            </div>
          )}
          <div className="text-center">
            <span className="text-sm text-gray-500">Role</span>
            <div className="font-medium capitalize">{userRole}</div>
          </div>
          <Button variant="ghost" size="sm" onClick={onLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      <main className="p-6">
        <Routes>
          <Route
            index
            element={
              <div className="max-w-7xl mx-auto py-5">
                
                <div className={`grid gap-6 ${userRole === 'student' ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-3'}`}>
                  {modules.map((module) => (
                    <Link to={module.key} key={module.key}>
                      <Card className="relative overflow-hidden cursor-pointer transform transition-all hover:scale-105 hover:shadow-lg border-0 group">
                        <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-600 p-6 h-32 relative">
                          <div className="absolute inset-0 bg-gradient-radial from-white/10 via-transparent to-transparent opacity-50"></div>
                          <div className="relative flex flex-col items-center justify-center h-full text-center z-10">
                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-3 group-hover:bg-white/30 transition-colors backdrop-blur-sm">
                              <module.icon className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-white font-medium text-sm leading-tight">{module.title}</span>
                          </div>
                          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-white/10 to-transparent rounded-bl-full"></div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            }
          />

          {userRole === 'student' && (
            <>
              <Route
                path="assignments"
                element={<StudentAssignmentView onBack={handleBackToDashboard} authToken={authToken} currentStudent={currentUser as StudentProfile} />}
              />
              <Route
                path="noc"
                // CORRECTED: Pass the currentUser prop
                element={<StudentNOCView onBack={handleBackToDashboard} authToken={authToken} currentUser={currentUser as StudentProfile} />}
              />
              <Route
                path="notifications"
                // CORRECTED: Pass the currentUser prop
                element={<UnderConstructionPage onBack={handleBackToDashboard}  />}
              />
              <Route
                path="attendance"
                // CORRECTED: Pass the currentUser prop
                element={<UnderConstructionPage onBack={handleBackToDashboard}  />}
              />
            </>
            
          )}
          {userRole === 'teacher' && (
            <>
              <Route
                path="assignments"
                element={<AssignmentManagement onBack={handleBackToDashboard} authToken={authToken} />}
              />
              <Route
                path="sce"
                element={<SCEManagement onBack={handleBackToDashboard} authToken={authToken}  />}
              />
              <Route
                path="noc"
                // CORRECTED: Pass the currentUser prop
                element={<NOCManagement onBack={handleBackToDashboard} authToken={authToken} currentUser={currentUser as TeacherProfile} />}
              />
            </>
          )}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  );
}