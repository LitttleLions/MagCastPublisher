
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, CheckCircle, Plus, Calendar, FolderOpen, BookOpen, Edit, Save, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Issue {
  id: string;
  issueId: string;
  title: string;
  date: string;
  sections: string[];
  status: string;
  createdAt: string;
}

export default function JsonIngestion() {
  const [jsonInput, setJsonInput] = useState("");
  const [createIssueOpen, setCreateIssueOpen] = useState(false);
  const [manualIssue, setManualIssue] = useState({
    issueId: "",
    title: "",
    date: "",
    sections: ""
  });
  const [editingIssue, setEditingIssue] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{[key: string]: {title: string, issueId: string, date: string}}>({});
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing issues
  const { data: issues = [], isLoading: loadingIssues } = useQuery<Issue[]>({
    queryKey: ["/api/issues"],
  });

  const processJsonMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/process-json", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/issues"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Erfolg",
        description: "JSON-Daten wurden erfolgreich verarbeitet",
      });
      setJsonInput("");
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error.message || "JSON-Daten konnten nicht verarbeitet werden",
        variant: "destructive",
      });
    },
  });

  const createIssueMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/issues", {
        issueId: data.issueId,
        title: data.title,
        date: data.date,
        sections: data.sections.split(",").map((s: string) => s.trim()).filter(Boolean),
        status: "draft"
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/issues"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Erfolg",
        description: "Issue wurde erfolgreich erstellt",
      });
      setManualIssue({ issueId: "", title: "", date: "", sections: "" });
      setCreateIssueOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error.message || "Issue konnte nicht erstellt werden",
        variant: "destructive",
      });
    },
  });

  const updateIssueMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => {
      const response = await apiRequest("PATCH", `/api/issues/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/issues"] });
      toast({
        title: "Erfolg",
        description: "Issue wurde erfolgreich aktualisiert",
      });
      setEditingIssue(null);
      setEditValues({});
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error.message || "Issue konnte nicht aktualisiert werden",
        variant: "destructive",
      });
    },
  });

  const handleSubmitJson = () => {
    try {
      const parsedJson = JSON.parse(jsonInput);
      processJsonMutation.mutate(parsedJson);
    } catch (error) {
      toast({
        title: "Ungültiges JSON",
        description: "Bitte überprüfe die JSON-Syntax und versuche es erneut",
        variant: "destructive",
      });
    }
  };

  const handleCreateIssue = () => {
    if (!manualIssue.issueId || !manualIssue.title || !manualIssue.date) {
      toast({
        title: "Fehlende Angaben",
        description: "Bitte fülle alle Pflichtfelder aus",
        variant: "destructive",
      });
      return;
    }
    createIssueMutation.mutate(manualIssue);
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
        }
      ]
    };
    
    setJsonInput(JSON.stringify(sampleJson, null, 2));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const startEditing = (issue: Issue) => {
    setEditingIssue(issue.id);
    setEditValues({
      ...editValues,
      [issue.id]: {
        title: issue.title,
        issueId: issue.issueId,
        date: issue.date
      }
    });
  };

  const cancelEditing = () => {
    setEditingIssue(null);
    setEditValues({});
  };

  const saveChanges = (issueId: string) => {
    const changes = editValues[issueId];
    if (changes) {
      updateIssueMutation.mutate({
        id: issueId,
        data: changes
      });
    }
  };

  const updateEditValue = (issueId: string, field: string, value: string) => {
    setEditValues({
      ...editValues,
      [issueId]: {
        ...editValues[issueId],
        [field]: value
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">Daten-Import & Issue-Verwaltung</h1>
        <p className="text-slate-600">
          Importiere Magazine-Inhalte aus JSON-Format oder erstelle neue Issues manuell
        </p>
      </div>

      {/* Existing Issues Overview */}
      <Card>
        <CardHeader className="border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FolderOpen className="w-5 h-5 text-slate-600" />
              <h2 className="text-lg font-semibold text-slate-900">Vorhandene Issues</h2>
            </div>
            <Dialog open={createIssueOpen} onOpenChange={setCreateIssueOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Neues Issue
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Neues Issue erstellen</DialogTitle>
                  <DialogDescription>
                    Erstelle ein leeres Issue, dem du später Artikel hinzufügen kannst
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="issue-id">Issue ID *</Label>
                    <Input
                      id="issue-id"
                      value={manualIssue.issueId}
                      onChange={(e) => setManualIssue({...manualIssue, issueId: e.target.value})}
                      placeholder="z.B. 2025-11"
                    />
                  </div>
                  <div>
                    <Label htmlFor="issue-title">Titel *</Label>
                    <Input
                      id="issue-title"
                      value={manualIssue.title}
                      onChange={(e) => setManualIssue({...manualIssue, title: e.target.value})}
                      placeholder="z.B. Herbst-Ausgabe 2025"
                    />
                  </div>
                  <div>
                    <Label htmlFor="issue-date">Datum *</Label>
                    <Input
                      id="issue-date"
                      type="date"
                      value={manualIssue.date}
                      onChange={(e) => setManualIssue({...manualIssue, date: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="issue-sections">Rubriken (durch Komma getrennt)</Label>
                    <Input
                      id="issue-sections"
                      value={manualIssue.sections}
                      onChange={(e) => setManualIssue({...manualIssue, sections: e.target.value})}
                      placeholder="z.B. Politik, Wirtschaft, Sport"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setCreateIssueOpen(false)}>
                      Abbrechen
                    </Button>
                    <Button 
                      onClick={handleCreateIssue}
                      disabled={createIssueMutation.isPending}
                    >
                      {createIssueMutation.isPending ? "Erstelle..." : "Issue erstellen"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {loadingIssues ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="ml-2 text-slate-600">Lade Issues...</span>
            </div>
          ) : issues.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p>Noch keine Issues vorhanden</p>
              <p className="text-sm">Erstelle ein neues Issue oder importiere JSON-Daten</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Titel</TableHead>
                    <TableHead className="w-[120px]">Issue ID</TableHead>
                    <TableHead className="w-[120px]">Datum</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead>Rubriken</TableHead>
                    <TableHead className="w-[100px]">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {issues.map((issue) => (
                    <TableRow key={issue.id}>
                      <TableCell>
                        {editingIssue === issue.id ? (
                          <Input
                            value={editValues[issue.id]?.title || issue.title}
                            onChange={(e) => updateEditValue(issue.id, 'title', e.target.value)}
                            className="h-8"
                          />
                        ) : (
                          <span className="font-medium">{issue.title}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingIssue === issue.id ? (
                          <Input
                            value={editValues[issue.id]?.issueId || issue.issueId}
                            onChange={(e) => updateEditValue(issue.id, 'issueId', e.target.value)}
                            className="h-8"
                          />
                        ) : (
                          <span className="font-mono text-sm">{issue.issueId}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingIssue === issue.id ? (
                          <Input
                            type="date"
                            value={editValues[issue.id]?.date || issue.date}
                            onChange={(e) => updateEditValue(issue.id, 'date', e.target.value)}
                            className="h-8"
                          />
                        ) : (
                          <span className="text-sm">{formatDate(issue.date)}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={issue.status === "draft" ? "secondary" : "default"}>
                          {issue.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {issue.sections && issue.sections.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {issue.sections.slice(0, 2).map((section, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {section}
                              </Badge>
                            ))}
                            {issue.sections.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{issue.sections.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingIssue === issue.id ? (
                          <div className="flex space-x-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => saveChanges(issue.id)}
                              disabled={updateIssueMutation.isPending}
                            >
                              <Save className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={cancelEditing}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEditing(issue)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* JSON Import Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-slate-600" />
                  <h2 className="text-lg font-semibold text-slate-900">JSON-Daten Import</h2>
                </div>
                <Button
                  variant="outline"
                  onClick={loadSampleData}
                  data-testid="button-load-sample"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Beispiel laden
                </Button>
              </div>
              <p className="text-sm text-slate-600 mt-1">
                Importiere vollständige Magazine-Daten mit Artikeln und Bildern
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="json-input">JSON-Daten hier einfügen:</Label>
                <Textarea
                  id="json-input"
                  data-testid="textarea-json-input"
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder="Füge hier deine Magazine-JSON-Daten ein..."
                  className="min-h-[400px] font-mono text-sm"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setJsonInput("")}
                  data-testid="button-clear"
                >
                  Leeren
                </Button>
                <Button
                  onClick={handleSubmitJson}
                  disabled={!jsonInput.trim() || processJsonMutation.isPending}
                  data-testid="button-process"
                >
                  {processJsonMutation.isPending ? (
                    "Verarbeite..."
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      JSON verarbeiten
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
              <h3 className="text-lg font-semibold text-slate-900">Schema-Anforderungen</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-slate-700">Issue-Metadaten (id, title, date)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-slate-700">Rubriken-Organisation</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-slate-700">Artikel-Inhalte und Metadaten</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-slate-700">Bild-Assets mit Rollen</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-slate-900">Verarbeitungs-Status</h3>
            </CardHeader>
            <CardContent>
              {processJsonMutation.isPending && (
                <div className="flex items-center space-x-2 text-blue-600">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm">Verarbeite JSON-Daten...</span>
                </div>
              )}
              {processJsonMutation.isSuccess && (
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">Erfolgreich verarbeitet!</span>
                </div>
              )}
              {processJsonMutation.isError && (
                <div className="flex items-center space-x-2 text-red-600">
                  <div className="w-4 h-4 border-2 border-red-600 rounded-full flex items-center justify-center">
                    <div className="w-2 h-0.5 bg-red-600 rounded" />
                  </div>
                  <span className="text-sm">Verarbeitung fehlgeschlagen</span>
                </div>
              )}
              {!processJsonMutation.isPending && !processJsonMutation.isSuccess && !processJsonMutation.isError && (
                <div className="text-sm text-slate-500">
                  Bereit für JSON-Datenverarbeitung
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
