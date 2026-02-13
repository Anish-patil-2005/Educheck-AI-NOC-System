import React, { useState, useEffect } from 'react';

// A utility function to join class names conditionally.
const cn = (...classNames: (string | null | undefined | false)[]) => {
  return classNames.filter(Boolean).join(' ');
};

// --- Props Interfaces for Simulated UI Components ---
interface CardProps {
  children: React.ReactNode;
  className?: string;
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

interface CardDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

interface TabsProps {
  defaultValue: string;
  children: React.ReactNode;
  className?: string; // Added className prop to TabsProps
}

interface TabsListProps {
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  children: React.ReactNode;
  className?: string;
}

interface TabsTriggerProps {
  value: string;
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  children: React.ReactNode;
}

interface TabsContentProps {
  value: string;
  activeTab: string;
  children: React.ReactNode;
}

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'destructive' | 'secondary';
}

interface ButtonProps extends React.ComponentPropsWithoutRef<'button'> {
  children: React.ReactNode;
  className?: string;
  variant?: 'outline' | 'default';
}

interface ProgressProps {
  value: number;
  className?: string;
}

interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

// Simulated UI Components (to make the file self-contained)
const Card = ({ children, className }: CardProps) => <div className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)}>{children}</div>;
const CardHeader = ({ children, className }: CardHeaderProps) => <div className={cn("flex flex-col space-y-1.5 p-6", className)}>{children}</div>;
const CardTitle = ({ children, className }: CardTitleProps) => <h3 className={cn("text-2xl font-semibold leading-none tracking-tight", className)}>{children}</h3>;
const CardDescription = ({ children, className }: CardDescriptionProps) => <p className={cn("text-sm text-muted-foreground", className)}>{children}</p>;
const CardContent = ({ children, className }: CardContentProps) => <div className={cn("p-6 pt-0", className)}>{children}</div>;

const TabsList = ({ activeTab, setActiveTab, children, className }: TabsListProps) => (
  <div className={cn("inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground", className)}>
    {React.Children.map(children, child =>
      React.isValidElement(child) ? React.cloneElement(child as React.ReactElement<TabsTriggerProps>, { activeTab, setActiveTab }) : child
    )}
  </div>
);
const TabsTrigger = ({ value, activeTab, setActiveTab, children }: TabsTriggerProps) => (
  <button
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      activeTab === value ? "bg-background text-foreground shadow-sm" : ""
    )}
    onClick={() => setActiveTab(value)}
  >
    {children}
  </button>
);
const TabsContent = ({ value, activeTab, children }: TabsContentProps) => activeTab === value ? <div>{children}</div> : null;
const Badge = ({ children, className, variant }: BadgeProps) => {
  let baseClass = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";
  if (variant === "destructive") {
    baseClass = cn(baseClass, "border-transparent bg-destructive text-destructive-foreground shadow");
  } else if (variant === "secondary") {
    baseClass = cn(baseClass, "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80");
  }
  return <div className={cn(baseClass, className)}>{children}</div>;
};
const Button = ({ children, className, variant, ...props }: ButtonProps) => {
  let baseClass = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2";
  if (variant === "outline") {
    baseClass = cn(baseClass, "border border-input bg-background hover:bg-accent hover:text-accent-foreground");
  } else if (variant === "default") {
    baseClass = cn(baseClass, "bg-primary text-primary-foreground hover:bg-primary/90");
  }
  return <button className={cn(baseClass, className)} {...props}>{children}</button>;
};
const Progress = ({ value, className }: ProgressProps) => (
  <div className={cn("relative h-2 w-full overflow-hidden rounded-full bg-primary/20", className)}>
    <div
      className="h-full w-full flex-1 bg-primary transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </div>
);
const AlertTriangle = (props: IconProps) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
);
const CheckCircle = (props: IconProps) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-8.66" /><path d="M3.5 11l6 6.5" /><path d="M10.13 10.13 17 3" /></svg>
);
const Upload = (props: IconProps) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
);
const FileText = (props: IconProps) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="16" x2="8" y1="13" y2="13" /><line x1="16" x2="8" y1="17" y2="17" /><line x1="10" x2="8" y1="9" y2="9" /></svg>
);
const Calendar = (props: IconProps) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
);
const User = (props: IconProps) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
);

// --- Corrected Components with Proper Types ---

