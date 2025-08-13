import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { insertIssueSchema, type InsertIssue } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function Header() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertIssue>({
    resolver: zodResolver(insertIssueSchema),
    defaultValues: {
      title: "",
      issueId: "",
      date: new Date().toISOString().split('T')[0],
      sections: [],
      status: "draft",
    },
  });

  const createIssueMutation = useMutation({
    mutationFn: async (data: InsertIssue) => {
      const response = await apiRequest("POST", "/api/issues", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/issues"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success",
        description: "New issue created successfully",
      });
      setOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create issue",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertIssue) => {
    createIssueMutation.mutate(data);
  };

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Publishing Dashboard</h1>
          <p className="text-slate-600 mt-1">Manage your automated magazine publishing workflow</p>
        </div>
        <div className="flex items-center space-x-4">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-brand-600 hover:bg-brand-700 text-white font-medium transition-colors"
                data-testid="button-new-issue"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Issue
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Issue</DialogTitle>
                <DialogDescription>
                  Create a new magazine issue that can be populated with content.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    data-testid="input-issue-title"
                    {...form.register("title")}
                    placeholder="e.g., Stadt & Meer"
                  />
                  {form.formState.errors.title && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.title.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="issueId">Issue ID</Label>
                  <Input
                    id="issueId"
                    data-testid="input-issue-id"
                    {...form.register("issueId")}
                    placeholder="e.g., 2025-09"
                  />
                  {form.formState.errors.issueId && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.issueId.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="date">Publication Date</Label>
                  <Input
                    id="date"
                    type="date"
                    data-testid="input-issue-date"
                    {...form.register("date")}
                  />
                  {form.formState.errors.date && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.date.message}
                    </p>
                  )}
                </div>
                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setOpen(false)}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createIssueMutation.isPending}
                    data-testid="button-create"
                  >
                    {createIssueMutation.isPending ? "Creating..." : "Create Issue"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </header>
  );
}
