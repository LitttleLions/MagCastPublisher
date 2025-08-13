import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Check, Loader2, Clock, Download } from "lucide-react";
import { type RenderJob } from "@shared/schema";

export default function RecentJobs() {
  const { data: jobs = [], isLoading } = useQuery<RenderJob[]>({
    queryKey: ["/api/render-jobs"],
    refetchInterval: 2000, // Poll every 2 seconds
    refetchIntervalInBackground: false,
  });

  const getStatusIcon = (status: string, progress?: number) => {
    switch (status) {
      case "completed":
        return <Check className="w-5 h-5 text-green-600" />;
      case "processing":
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      case "queued":
        return <Clock className="w-5 h-5 text-amber-600" />;
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

  const getTimeLabel = (job: RenderJob) => {
    if (job.completedAt) {
      const hours = Math.round((new Date().getTime() - new Date(job.completedAt).getTime()) / (1000 * 60 * 60));
      return `Completed ${hours} hours ago`;
    }
    if (job.status === "processing") {
      return "Processing... ETA 3 minutes";
    }
    if (job.status === "queued") {
      return "Queued - Position 2";
    }
    return "Unknown status";
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 bg-slate-200 rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-slate-200 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="recent-jobs">
      <CardHeader className="border-b border-slate-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Recent Render Jobs</h2>
          <Button variant="ghost" className="text-brand-600 hover:text-brand-700 text-sm font-medium">
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {jobs.slice(0, 3).map((job) => (
            <div key={job.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  {getStatusIcon(job.status, job.progress || 0)}
                </div>
                <div>
                  <h3 className="font-medium text-slate-900" data-testid={`job-title-${job.id}`}>
                    Issue {job.issueId} - Render Job
                  </h3>
                  <p className="text-sm text-slate-600">
                    Template: Modern | Renderer: {job.renderer}
                  </p>
                  <p className="text-xs text-slate-500">
                    {getTimeLabel(job)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusBadge(job.status)}
                {job.status === "processing" && job.progress && (
                  <div className="w-16">
                    <Progress value={job.progress} className="h-2" />
                  </div>
                )}
                {job.status === "completed" && job.pdfUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-brand-600 hover:text-brand-700"
                    data-testid={`download-${job.id}`}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
          
          {jobs.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No render jobs yet</p>
              <p className="text-sm">Jobs will appear here once you start processing magazines</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
