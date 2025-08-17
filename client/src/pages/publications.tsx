import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { type RenderJob, type Issue } from "@shared/schema";
import { Download, FileText, Calendar, User, Eye, Share } from "lucide-react";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PublicationWithIssue extends RenderJob {
  issue?: Issue;
}

export default function Publications() {
  const [previewPublication, setPreviewPublication] = useState<PublicationWithIssue | null>(null);
  const [jobs, setJobs] = useState<RenderJob[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);

  const loadJobs = async () => {
    try {
      const response = await fetch('/api/render-jobs');
      const data = await response.json();
      setJobs(data);
    } catch (error) {
      console.error('Error loading jobs:', error);
      setJobs([]);
    }
  };

  const loadIssues = async () => {
    try {
      const response = await fetch('/api/issues');
      const data = await response.json();
      setIssues(data);
    } catch (error) {
      console.error('Error loading issues:', error);
      setIssues([]);
    } finally {
      setJobsLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
    loadIssues();
  }, []);

  // Combine render jobs with issue data for completed publications
  const publications: PublicationWithIssue[] = jobs
    .filter(job => job.status === "completed" && job.pdfUrl)
    .map(job => ({
      ...job,
      issue: issues.find(issue => issue.id === job.issueId)
    }))
    .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatFileSize = (url: string) => {
    // In a real implementation, you would fetch the actual file size
    // For now, we'll estimate based on typical PDF sizes
    return "2.4 MB";
  };

  const getPublicationStats = () => {
    const totalPublications = publications.length;
    const thisMonth = publications.filter(pub => {
      const pubDate = new Date(pub.completedAt!);
      const now = new Date();
      return pubDate.getMonth() === now.getMonth() && pubDate.getFullYear() === now.getFullYear();
    }).length;
    
    const totalSize = publications.length * 2.4; // Estimated
    
    return { totalPublications, thisMonth, totalSize };
  };

  const stats = getPublicationStats();

  if (jobsLoading) {
    return (
      <div className="space-y-8">
        <div className="h-8 bg-slate-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-slate-200 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-64 bg-slate-200 rounded" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">Publications</h1>
        <p className="text-slate-600">
          Browse and download your completed magazine publications
        </p>
      </div>

      {/* Publication Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Publications</p>
                <p className="text-2xl font-semibold text-slate-900 mt-1" data-testid="stat-total-publications">
                  {stats.totalPublications}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center mt-4">
              <span className="text-xs text-slate-600">All time publications</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">This Month</p>
                <p className="text-2xl font-semibold text-slate-900 mt-1" data-testid="stat-month-publications">
                  {stats.thisMonth}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="flex items-center mt-4">
              <span className="text-xs text-slate-600">Publications this month</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Size</p>
                <p className="text-2xl font-semibold text-slate-900 mt-1" data-testid="stat-total-size">
                  {stats.totalSize.toFixed(1)} MB
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Download className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <div className="flex items-center mt-4">
              <span className="text-xs text-slate-600">Combined file size</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Publications List */}
      {publications.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No Publications Yet</h3>
            <p className="text-slate-600 mb-4">
              Complete your first render job to see published magazines here.
            </p>
            <Button 
              className="bg-brand-600 hover:bg-brand-700 text-white"
              onClick={() => window.location.href = "/render-queue"}
            >
              <FileText className="w-4 h-4 mr-2" />
              Create Publication
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Published Magazines</h2>
              <Badge variant="outline">
                {publications.length} publications
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {publications.map((publication) => (
                <div 
                  key={publication.id}
                  className="border border-slate-200 rounded-lg p-6 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-12 h-12 bg-brand-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-6 h-6 text-brand-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900" data-testid={`publication-title-${publication.id}`}>
                            {publication.issue?.title || "Unknown Issue"}
                          </h3>
                          <p className="text-sm text-slate-600">
                            Issue {publication.issue?.issueId} • {publication.renderer} renderer
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <div>
                            <div className="text-slate-500">Published</div>
                            <div className="font-medium text-slate-900">
                              {formatDate(publication.completedAt!)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-slate-400" />
                          <div>
                            <div className="text-slate-500">Template</div>
                            <div className="font-medium text-slate-900">
                              {publication.templatePackId.includes('modern') ? 'Modern Pack' : 
                               publication.templatePackId.includes('corporate') ? 'Corporate Pack' : 
                               'Magazine Pack'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-slate-400" />
                          <div>
                            <div className="text-slate-500">File Size</div>
                            <div className="font-medium text-slate-900">
                              {formatFileSize(publication.pdfUrl!)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 rounded-full bg-green-500" />
                          <div>
                            <div className="text-slate-500">Status</div>
                            <div className="font-medium text-green-700">Published</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewPublication(publication)}
                        data-testid={`preview-${publication.id}`}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Preview
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        data-testid={`share-${publication.id}`}
                      >
                        <Share className="w-4 h-4 mr-1" />
                        Share
                      </Button>
                      <Button
                        className="bg-brand-600 hover:bg-brand-700 text-white"
                        size="sm"
                        onClick={() => window.open(publication.pdfUrl!, '_blank')}
                        data-testid={`download-${publication.id}`}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewPublication} onOpenChange={() => setPreviewPublication(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{previewPublication?.issue?.title}</DialogTitle>
            <DialogDescription>
              Publication preview and details
            </DialogDescription>
          </DialogHeader>
          {previewPublication && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-slate-900">Publication Details</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Issue ID:</span>
                      <span className="font-medium">{previewPublication.issue?.issueId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Publication Date:</span>
                      <span className="font-medium">{previewPublication.issue?.date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Template:</span>
                      <span className="font-medium">
                        {previewPublication.templatePackId.includes('modern') ? 'Modern Pack' : 
                         previewPublication.templatePackId.includes('corporate') ? 'Corporate Pack' : 
                         'Magazine Pack'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Renderer:</span>
                      <span className="font-medium">{previewPublication.renderer}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Completed:</span>
                      <span className="font-medium">{formatDate(previewPublication.completedAt!)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">File Size:</span>
                      <span className="font-medium">{formatFileSize(previewPublication.pdfUrl!)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium text-slate-900">Issue Information</h4>
                  <div className="space-y-3 text-sm">
                    {previewPublication.issue?.sections && (
                      <div>
                        <span className="text-slate-600">Sections:</span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {previewPublication.issue.sections.map((section, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {section}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-600">Status:</span>
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                        {previewPublication.issue?.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setPreviewPublication(null)}>
                  Close
                </Button>
                <Button 
                  className="bg-brand-600 hover:bg-brand-700 text-white"
                  onClick={() => window.open(previewPublication.pdfUrl!, '_blank')}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
