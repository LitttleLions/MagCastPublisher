import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type RenderJob, type Issue, type TemplatePack } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Play, Download, Trash2, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function RenderQueue() {
  const [createJobOpen, setCreateJobOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [jobs, setJobs] = useState<RenderJob[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [templates, setTemplates] = useState<TemplatePack[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const { toast } = useToast();

  // Load all data functions
  const loadJobs = async () => {
    try {
      const response = await fetch('/api/render-jobs');
      const data = await response.json();
      setJobs(data);
    } catch (error) {
      console.error('Error loading jobs:', error);
      setJobs([]);
    } finally {
      setJobsLoading(false);
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
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/template-packs');
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      console.error('Error loading templates:', error);
      setTemplates([]);
    }
  };

  // Load all data on mount and poll for jobs
  useEffect(() => {
    loadJobs();
    loadIssues();
    loadTemplates();

    // Poll for job updates every second
    const interval = setInterval(loadJobs, 1000);
    return () => clearInterval(interval);
  }, []);

  const createJobMutation = useMutation({
    mutationFn: async (data: { issueId: string; templatePackId: string; renderer: string }) => {
      const response = await apiRequest("POST", "/api/render-jobs", data);
      return response.json();
    },
    onSuccess: () => {
      // Reload jobs after creation
      loadJobs();
      toast({
        title: "Success",
        description: "Render job created successfully",
      });
      setCreateJobOpen(false);
      setSelectedIssue("");
      setSelectedTemplate("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create render job",
        variant: "destructive",
      });
    },
  });

  const handleCreateJob = () => {
    if (!selectedIssue || !selectedTemplate) {
      toast({
        title: "Missing Information",
        description: "Please select both an issue and template",
        variant: "destructive",
      });
      return;
    }

    createJobMutation.mutate({
      issueId: selectedIssue,
      templatePackId: selectedTemplate,
      renderer: "prince",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "processing":
        return <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />;
      case "queued":
        return <Clock className="w-5 h-5 text-amber-600" />;
      case "failed":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Completed</Badge>;
      case "processing":
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Processing</Badge>;
      case "queued":
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Queued</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (jobsLoading) {
    return (
      <div className="space-y-8">
        <div className="h-8 bg-slate-200 rounded animate-pulse" />
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">Render Queue</h1>
          <p className="text-slate-600">
            Monitor and manage PDF rendering jobs for your magazine issues
          </p>
        </div>
        <Dialog open={createJobOpen} onOpenChange={setCreateJobOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-brand-600 hover:bg-brand-700 text-white"
              data-testid="button-new-render-job"
            >
              <Play className="w-4 h-4 mr-2" />
              New Render Job
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Render Job</DialogTitle>
              <DialogDescription>
                Select an issue and template to create a new PDF rendering job.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="issue-select">Issue</Label>
                <Select value={selectedIssue} onValueChange={setSelectedIssue}>
                  <SelectTrigger data-testid="select-issue">
                    <SelectValue placeholder="Select an issue" />
                  </SelectTrigger>
                  <SelectContent>
                    {issues.map((issue) => (
                      <SelectItem key={issue.id} value={issue.id}>
                        {issue.title} ({issue.issueId})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="template-select">Template Pack</Label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger data-testid="select-template">
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name} ({template.version})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setCreateJobOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateJob}
                  disabled={createJobMutation.isPending}
                  data-testid="button-create-job"
                >
                  {createJobMutation.isPending ? "Creating..." : "Create Job"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Active Jobs</h2>
            <Badge variant="outline">
              {jobs.filter(j => j.status === "queued" || j.status === "processing").length} active
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No Render Jobs</h3>
              <p className="text-slate-600 mb-4">
                Create your first render job to start generating PDF magazines.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div 
                  key={job.id} 
                  className="border border-slate-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                        {getStatusIcon(job.status)}
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-900" data-testid={`job-title-${job.id}`}>
                          Render Job #{job.id.slice(-8)}
                        </h3>
                        <p className="text-sm text-slate-600">
                          Issue: {job.issueId} • Template: {job.templatePackId} • {job.renderer}
                        </p>
                        <p className="text-xs text-slate-500">
                          Created: {formatDate(job.createdAt!)}
                          {job.startedAt && ` • Started: ${formatDate(job.startedAt)}`}
                          {job.completedAt && ` • Completed: ${formatDate(job.completedAt)}`}
                        </p>
                        {job.status === "completed" && (
                          <p className="text-xs text-green-600 mt-1">
                            ✓ Rendering completed successfully
                          </p>
                        )}
                        {job.status === "failed" && job.errorMessage && (
                          <p className="text-xs text-red-600 mt-1">
                            ✗ {job.errorMessage}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {getStatusBadge(job.status)}
                      {job.status === "processing" && job.progress !== null && (
                        <div className="w-20">
                          <Progress value={job.progress} className="h-2" />
                          <div className="text-xs text-slate-500 text-center mt-1">
                            {job.progress}%
                          </div>
                        </div>
                      )}
                      <div className="flex space-x-1">
                        {job.status === "completed" && job.pdfUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            data-testid={`download-${job.id}`}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          data-testid={`delete-${job.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  {job.errorMessage && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      <strong>Error:</strong> {job.errorMessage}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
