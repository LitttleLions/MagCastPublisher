import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, CheckCircle, Plus, Calendar, FolderOpen, BookOpen, Edit, Save, X, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface Issue {
  id: string;
  issueId: string;
  title: string;
  date: string;
  sections: string[] | string; // Can be either array or JSON string
  status: string;
  createdAt: string;
}

export default function JsonIngestion() {
  const [jsonInput, setJsonInput] = useState("");
  const [createMagazineOpen, setCreateMagazineOpen] = useState(false);
  const [editingMagazine, setEditingMagazine] = useState<string | null>(null);
  const [manualMagazine, setManualMagazine] = useState({
    issueId: "",
    title: "",
    date: "",
    sections: "",
    jsonData: ""
  });
  const [editValues, setEditValues] = useState<{[key: string]: {title: string, issueId: string, date: string, jsonData: string}}>({});

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing magazines with no caching
  const { data: magazines = [], isLoading: loadingMagazines, refetch: refetchMagazines } = useQuery<Issue[]>({
    queryKey: ["/api/issues"],
    staleTime: 0,
    gcTime: 0, // Don't cache at all
  });

  const processJsonMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/process-json", data);
      return response.json();
    },
    onSuccess: () => {
      // Force refetch immediately
      queryClient.invalidateQueries({ queryKey: ["/api/issues"] });
      queryClient.refetchQueries({ queryKey: ["/api/issues"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Erfolg",
        description: "JSON-Daten wurden erfolgreich verarbeitet",
      });
      setJsonInput("");
      setManualMagazine({ issueId: "", title: "", date: "", sections: "", jsonData: "" });
      setCreateMagazineOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error.message || "JSON-Daten konnten nicht verarbeitet werden",
        variant: "destructive",
      });
    },
  });

  const createMagazineMutation = useMutation({
    mutationFn: async (data: any) => {
      // Falls JSON-Daten vorhanden sind, diese zuerst verarbeiten
      if (data.jsonData && data.jsonData.trim()) {
        try {
          const parsedJson = JSON.parse(data.jsonData);
          const response = await apiRequest("POST", "/api/process-json", parsedJson);
          return response.json();
        } catch (jsonError) {
          throw new Error("Ungültiges JSON-Format");
        }
      } else {
        // Andernfalls leeres Magazin erstellen
        const response = await apiRequest("POST", "/api/issues", {
          issueId: data.issueId,
          title: data.title,
          date: data.date,
          sections: data.sections.split(",").map((s: string) => s.trim()).filter(Boolean),
          status: "draft"
        });
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/issues"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Erfolg",
        description: "Magazin wurde erfolgreich erstellt",
      });
      setManualMagazine({ issueId: "", title: "", date: "", sections: "", jsonData: "" });
      setCreateMagazineOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error.message || "Magazin konnte nicht erstellt werden",
        variant: "destructive",
      });
    },
  });

  const updateMagazineMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => {
      // Falls JSON-Daten vorhanden sind, diese verarbeiten
      if (data.jsonData && data.jsonData.trim()) {
        try {
          const parsedJson = JSON.parse(data.jsonData);
          const response = await apiRequest("POST", "/api/process-json", parsedJson);
          return response.json();
        } catch (jsonError) {
          throw new Error("Ungültiges JSON-Format");
        }
      } else {
        // Andernfalls nur Metadaten aktualisieren
        const response = await apiRequest("PATCH", `/api/issues/${id}`, {
          title: data.title,
          issueId: data.issueId,
          date: data.date
        });
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/issues"] });
      toast({
        title: "Erfolg",
        description: "Magazin wurde erfolgreich aktualisiert",
      });
      setEditingMagazine(null);
      setEditValues({});
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error.message || "Magazin konnte nicht aktualisiert werden",
        variant: "destructive",
      });
    },
  });

  const deleteMagazineMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/issues/${id}`);
      if (!response.ok) {
        throw new Error("Magazin konnte nicht gelöscht werden");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/issues"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Erfolg",
        description: "Magazin wurde erfolgreich gelöscht",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error.message || "Magazin konnte nicht gelöscht werden",
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

  const handleCreateMagazine = () => {
    if (!manualMagazine.issueId || !manualMagazine.title || !manualMagazine.date) {
      toast({
        title: "Fehlende Angaben",
        description: "Bitte fülle alle Pflichtfelder aus",
        variant: "destructive",
      });
      return;
    }
    createMagazineMutation.mutate(manualMagazine);
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

  const loadMultiArticleSample = () => {
    const multiArticleJson = {
      issue: {
        id: "2025-11",
        title: "Vielfalt & Innovation Magazin",
        date: "2025-11-01"
      },
      sections: ["Editorial", "Technologie", "Wirtschaft", "Lifestyle"],
      articles: [
        {
          id: "ki-zukunft",
          section: "Technologie",
          type: "feature",
          title: "KI verändert unsere Zukunft",
          dek: "Wie künstliche Intelligenz Branchen revolutioniert",
          author: "Dr. Anna Technik",
          body_html: "<p>Künstliche Intelligenz ist nicht mehr nur Science Fiction. Sie verändert bereits heute grundlegend, wie wir arbeiten, leben und kommunizieren.</p><h2>Die Revolution hat begonnen</h2><p>Von selbstfahrenden Autos bis hin zu intelligenten Assistenten – KI ist überall. Die Technologie entwickelt sich so schnell, dass selbst Experten überrascht sind.</p><blockquote>\"KI wird die nächste industrielle Revolution sein\"</blockquote><p>Unternehmen investieren Milliarden in KI-Forschung. Die Auswirkungen werden in allen Bereichen spürbar sein.</p>",
          images: [
            {
              src: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e",
              role: "hero",
              caption: "KI-Technologie im Einsatz",
              credit: "Foto: Unsplash",
              focal_point: "0.5,0.3"
            }
          ]
        },
        {
          id: "startup-boom",
          section: "Wirtschaft",
          type: "article",
          title: "Der neue Startup-Boom",
          dek: "Warum jetzt die beste Zeit für Gründer ist",
          author: "Maria Gründerin",
          body_html: "<p>Die Startup-Szene erlebt einen neuen Aufschwung. Investoren suchen nach innovativen Ideen und sind bereit, Risiken einzugehen.</p><h2>Chancen nutzen</h2><p>Die Digitalisierung hat neue Märkte geschaffen. Besonders in den Bereichen FinTech, HealthTech und CleanTech gibt es großes Potenzial.</p><p>Erfolgreiche Gründer betonen: <em>\"Der richtige Zeitpunkt ist jetzt\"</em>. Die Infrastruktur war noch nie so gut wie heute.</p>",
          images: [
            {
              src: "https://images.unsplash.com/photo-1556761175-b413da4baf72",
              role: "hero",
              caption: "Moderne Bürolandschaft",
              credit: "Foto: Unsplash",
              focal_point: "0.6,0.4"
            }
          ]
        },
        {
          id: "sustainable-living",
          section: "Lifestyle",
          type: "reportage",
          title: "Nachhaltigkeit im Alltag",
          author: "Tom Öko",
          body_html: "<p>Nachhaltiges Leben muss nicht kompliziert sein. Kleine Änderungen können große Wirkung haben.</p><h2>Einfache Schritte</h2><p>Vom Verzicht auf Plastikbeutel bis hin zum bewussten Konsum – jeder kann einen Beitrag leisten. Die Generation Z macht es vor.</p><p>Besonders wichtig: Nachhaltigkeit sollte bezahlbar bleiben. Es geht nicht darum, perfekt zu sein, sondern besser zu werden.</p>",
          images: []
        }
      ]
    };

    setJsonInput(JSON.stringify(multiArticleJson, null, 2));
    toast({
      title: "Mehrere Artikel geladen",
      description: "Beispiel mit 3 Artikeln in verschiedenen Rubriken",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const startEditing = (magazine: Issue) => {
    setEditingMagazine(magazine.id);
    setEditValues({
      ...editValues,
      [magazine.id]: {
        title: magazine.title,
        issueId: magazine.issueId,
        date: magazine.date,
        jsonData: ""
      }
    });
  };

  const cancelEditing = () => {
    setEditingMagazine(null);
    setEditValues({});
  };

  const saveChanges = (magazineId: string) => {
    const changes = editValues[magazineId];
    if (changes) {
      updateMagazineMutation.mutate({
        id: magazineId,
        data: changes
      });
    }
  };

  const updateEditValue = (magazineId: string, field: string, value: string) => {
    setEditValues({
      ...editValues,
      [magazineId]: {
        ...editValues[magazineId],
        [field]: value
      }
    });
  };

  const generateJsonTemplate = (magazine: Issue) => {
    const template = {
      issue: {
        id: magazine.issueId,
        title: magazine.title,
        date: magazine.date
      },
      sections: (() => {
        try {
          const sections = typeof magazine.sections === 'string' 
            ? JSON.parse(magazine.sections) 
            : magazine.sections;
          return Array.isArray(sections) ? sections : ["Hauptteil", "Service", "Editorial"];
        } catch (e) {
          return ["Hauptteil", "Service", "Editorial"];
        }
      })(),
      articles: [
        {
          id: "beispiel-artikel-1",
          section: (() => {
            try {
              const sections = typeof magazine.sections === 'string' 
                ? JSON.parse(magazine.sections) 
                : magazine.sections;
              return Array.isArray(sections) ? sections[0] || "Hauptteil" : "Hauptteil";
            } catch (e) {
              return "Hauptteil";
            }
          })(),
          type: "feature",
          title: "Beispiel-Artikel Titel",
          dek: "Kurzer Vorspann oder Untertitel",
          author: "Ihr Name",
          body_html: "<p>Hier kommt der HTML-Inhalt des Artikels...</p><h2>Zwischenüberschrift</h2><p>Weiterer Absatz mit <strong>wichtigen</strong> Informationen.</p>",
          images: [
            {
              src: "https://images.unsplash.com/photo-1519389950473-47ba0277781c",
              role: "hero",
              caption: "Beispiel-Bildunterschrift",
              credit: "Foto: Unsplash",
              focal_point: "0.5,0.3"
            }
          ]
        },
        {
          id: "beispiel-artikel-2", 
          section: (() => {
            try {
              const sections = typeof magazine.sections === 'string' 
                ? JSON.parse(magazine.sections) 
                : magazine.sections;
              return Array.isArray(sections) ? sections[1] || "Service" : "Service";
            } catch (e) {
              return "Service";
            }
          })(),
          type: "article",
          title: "Zweiter Artikel",
          author: "Anderer Autor",
          body_html: "<p>Inhalt des zweiten Artikels...</p>",
          images: []
        }
      ]
    };

    setJsonInput(JSON.stringify(template, null, 2));
    toast({
      title: "JSON-Vorlage generiert",
      description: `Vorlage für "${magazine.title}" wurde in das Eingabefeld geladen`,
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">Datenverwaltung</h1>
        <p className="text-slate-600">
          Erstelle neue Magazine und importiere Inhalte im JSON-Format
        </p>
      </div>

      {/* Existing Magazines Overview */}
      <Card>
        <CardHeader className="border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FolderOpen className="w-5 h-5 text-slate-600" />
              <h2 className="text-lg font-semibold text-slate-900">Vorhandene Magazine</h2>
            </div>
            <Dialog open={createMagazineOpen} onOpenChange={setCreateMagazineOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Neues Magazin
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Neues Magazin erstellen</DialogTitle>
                  <DialogDescription>
                    Erstelle ein neues Magazin mit Metadaten und optional JSON-Daten
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Metadaten */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Magazin-Metadaten</h3>
                    <div>
                      <Label htmlFor="magazine-id">Magazin-ID *</Label>
                      <Input
                        id="magazine-id"
                        value={manualMagazine.issueId}
                        onChange={(e) => setManualMagazine({...manualMagazine, issueId: e.target.value})}
                        placeholder="z.B. 2025-11"
                      />
                    </div>
                    <div>
                      <Label htmlFor="magazine-title">Titel *</Label>
                      <Input
                        id="magazine-title"
                        value={manualMagazine.title}
                        onChange={(e) => setManualMagazine({...manualMagazine, title: e.target.value})}
                        placeholder="z.B. Herbst-Ausgabe 2025"
                      />
                    </div>
                    <div>
                      <Label htmlFor="magazine-date">Datum *</Label>
                      <Input
                        id="magazine-date"
                        type="date"
                        value={manualMagazine.date}
                        onChange={(e) => setManualMagazine({...manualMagazine, date: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="magazine-sections">Rubriken (durch Komma getrennt)</Label>
                      <Input
                        id="magazine-sections"
                        value={manualMagazine.sections}
                        onChange={(e) => setManualMagazine({...manualMagazine, sections: e.target.value})}
                        placeholder="z.B. Politik, Wirtschaft, Sport"
                      />
                    </div>
                  </div>

                  {/* JSON-Daten */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">JSON-Daten (optional)</h3>
                      <div className="flex space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setManualMagazine({...manualMagazine, jsonData: JSON.stringify({
                            issue: {
                              id: manualMagazine.issueId || "2025-11",
                              title: manualMagazine.title || "Neues Magazin",
                              date: manualMagazine.date || "2025-11-01"
                            },
                            sections: manualMagazine.sections ? manualMagazine.sections.split(",").map(s => s.trim()) : ["Editorial", "Hauptteil"],
                            articles: []
                          }, null, 2)})}
                        >
                          <FileText className="w-3 h-3 mr-1" />
                          Vorlage
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={loadMultiArticleSample}
                        >
                          <BookOpen className="w-3 h-3 mr-1" />
                          Beispiel
                        </Button>
                      </div>
                    </div>
                    <Textarea
                      value={manualMagazine.jsonData}
                      onChange={(e) => setManualMagazine({...manualMagazine, jsonData: e.target.value})}
                      placeholder="JSON-Daten hier einfügen (optional)..."
                      className="min-h-[300px] font-mono text-sm"
                    />
                    <p className="text-xs text-slate-500">
                      Falls JSON-Daten eingegeben werden, werden diese direkt verarbeitet und Artikel erstellt.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setCreateMagazineOpen(false)}>
                    Abbrechen
                  </Button>
                  <Button 
                    onClick={handleCreateMagazine}
                    disabled={createMagazineMutation.isPending}
                  >
                    {createMagazineMutation.isPending ? "Erstelle..." : "Magazin erstellen"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {loadingMagazines ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="ml-2 text-slate-600">Lade Magazine...</span>
            </div>
          ) : magazines.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p>Noch keine Magazine vorhanden</p>
              <p className="text-sm">Erstelle ein neues Magazin oder importiere JSON-Daten</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Titel</TableHead>
                    <TableHead className="w-[120px]">Magazin-ID</TableHead>
                    <TableHead className="w-[120px]">Datum</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead>Rubriken</TableHead>
                    <TableHead className="w-[150px]">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {magazines.map((magazine) => (
                    <TableRow key={magazine.id}>
                      <TableCell>
                        {editingMagazine === magazine.id ? (
                          <Input
                            value={editValues[magazine.id]?.title || magazine.title}
                            onChange={(e) => updateEditValue(magazine.id, 'title', e.target.value)}
                            className="h-8"
                          />
                        ) : (
                          <span className="font-medium">{magazine.title}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingMagazine === magazine.id ? (
                          <Input
                            value={editValues[magazine.id]?.issueId || magazine.issueId}
                            onChange={(e) => updateEditValue(magazine.id, 'issueId', e.target.value)}
                            className="h-8"
                          />
                        ) : (
                          <span className="font-mono text-sm">{magazine.issueId}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingMagazine === magazine.id ? (
                          <Input
                            type="date"
                            value={editValues[magazine.id]?.date || magazine.date}
                            onChange={(e) => updateEditValue(magazine.id, 'date', e.target.value)}
                            className="h-8"
                          />
                        ) : (
                          <span className="text-sm">{formatDate(magazine.date)}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={magazine.status === "draft" ? "secondary" : "default"}>
                          {magazine.status === "draft" ? "Entwurf" : magazine.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          let sections: string[] = [];
                          try {
                            sections = typeof magazine.sections === 'string' 
                              ? JSON.parse(magazine.sections) 
                              : magazine.sections;
                            if (!Array.isArray(sections)) {
                              sections = [];
                            }
                          } catch (e) {
                            console.warn('Failed to parse sections for magazine:', magazine.id, e);
                            sections = [];
                          }

                          return sections.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {sections.slice(0, 2).map((section: string, idx: number) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {section}
                                </Badge>
                              ))}
                              {sections.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{sections.length - 2}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500">Keine Sections</span>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        {editingMagazine === magazine.id ? (
                          <div className="space-y-2">
                            <Textarea
                              value={editValues[magazine.id]?.jsonData || ""}
                              onChange={(e) => updateEditValue(magazine.id, 'jsonData', e.target.value)}
                              placeholder="JSON-Daten hier einfügen..."
                              className="min-h-[100px] font-mono text-xs"
                            />
                            <div className="flex space-x-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => saveChanges(magazine.id)}
                                disabled={updateMagazineMutation.isPending}
                                title="Speichern"
                              >
                                <Save className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={cancelEditing}
                                title="Abbrechen"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex space-x-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startEditing(magazine)}
                              title="Bearbeiten"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => generateJsonTemplate(magazine)}
                              title="JSON-Vorlage generieren"
                            >
                              <FileText className="w-3 h-3" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  title="Löschen"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Magazin löschen</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Möchten Sie das Magazin "{magazine.title}" wirklich löschen? 
                                    Diese Aktion kann nicht rückgängig gemacht werden.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteMagazineMutation.mutate(magazine.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Löschen
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
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
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={loadSampleData}
                    data-testid="button-load-sample"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Einzelartikel
                  </Button>
                  <Button
                    variant="outline"
                    onClick={loadMultiArticleSample}
                    data-testid="button-load-multi-sample"
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    Mehrere Artikel
                  </Button>
                </div>
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