interface CircularProgressProps {
  value: number;
  size: number;
  strokeWidth: number;
  color?: string;
  trackColor?: string;
}

// CircularProgress component with corrected props and styling
const CircularProgress = ({ value, size, strokeWidth, color, trackColor = "#e5e7eb" }: CircularProgressProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
      <circle
        className="text-gray-200"
        stroke={trackColor}
        fill="transparent"
        strokeWidth={strokeWidth}
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />
      <circle
        className="transition-all duration-300 ease-in-out"
        stroke={color}
        fill="transparent"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        r={radius}
        cx={size / 2}
        cy={size / 2}
        style={{
          strokeDasharray: circumference,
          strokeDashoffset: offset,
        }}
      />
    </svg>
  );
};

interface AttendanceChartProps {
  data: { subject: string; attended: number; total: number; }[];
}

// AttendanceChart component with corrected props and logic
const AttendanceChart = ({ data }: AttendanceChartProps) => {
  const subjects = data.map(d => d.subject);
  const percentages = data.map(d => (d.attended / d.total) * 100);

  return (
    <div className="w-full h-64 flex items-end gap-2 border-l border-b border-gray-300 p-2">
      {percentages.map((percentage, index) => (
        <div key={subjects[index]} className="flex flex-col items-center flex-grow">
          <div
            className="w-8 rounded-t-sm transition-all duration-500 ease-in-out"
            style={{
              height: `${percentage * 0.8}%`, // Scale to fit
              backgroundColor: percentage >= 75 ? '#22c55e' : '#ef4444',
            }}
          />
          <span className="text-xs text-center mt-1">{subjects[index]}</span>
        </div>
      ))}
    </div>
  );
};

const AssignmentsTable = () => (
  <Card>
    <CardHeader>
      <CardTitle>Assignments</CardTitle>
      <CardDescription>
        List of all submitted and pending assignments.
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 rounded-lg border">
          <div className="flex items-center gap-4">
            <FileText className="h-6 w-6 text-gray-500" />
            <div>
              <p className="font-medium">Maths Homework 1</p>
              <p className="text-sm text-gray-500">Due: 25th Oct 2024</p>
            </div>
          </div>
          <Badge className="bg-green-100 text-green-800">Submitted</Badge>
        </div>
        <div className="flex items-center justify-between p-4 rounded-lg border">
          <div className="flex items-center gap-4">
            <FileText className="h-6 w-6 text-gray-500" />
            <div>
              <p className="font-medium">Physics Lab Report</p>
              <p className="text-sm text-gray-500">Due: 3rd Nov 2024</p>
            </div>
          </div>
          <Badge variant="destructive">Pending</Badge>
        </div>
      </div>
    </CardContent>
  </Card>
);

