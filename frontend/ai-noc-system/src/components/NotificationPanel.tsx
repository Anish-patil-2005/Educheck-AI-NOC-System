import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { AlertCircle, Clock, CheckCircle, ChevronRight } from 'lucide-react';

const notifications = [
  {
    id: 1,
    type: 'warning',
    title: 'Assignment 2 flagged for potential plagiarism',
    time: '2 hours ago',
    icon: AlertCircle,
    color: 'text-red-600'
  },
  {
    id: 2,
    type: 'reminder',
    title: 'Reminder: Project Report due of May 15, 2024',
    time: '1 day ago',
    icon: Clock,
    color: 'text-orange-600'
  },
  {
    id: 3,
    type: 'success',
    title: 'Assignment 1 submitted successfully',
    time: '9 days ago',
    icon: CheckCircle,
    color: 'text-green-600'
  }
];

export function NotificationPanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Notifications
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {notifications.map((notification) => {
          const Icon = notification.icon;
          return (
            <div key={notification.id} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
              <Icon className={`w-5 h-5 mt-0.5 ${notification.color}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 mb-1">
                  {notification.title}
                </p>
                <p className="text-xs text-gray-500">{notification.time}</p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}