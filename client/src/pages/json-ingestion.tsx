import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, CheckCircle } from "lucide-react";

export default function JsonIngestion() {
  const [jsonInput, setJsonInput] = useState("");
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
      setJsonInput("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process JSON data",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    try {
      const parsedJson = JSON.parse(jsonInput);
      processJsonMutation.mutate(parsedJson);
    } catch (error) {
      toast({
        title: "Invalid JSON",
        description: "Please check your JSON syntax and try again",
        variant: "destructive",
      });
    }
  };

  const loadSampleData = () => {
    const sampleJson = {
      issue: {
        id: "2025-10",
        title: "Technology & Innovation",
        date: "2025-10-01"
      },
      sections: ["Cover", "Features", "Technology", "Innovation"],
      articles: [
        {
          id: "ai-revolution",
          section: "Technology",
          type: "feature",
          title: "The AI Revolution in Publishing",
          dek: "How artificial intelligence is transforming the way we create and consume content",
          author: "Dr. Sarah Johnson",
          body_html: "<p>Artificial intelligence is revolutionizing the publishing industry in ways we never imagined. From automated layout generation to content personalization, AI is making publishing more efficient and accessible than ever before.</p><p>In this comprehensive look at AI in publishing, we explore the current state of the technology and what the future holds for content creators and publishers alike.</p>",
          images: [
            {
              src: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e",
              role: "hero",
              caption: "AI-powered publishing workflow",
              credit: "Photo: Unsplash",
              focal_point: "0.5,0.4"
            },
            {
              src: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3",
              role: "inline",
              caption: "Modern publishing technology",
              credit: "Photo: Unsplash"
            }
          ]
        },
        {
          id: "future-magazines",
          section: "Innovation",
          type: "reportage",
          title: "The Future of Digital Magazines",
          dek: "Interactive content and immersive experiences are reshaping magazine publishing",
          author: "Alex Chen",
          body_html: "<p>Digital magazines are evolving beyond simple PDF versions of print publications. Today's readers expect interactive content, multimedia experiences, and personalized reading journeys.</p><p>Publishers are responding with innovative approaches that blend traditional storytelling with cutting-edge technology.</p>",
          images: [
            {
              src: "https://images.unsplash.com/photo-1553484771-371a605b060b",
              role: "hero", 
              caption: "Digital reading experience",
              credit: "Photo: Unsplash",
              focal_point: "0.3,0.6"
            }
          ]
        }
      ]
    };
    
    setJsonInput(JSON.stringify(sampleJson, null, 2));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">JSON Data Ingestion</h1>
        <p className="text-slate-600">
          Import magazine content from JSON format to create new issues and articles
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">JSON Input</h2>
                <Button
                  variant="outline"
                  onClick={loadSampleData}
                  data-testid="button-load-sample"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Load Sample
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="json-input">Paste your JSON data below:</Label>
                <Textarea
                  id="json-input"
                  data-testid="textarea-json-input"
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder="Paste your magazine JSON data here..."
                  className="min-h-[400px] font-mono text-sm"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setJsonInput("")}
                  data-testid="button-clear"
                >
                  Clear
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!jsonInput.trim() || processJsonMutation.isPending}
                  data-testid="button-process"
                >
                  {processJsonMutation.isPending ? (
                    "Processing..."
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Process JSON
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-slate-900">Schema Requirements</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-slate-700">Issue metadata (id, title, date)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-slate-700">Section organization</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-slate-700">Article content and metadata</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-slate-700">Image assets with roles</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-slate-900">Processing Status</h3>
            </CardHeader>
            <CardContent>
              {processJsonMutation.isPending && (
                <div className="flex items-center space-x-2 text-blue-600">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm">Processing JSON data...</span>
                </div>
              )}
              {processJsonMutation.isSuccess && (
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">Successfully processed!</span>
                </div>
              )}
              {processJsonMutation.isError && (
                <div className="flex items-center space-x-2 text-red-600">
                  <div className="w-4 h-4 border-2 border-red-600 rounded-full flex items-center justify-center">
                    <div className="w-2 h-0.5 bg-red-600 rounded" />
                  </div>
                  <span className="text-sm">Processing failed</span>
                </div>
              )}
              {!processJsonMutation.isPending && !processJsonMutation.isSuccess && !processJsonMutation.isError && (
                <div className="text-sm text-slate-500">
                  Ready to process JSON data
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
