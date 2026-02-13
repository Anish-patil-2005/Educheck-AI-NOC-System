import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  MessageSquare, 
  Send, 
  Eye,
  Star,
  CheckCircle,
  Clock,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Bug,
  Lightbulb,
  Settings,
  Calendar
} from 'lucide-react';

interface Feedback {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: 'pending' | 'in-review' | 'resolved' | 'rejected';
  submittedBy: string;
  submittedDate: string;
  response?: string;
  respondedBy?: string;
  respondedDate?: string;
}

interface FeedbackSystemProps {
  onBack: () => void;
}

export function FeedbackSystem({ onBack }: FeedbackSystemProps) {
  const [showSubmitForm, setShowSubmitForm] = useState<boolean>(false);
  const [newFeedback, setNewFeedback] = useState({
    title: '',
    description: '',
    category: '',
    priority: ''
  });

  // Mock feedback data
  const allFeedback: Feedback[] = [
    {
      id: '1',
      title: 'Improve Assignment Upload Interface',
      description: 'The assignment upload interface could be more user-friendly. Sometimes it\'s not clear if the file has been uploaded successfully.',
      category: 'UI/UX Improvement',
      priority: 'Medium',
      status: 'in-review',
      submittedBy: 'Aarav Sharma (21310101)',
      submittedDate: '2024-11-20',
      response: 'Thank you for the feedback. We are working on improving the upload interface with better visual indicators.',
      respondedBy: 'Technical Team',
      respondedDate: '2024-11-21'
    },
    {
      id: '2',
      title: 'Add Dark Mode Support',
      description: 'It would be great to have a dark mode option for better viewing experience during night hours.',
      category: 'Feature Request',
      priority: 'Low',
      status: 'pending',
      submittedBy: 'Priya Sharma (21310201)',
      submittedDate: '2024-11-19'
    },
    {
      id: '3',
      title: 'NOC Status Not Updating',
      description: 'My NOC status is showing as pending even though I have completed all requirements. Please check.',
      category: 'Bug Report',
      priority: 'High',
      status: 'resolved',
      submittedBy: 'Vivaan Patel (21310102)',
      submittedDate: '2024-11-18',
      response: 'Issue has been resolved. The NOC status calculation has been fixed and your status is now updated.',
      respondedBy: 'Technical Team',
      respondedDate: '2024-11-19'
    },
    {
      id: '4',
      title: 'Mobile Responsiveness Issues',
      description: 'Some pages are not properly optimized for mobile devices. The attendance page is particularly problematic on smaller screens.',
      category: 'Bug Report',
      priority: 'Medium',
      status: 'in-review',
      submittedBy: 'Aryan Verma (22310101)',
      submittedDate: '2024-11-17'
    }
  ];

  const categories = ['Bug Report', 'Feature Request', 'UI/UX Improvement', 'Performance Issue', 'Other'];
  const priorities = ['Low', 'Medium', 'High', 'Critical'];

  const handleSubmitFeedback = () => {
    if (newFeedback.title && newFeedback.description && newFeedback.category && newFeedback.priority) {
      // In a real app, this would submit to a backend
      console.log('Submitting feedback:', newFeedback);
      
      // Reset form
      setNewFeedback({
        title: '',
        description: '',
        category: '',
        priority: ''
      });
      setShowSubmitForm(false);
      
      // Show success message (in real app, use a toast notification)
      alert('Feedback submitted successfully! We will review it and get back to you.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'in-review':
        return <Badge className="bg-blue-100 text-blue-800"><Eye className="w-3 h-3 mr-1" />In Review</Badge>;
      case 'resolved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Resolved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      'Low': 'bg-gray-100 text-gray-800',
      'Medium': 'bg-blue-100 text-blue-800',
      'High': 'bg-orange-100 text-orange-800',
      'Critical': 'bg-red-100 text-red-800'
    };
    return <Badge className={colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>{priority}</Badge>;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Bug Report':
        return <Bug className="w-4 h-4" />;
      case 'Feature Request':
        return <Lightbulb className="w-4 h-4" />;
      case 'UI/UX Improvement':
        return <Settings className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  // Calculate summary statistics
  const totalFeedback = allFeedback.length;
  const pendingFeedback = allFeedback.filter(f => f.status === 'pending').length;
  const resolvedFeedback = allFeedback.filter(f => f.status === 'resolved').length;
  const inReviewFeedback = allFeedback.filter(f => f.status === 'in-review').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <Button variant="ghost" onClick={onBack} className="mb-2">
              <Eye className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl mb-2">Feedback System</h1>
            <p className="text-gray-600">Submit feedback and suggestions for website improvements</p>
          </div>
          <Button 
            onClick={() => setShowSubmitForm(true)} 
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
          >
            <Send className="w-4 h-4 mr-2" />
            Submit Feedback
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                Total Feedback
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{totalFeedback}</div>
              <p className="text-sm text-gray-600">All submissions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="w-5 h-5 text-yellow-600" />
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendingFeedback}</div>
              <p className="text-sm text-gray-600">Awaiting review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Eye className="w-5 h-5 text-blue-600" />
                In Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{inReviewFeedback}</div>
              <p className="text-sm text-gray-600">Being processed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Resolved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{resolvedFeedback}</div>
              <p className="text-sm text-gray-600">Completed</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="my-feedback" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="my-feedback">My Feedback</TabsTrigger>
            <TabsTrigger value="submit-new">Submit New Feedback</TabsTrigger>
          </TabsList>

          <TabsContent value="my-feedback">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Submitted Feedback
                </CardTitle>
                <CardDescription>
                  View all your submitted feedback and their current status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {allFeedback.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="mb-2">No feedback submitted yet</h3>
                    <p className="text-gray-600 mb-4">Share your thoughts and help us improve the system</p>
                    <Button onClick={() => setShowSubmitForm(true)} className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
                      <Send className="w-4 h-4 mr-2" />
                      Submit Feedback
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Feedback</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Submitted</TableHead>
                          <TableHead>Response</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allFeedback.map((feedback) => (
                          <TableRow key={feedback.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{feedback.title}</div>
                                <div className="text-sm text-gray-500 max-w-xs truncate">
                                  {feedback.description}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getCategoryIcon(feedback.category)}
                                <span className="text-sm">{feedback.category}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {getPriorityBadge(feedback.priority)}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(feedback.status)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm">
                                <Calendar className="w-3 h-3" />
                                {new Date(feedback.submittedDate).toLocaleDateString()}
                              </div>
                            </TableCell>
                            <TableCell>
                              {feedback.response ? (
                                <div className="max-w-xs">
                                  <div className="text-sm text-gray-600 truncate" title={feedback.response}>
                                    {feedback.response}
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    by {feedback.respondedBy} on {feedback.respondedDate && new Date(feedback.respondedDate).toLocaleDateString()}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-gray-400 text-sm">No response yet</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button variant="outline" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="submit-new">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="w-5 h-5" />
                  Submit New Feedback
                </CardTitle>
                <CardDescription>
                  Help us improve by sharing your feedback, suggestions, or reporting issues
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-w-2xl">
                  <div>
                    <Label htmlFor="feedback-title">Feedback Title</Label>
                    <Input
                      id="feedback-title"
                      value={newFeedback.title}
                      onChange={(e) => setNewFeedback(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Brief title describing your feedback"
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="feedback-category">Category</Label>
                      <Select value={newFeedback.category} onValueChange={(value) => setNewFeedback(prev => ({ ...prev, category: value }))}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(category => (
                            <SelectItem key={category} value={category}>
                              <div className="flex items-center gap-2">
                                {getCategoryIcon(category)}
                                {category}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="feedback-priority">Priority</Label>
                      <Select value={newFeedback.priority} onValueChange={(value) => setNewFeedback(prev => ({ ...prev, priority: value }))}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          {priorities.map(priority => (
                            <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="feedback-description">Description</Label>
                    <Textarea
                      id="feedback-description"
                      value={newFeedback.description}
                      onChange={(e) => setNewFeedback(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Provide detailed description of your feedback, suggestion, or issue..."
                      className="min-h-[120px] mt-1"
                    />
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Feedback Guidelines</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Be specific and clear in your feedback</li>
                      <li>• Include steps to reproduce if reporting a bug</li>
                      <li>• Suggest solutions if you have ideas for improvement</li>
                      <li>• Use appropriate priority levels (Critical for system-breaking issues)</li>
                    </ul>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setNewFeedback({ title: '', description: '', category: '', priority: '' })}
                    >
                      Clear Form
                    </Button>
                    <Button 
                      onClick={handleSubmitFeedback}
                      disabled={!newFeedback.title || !newFeedback.description || !newFeedback.category || !newFeedback.priority}
                      className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Submit Feedback
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}