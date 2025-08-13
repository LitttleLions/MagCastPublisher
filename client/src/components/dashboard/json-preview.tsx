import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const sampleJson = {
  issue: {
    id: "2025-09",
    title: "Stadt & Meer",
    date: "2025-09-01"
  },
  sections: ["Titel", "Reportage", "Service"],
  articles: [
    {
      id: "hafen-nacht",
      section: "Reportage",
      type: "feature",
      title: "Hafen bei Nacht",
      dek: "Lichter, Nebel, Schlepper",
      author: "Nora K.",
      body_html: "<p>Die Stadt schläft nie...</p>",
      images: [
        {
          src: "https://cdn/lead.jpg",
          role: "hero",
          caption: "Blick aufs Dock",
          credit: "Foto: XY",
          focal_point: "0.5,0.3"
        }
      ]
    }
  ]
};

export default function JsonPreview() {
  const [jsonData] = useState(sampleJson);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const processJsonMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/process-json", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/issues"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success",
        description: "JSON data processed successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to process JSON data",
        variant: "destructive",
      });
    },
  });

  const handleProcessJson = () => {
    processJsonMutation.mutate(jsonData);
  };

  return (
    <Card data-testid="json-preview">
      <CardHeader className="border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900">JSON Data Preview</h2>
        <p className="text-sm text-slate-600 mt-1">Latest ingested magazine data</p>
      </CardHeader>
      <CardContent className="p-6">
        <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
          <pre className="text-sm text-green-400 font-mono">
            <code data-testid="json-content">
              {JSON.stringify(jsonData, null, 2)}
            </code>
          </pre>
        </div>
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-slate-600">
            <span className="font-medium">
              {jsonData.articles.length} articles
            </span>
            {" • "}
            <span className="font-medium">
              {jsonData.articles.reduce((acc, article) => acc + article.images.length, 0)} images
            </span>
            {" • "}
            Last updated 1 hour ago
          </div>
          <Button
            onClick={handleProcessJson}
            disabled={processJsonMutation.isPending}
            className="bg-brand-600 hover:bg-brand-700 text-white font-medium transition-colors"
            data-testid="button-process-json"
          >
            {processJsonMutation.isPending ? "Processing..." : "Process JSON"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
