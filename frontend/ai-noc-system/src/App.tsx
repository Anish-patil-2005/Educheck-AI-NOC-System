// AI-based NOC Attendance Compliance & Assignment Verification System
// Version 38 - Corrected auth token handling and added session persistence
import { useState, useEffect } from 'react';
import { LoginPage } from './components/LoginPage';
import { MainDashboard } from './components/MainDashboard';
import { AssignmentProvider } from './components/AssignmentContext';
import { Toaster } from 'react-hot-toast';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
// Define the roles for type safety
type UserRole = 'student' | 'admin' | 'teacher';

export default function App() {
  // --- State Initialization ---
  // Initialize state from localStorage to allow session persistence across reloads.
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(!!localStorage.getItem('accessToken'));
  const [userRole, setUserRole] = useState<UserRole>(() => (localStorage.getItem('userRole') as UserRole) || 'student');
  const [authToken, setAuthToken] = useState<string | null>(localStorage.getItem('accessToken'));
  const navigate = useNavigate(); 
  // --- Event Handlers ---

  /**
   * Handles successful login by storing the user's role and token,
   * then updating the application state to render the dashboard.
   * This function now expects both the role and the token from LoginPage.
   */
  const handleLoginSuccess = (role: UserRole, token: string) => {
    localStorage.setItem('accessToken', token);
    localStorage.setItem('userRole', role);
    setAuthToken(token);
    setUserRole(role);
    setIsLoggedIn(true);
    navigate('/dashboard'); // <-- 3. Navigate to dashboard on login
  };

  /**
   * Handles user logout by clearing session data from both
   * localStorage and the component's state.
   */
  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userRole');
    setIsLoggedIn(false);
    setUserRole('student');
    setAuthToken(null);
    navigate('/login'); // <-- 4. Navigate to login on logout
  };

  // --- Effects ---

  /**
   * This effect listens for changes in localStorage. If the token is
   * removed in another browser tab, it logs the user out of this tab
   * to keep the session state synchronized.
   */
  useEffect(() => {
    const syncLogout = (event: StorageEvent) => {
      if (event.key === 'accessToken' && !event.newValue) {
        handleLogout();
      }
    };

    window.addEventListener('storage', syncLogout);

    return () => {
      window.removeEventListener('storage', syncLogout);
    };
  }, []);

 
  // --- Render Logic ---

  return (<>
    <Routes>
      {/* 5. Define the routes */}
      <Route
        path="/login"
        element={<LoginPage onLoginSuccess={handleLoginSuccess} />}
      />
      <Route
        path="/dashboard/*" // The '*' allows for nested routes inside the dashboard
        element={
          isLoggedIn && authToken ? (
            <MainDashboard
              userRole={userRole}
              onLogout={handleLogout}
              authToken={authToken}
            />
          ) : (
            <Navigate to="/login" replace /> // If not logged in, redirect to login
          )
        }
      />
      {/* Redirect root path to dashboard if logged in, otherwise to login */}
      <Route
        path="/"
        element={<Navigate to={isLoggedIn ? "/dashboard" : "/login"} replace />}
      />
    </Routes>
    <Toaster position="top-center" />
  </>
   
    
  );
}
