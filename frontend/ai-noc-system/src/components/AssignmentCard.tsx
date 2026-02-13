import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { 
  FileText, 
  Calendar, 
  Users, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  BookOpen, 
  GraduationCap,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface Assignment {
  id: string;
  title: string;
  description: string;
  subject: string;
  class: string;
  division: string;
  batch: string;
  dueDate: string;
  createdDate: string;
  assignmentFile?: File | null;
  solutionFile?: File | null;
  maxMarks: number;
  instructions: string;
  status: 'draft' | 'published' | 'expired';
}

interface AssignmentCardProps {
  assignment: Assignment;
  onEdit: (assignment: Assignment) => void;
  onDelete: (id: string) => void;
  onPublish: (id: string) => void;
}

export function AssignmentCard({ assignment, onEdit, onDelete, onPublish }: AssignmentCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Published
          </Badge>
        );
      case 'draft':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Draft
          </Badge>
        );
      case 'expired':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            Expired
          </Badge>
        );
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const isExpired = new Date(assignment.dueDate) < new Date();
  const daysUntilDue = Math.ceil((new Date(assignment.dueDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));

  return (
    <>
      <Card className="hover:shadow-lg transition-all duration-200 border border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <CardTitle className="text-lg">{assignment.title}</CardTitle>
                {getStatusBadge(assignment.status)}
              </div>
              <CardDescription className="line-clamp-2">
                {assignment.description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <BookOpen className="w-4 h-4" />
                <span>{assignment.subject}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <GraduationCap className="w-4 h-4" />
                <span>{assignment.class} {assignment.division}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Users className="w-4 h-4" />
                <span>{assignment.maxMarks} marks</span>
              </div>
            </div>

            {assignment.status === 'published' && !isExpired && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                <p className="text-blue-800 text-sm">
                  {daysUntilDue > 0 
                    ? `${daysUntilDue} days remaining` 
                    : daysUntilDue === 0 
                    ? 'Due today!' 
                    : 'Overdue'
                  }
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Dialog open={showDetails} onOpenChange={setShowDetails}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="w-4 h-4 mr-1" />
                    View Details
                  </Button>
                </DialogTrigger>
              </Dialog>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onEdit(assignment)}
                className="flex-1"
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
              
              {assignment.status === 'draft' && (
                <Button 
                  size="sm" 
                  onClick={() => onPublish(assignment.id)}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Publish
                </Button>
              )}
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onDelete(assignment.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assignment Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {assignment.title}
            </DialogTitle>
            <DialogDescription>
              Assignment details and submission information
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Assignment Information</h4>
                <div className="text-sm space-y-1">
                  <p><span className="font-medium">Subject:</span> {assignment.subject}</p>
                  <p><span className="font-medium">Class:</span> {assignment.class} {assignment.division}</p>
                  <p><span className="font-medium">Batch:</span> {assignment.batch}</p>
                  <p><span className="font-medium">Maximum Marks:</span> {assignment.maxMarks}</p>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Timeline</h4>
                <div className="text-sm space-y-1">
                  <p><span className="font-medium">Created:</span> {new Date(assignment.createdDate).toLocaleDateString()}</p>
                  <p><span className="font-medium">Due Date:</span> {new Date(assignment.dueDate).toLocaleDateString()}</p>
                  <p><span className="font-medium">Status:</span> {getStatusBadge(assignment.status)}</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Description</h4>
              <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded-lg">
                {assignment.description}
              </p>
            </div>

            {assignment.instructions && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Instructions</h4>
                <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
                  {assignment.instructions}
                </p>
              </div>
            )}

            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Files</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-sm">Assignment File</span>
                  </div>
                  {assignment.assignmentFile ? (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{assignment.assignmentFile.name}</span>
                      <Button variant="outline" size="sm">
                        <Download className="w-3 h-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No file uploaded</p>
                  )}
                </div>
                
                <div className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-sm">Solution File</span>
                  </div>
                  {assignment.solutionFile ? (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{assignment.solutionFile.name}</span>
                      <Button variant="outline" size="sm">
                        <Download className="w-3 h-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No solution uploaded</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowDetails(false)}>
                Close
              </Button>
              <Button onClick={() => onEdit(assignment)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Assignment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}