const NotificationPanel = () => (
  <Card>
    <CardHeader>
      <CardTitle>Notifications</CardTitle>
      <CardDescription>
        Important alerts and updates.
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <div className="flex items-start gap-4 p-4 rounded-lg bg-yellow-50 border border-yellow-200">
          <AlertTriangle className="h-5 w-5 mt-1 text-yellow-600" />
          <div>
            <p className="font-medium text-yellow-800">Attendance Warning</p>
            <p className="text-sm text-yellow-700">Your attendance in Computer Science is at 64%. Please submit your pending assignments to improve your standing.</p>
          </div>
        </div>
        <div className="flex items-start gap-4 p-4 rounded-lg bg-green-50 border border-green-200">
          <CheckCircle className="h-5 w-5 mt-1 text-green-600" />
          <div>
            <p className="font-medium text-green-800">Assignment Graded</p>
            <p className="text-sm text-green-700">Your English Essay has been graded. Check the assignments tab for details.</p>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

interface DashboardProps {
  onLogout: () => void;
}

export function Dashboard({ onLogout }: DashboardProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState("attendance");

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const attendanceData = [
    { subject: 'Mathematics', attended: 18, total: 25 },
    { subject: 'Physics', attended: 22, total: 25 },
    { subject: 'Computer Science', attended: 16, total: 25 },
    { subject: 'English', attended: 24, total: 25 },
  ];

  const overallAttendance = attendanceData.reduce((acc, subject) => {
    return acc + (subject.attended / subject.total);
  }, 0) / attendanceData.length * 100;

  const isEligible = overallAttendance >= 75;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <div className="container mx-auto p-6">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Student Dashboard</h1>
            <p className="text-gray-600">Track your attendance and assignment submissions</p>
          </div>
          <Button onClick={onLogout} variant="outline">Logout</Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Overall Status */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                NOC Eligibility Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-2xl font-bold mb-1">
                    {overallAttendance.toFixed(1)}%
                  </div>
                  <p className="text-gray-600">Overall Attendance</p>
                </div>
                <div className="flex items-center gap-2">
                  {isEligible ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Eligible
                      </Badge>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      <Badge variant="destructive">Not Eligible</Badge>
                    </>
                  )}
                </div>
              </div>
              <Progress value={overallAttendance} className="mb-4" />
              {!isEligible && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="font-medium text-red-800">Action Required</span>
                  </div>
                  <p className="text-red-700 text-sm">
                    Your attendance is below 75%. You need to submit assignments and improve attendance to be eligible for NOC clearance.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                View Timetable
              </Button>
              <Button className="w-full" variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Assignment History
              </Button>
              <div className="pt-4 border-t">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Button className="w-full" variant="default">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Assignment
                  </Button>
                </label>
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  accept=".pdf,.doc,.docx,.txt"
                />
                {selectedFile && (
                  <p className="text-sm text-gray-600 mt-2">
                    Selected: {selectedFile.name}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <TabsList activeTab={activeTab} setActiveTab={setActiveTab} className="grid w-full grid-cols-4">
            <TabsTrigger value="attendance" activeTab={activeTab} setActiveTab={setActiveTab}>Attendance</TabsTrigger>
            <TabsTrigger value="assignments" activeTab={activeTab} setActiveTab={setActiveTab}>Assignments</TabsTrigger>
            <TabsTrigger value="notifications" activeTab={activeTab} setActiveTab={setActiveTab}>Notifications</TabsTrigger>
            <TabsTrigger value="progress" activeTab={activeTab} setActiveTab={setActiveTab}>Progress</TabsTrigger>
          </TabsList>

          <TabsContent value="attendance" activeTab={activeTab}>
            <Card>
              <CardHeader>
                <CardTitle>Attendance Details</CardTitle>
                <CardDescription>
                  Track your attendance across all subjects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <AttendanceChart data={attendanceData} />
                  <div className="space-y-4">
                    {attendanceData.map((subject) => {
                      const percentage = (subject.attended / subject.total) * 100;
                      return (
                        <div key={subject.subject} className="border rounded-lg p-4">
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="font-medium">{subject.subject}</h3>
                            <Badge
                              variant={percentage >= 75 ? "secondary" : "destructive"}
                              className={percentage >= 75 ? "bg-green-100 text-green-800" : ""}
                            >
                              {percentage.toFixed(1)}%
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {subject.attended} / {subject.total} classes
                          </p>
                          <Progress value={percentage} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assignments" activeTab={activeTab}>
            <AssignmentsTable />
          </TabsContent>

          <TabsContent value="notifications" activeTab={activeTab}>
            <NotificationPanel />
          </TabsContent>

          <TabsContent value="progress" activeTab={activeTab}>
            <Card>
              <CardHeader>
                <CardTitle>Academic Progress</CardTitle>
                <CardDescription>
                  Overall progress towards NOC clearance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <CircularProgress value={overallAttendance} size={120} strokeWidth={8} color="#2563eb" />
                    <h3 className="mt-4 font-medium">Attendance</h3>
                    <p className="text-gray-600">{overallAttendance.toFixed(1)}%</p>
                  </div>
                  <div className="text-center">
                    <CircularProgress value={85} size={120} strokeWidth={8} color="#2563eb" />
                    <h3 className="mt-4 font-medium">Assignments</h3>
                    <p className="text-gray-600">85% Completed</p>
                  </div>
                  <div className="text-center">
                    <CircularProgress
                      value={isEligible ? 100 : 0}
                      size={120}
                      strokeWidth={8}
                      color={isEligible ? "#10b981" : "#ef4444"}
                    />
                    <h3 className="mt-4 font-medium">NOC Status</h3>
                    <p className="text-gray-600">{isEligible ? 'Eligible' : 'Not Eligible'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </div>
    </div>
  );
}

// The main App component to render the Dashboard
export default function App() {
  const handleLogout = () => {
    // This is where your logout logic would go.
    alert("Logged out!");
  };

  return <Dashboard onLogout={handleLogout} />;
}
