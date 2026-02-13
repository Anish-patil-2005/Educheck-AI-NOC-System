import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  Bell, 
  Eye,
  CheckCircle,
  AlertCircle,
  Info,
  Calendar,
  FileText,
  Users,
  Award,
  Clock,
  Trash2,
  Mail
} from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'assignment' | 'attendance' | 'noc' | 'sce' | 'general';
  isRead: boolean;
  timestamp: string;
  actionRequired?: boolean;
  relatedLink?: string;
}

interface NotificationCenterProps {
  onBack: () => void;
}

export function NotificationCenter({ onBack }: NotificationCenterProps) {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Mock notifications data
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'New Assignment Posted',
      message: 'Prof. Teacher has posted a new Data Structures assignment. Due date: November 30, 2024.',
      type: 'info',
      category: 'assignment',
      isRead: false,
      timestamp: '2024-11-22T10:30:00Z',
      actionRequired: true,
      relatedLink: '/assignments'
    },
    {
      id: '2',
      title: 'Assignment Submission Reminder',
      message: 'Reminder: Database Management assignment is due tomorrow. Please submit before the deadline.',
      type: 'warning',
      category: 'assignment',
      isRead: false,
      timestamp: '2024-11-22T09:15:00Z',
      actionRequired: true,
      relatedLink: '/assignments'
    },
    {
      id: '3',
      title: 'Attendance Updated',
      message: 'Your attendance for Computer Networks (Theory) has been updated. Current attendance: 87%.',
      type: 'success',
      category: 'attendance',
      isRead: true,
      timestamp: '2024-11-21T16:45:00Z',
      actionRequired: false,
      relatedLink: '/attendance'
    },
    {
      id: '4',
      title: 'NOC Status Update',
      message: 'Your NOC application is being reviewed. Current status: Under Review.',
      type: 'info',
      category: 'noc',
      isRead: false,
      timestamp: '2024-11-21T14:20:00Z',
      actionRequired: false,
      relatedLink: '/noc'
    },
    {
      id: '5',
      title: 'Low Attendance Alert',
      message: 'Your attendance in Web Technologies is below 75%. Current: 72%. Please improve to avoid NOC issues.',
      type: 'error',
      category: 'attendance',
      isRead: true,
      timestamp: '2024-11-20T11:30:00Z',
      actionRequired: true,
      relatedLink: '/attendance'
    },
    {
      id: '6',
      title: 'SCE Component Submission',
      message: 'PBL submission for Machine Learning has been received and is under evaluation.',
      type: 'success',
      category: 'sce',
      isRead: true,
      timestamp: '2024-11-20T09:00:00Z',
      actionRequired: false,
      relatedLink: '/sce'
    },
    {
      id: '7',
      title: 'System Maintenance Notice',
      message: 'The portal will be under maintenance on November 25, 2024, from 2:00 AM to 4:00 AM.',
      type: 'warning',
      category: 'general',
      isRead: false,
      timestamp: '2024-11-19T17:00:00Z',
      actionRequired: false
    },
    {
      id: '8',
      title: 'Assignment Graded',
      message: 'Your Computer Networks assignment has been graded. Score: 85/100. Check feedback for details.',
      type: 'success',
      category: 'assignment',
      isRead: true,
      timestamp: '2024-11-19T13:45:00Z',
      actionRequired: false,
      relatedLink: '/assignments'
    },
    {
      id: '9',
      title: 'Profile Update Required',
      message: 'Please update your contact information in your profile to ensure you receive important notifications.',
      type: 'info',
      category: 'general',
      isRead: false,
      timestamp: '2024-11-18T10:15:00Z',
      actionRequired: true,
      relatedLink: '/profile'
    },
    {
      id: '10',
      title: 'Holiday Notice',
      message: 'The college will remain closed on November 26, 2024, for Constitution Day. Classes will resume on November 27.',
      type: 'info',
      category: 'general',
      isRead: true,
      timestamp: '2024-11-17T15:30:00Z',
      actionRequired: false
    }
  ]);

  const filters = ['all', 'unread', 'read', 'action-required'];
  const categories = ['all', 'assignment', 'attendance', 'noc', 'sce', 'general'];

  const filteredNotifications = notifications.filter(notification => {
    const filterMatch = selectedFilter === 'all' || 
      (selectedFilter === 'unread' && !notification.isRead) ||
      (selectedFilter === 'read' && notification.isRead) ||
      (selectedFilter === 'action-required' && notification.actionRequired);
    
    const categoryMatch = selectedCategory === 'all' || notification.category === selectedCategory;
    
    return filterMatch && categoryMatch;
  });

  const getNotificationIcon = (type: string, category: string) => {
    if (category === 'assignment') return <FileText className="w-4 h-4" />;
    if (category === 'attendance') return <Users className="w-4 h-4" />;
    if (category === 'noc') return <Award className="w-4 h-4" />;
    if (category === 'sce') return <CheckCircle className="w-4 h-4" />;
    
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4" />;
      case 'error':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getCategoryBadge = (category: string) => {
    const colors = {
      'assignment': 'bg-blue-100 text-blue-800',
      'attendance': 'bg-purple-100 text-purple-800',
      'noc': 'bg-green-100 text-green-800',
      'sce': 'bg-orange-100 text-orange-800',
      'general': 'bg-gray-100 text-gray-800'
    };
    return <Badge className={colors[category as keyof typeof colors]}>{category.toUpperCase()}</Badge>;
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, isRead: true } : notification
      )
    );
  };

  const markAsUnread = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, isRead: false } : notification
      )
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  // Calculate summary statistics
  const totalNotifications = notifications.length;
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const actionRequiredCount = notifications.filter(n => n.actionRequired && !n.isRead).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <Button variant="ghost" onClick={onBack} className="mb-2">
              <Eye className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl mb-2">Notification Center</h1>
            <p className="text-gray-600">Stay updated with all your academic notifications</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={markAllAsRead}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark All Read
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Bell className="w-5 h-5 text-blue-600" />
                Total Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{totalNotifications}</div>
              <p className="text-sm text-gray-600">All notifications</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                Unread
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{unreadCount}</div>
              <p className="text-sm text-gray-600">Need attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="w-5 h-5 text-red-600" />
                Action Required
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{actionRequiredCount}</div>
              <p className="text-sm text-gray-600">Requires action</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Filter and manage your notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-sm font-medium">Filter by Status</label>
                <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Notifications</SelectItem>
                    <SelectItem value="unread">Unread Only</SelectItem>
                    <SelectItem value="read">Read Only</SelectItem>
                    <SelectItem value="action-required">Action Required</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Filter by Category</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="assignment">Assignments</SelectItem>
                    <SelectItem value="attendance">Attendance</SelectItem>
                    <SelectItem value="noc">NOC</SelectItem>
                    <SelectItem value="sce">SCE Components</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {filteredNotifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="mb-2">No notifications found</h3>
                <p className="text-gray-600">Try adjusting your filters to see more notifications</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`border rounded-lg p-4 transition-all hover:shadow-md ${
                      notification.isRead ? 'bg-white' : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-full ${getNotificationColor(notification.type)}`}>
                        {getNotificationIcon(notification.type, notification.category)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className={`font-medium ${!notification.isRead ? 'font-semibold' : ''}`}>
                                {notification.title}
                              </h3>
                              {getCategoryBadge(notification.category)}
                              {notification.actionRequired && (
                                <Badge className="bg-red-100 text-red-800">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Action Required
                                </Badge>
                              )}
                            </div>
                            <p className="text-gray-600 text-sm mb-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Calendar className="w-3 h-3" />
                              {formatTimestamp(notification.timestamp)}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {!notification.isRead ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => markAsRead(notification.id)}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Mark Read
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => markAsUnread(notification.id)}
                                className="text-gray-600 hover:text-gray-700"
                              >
                                <Mail className="w-3 h-3 mr-1" />
                                Mark Unread
                              </Button>
                            )}
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteNotification(notification.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        
                        {notification.relatedLink && (
                          <div className="mt-2">
                            <Button variant="link" className="p-0 h-auto text-blue-600 text-sm">
                              View Details →
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}