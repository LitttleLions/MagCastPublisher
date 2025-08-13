
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface LayoutDecision {
  articleId: string;
  articleTitle: string;
  variant: {
    id: string;
    columns: number;
  };
  fontSize: number;
  columnCount: number;
  score: number;
  warnings: string[];
  timestamp: string;
}

interface LayoutEngineStats {
  totalDecisions: number;
  averageScore: number;
  lastDecisionTime: string;
  activeRules: {
    typography: {
      font_min: number;
      font_max: number;
      line_height_min: number;
      line_height_max: number;
    };
    layout: {
      max_columns: number;
      min_text_length: number;
      max_text_length: number;
    };
    images: {
      hero_required_words: number;
      max_images_per_column: number;
    };
  };
  recentDecisions: LayoutDecision[];
}

export default function LayoutEngine() {
  const { data: engineStats, isLoading, error } = useQuery<LayoutEngineStats>({
    queryKey: ['layout-engine-stats'],
    queryFn: async () => {
      const response = await fetch('/api/layout-engine/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch layout engine stats');
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Layout Engine</h1>
          <p className="mt-2 text-slate-600">Intelligente Layout-Entscheidungen für optimale Lesbarkeit</p>
        </div>
        <div className="text-center py-8 text-slate-500">Lade Layout Engine Daten...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Layout Engine</h1>
          <p className="mt-2 text-slate-600">Intelligente Layout-Entscheidungen für optimale Lesbarkeit</p>
        </div>
        
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">Engine Status</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Auto-fitting</span>
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Enabled</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Typography scaling</span>
                <span className="text-xs text-slate-500">9.5-10.5pt</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Column optimization</span>
                <span className="text-xs text-slate-500">1-3 cols</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Image focal points</span>
                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Processing</Badge>
              </div>
            </div>
            
            <Separator className="my-6" />
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h3 className="font-medium text-amber-800 mb-2">Noch keine Entscheidungen verfügbar</h3>
              <p className="text-sm text-amber-700">
                Die Layout Engine wird aktiv, sobald Sie Ihr erstes Magazin in der Render Queue generieren. 
                Dann sehen Sie hier alle Layout-Entscheidungen und Optimierungen.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-amber-600";
    return "text-red-600";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return "bg-green-100 text-green-700";
    if (score >= 70) return "bg-amber-100 text-amber-700";
    return "bg-red-100 text-red-700";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Layout Engine</h1>
        <p className="mt-2 text-slate-600">Intelligente Layout-Entscheidungen für optimale Lesbarkeit</p>
      </div>

      {/* Engine Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-sm font-medium text-slate-600">Gesamte Entscheidungen</h3>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{engineStats.totalDecisions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-sm font-medium text-slate-600">Durchschnittlicher Score</h3>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(engineStats.averageScore)}`}>
              {engineStats.averageScore}/100
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-sm font-medium text-slate-600">Letzte Entscheidung</h3>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-slate-900">{engineStats.lastDecisionTime}</div>
          </CardContent>
        </Card>
      </div>

      {/* Engine Rules */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-900">Aktive Layout-Regeln</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-medium text-slate-900 mb-3">Typografie</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Schriftgröße:</span>
                  <span>{engineStats.activeRules.typography.font_min} - {engineStats.activeRules.typography.font_max}pt</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Zeilenhöhe:</span>
                  <span>{engineStats.activeRules.typography.line_height_min} - {engineStats.activeRules.typography.line_height_max}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-slate-900 mb-3">Layout</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Max. Spalten:</span>
                  <span>{engineStats.activeRules.layout.max_columns}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Min. Text:</span>
                  <span>{engineStats.activeRules.layout.min_text_length} Wörter</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-slate-900 mb-3">Bilder</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Hero ab:</span>
                  <span>{engineStats.activeRules.images.hero_required_words} Wörtern</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Max. pro Spalte:</span>
                  <span>{engineStats.activeRules.images.max_images_per_column}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Decisions */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-900">Letzte Layout-Entscheidungen</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {engineStats.recentDecisions.map((decision, index) => (
              <div key={index} className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-slate-900">{decision.articleTitle}</h3>
                    <p className="text-sm text-slate-500">{decision.timestamp}</p>
                  </div>
                  <Badge className={getScoreBadge(decision.score)}>
                    Score: {decision.score}/100
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-slate-600">Variante:</span>
                    <div className="font-medium">{decision.variant.id}</div>
                  </div>
                  <div>
                    <span className="text-slate-600">Schriftgröße:</span>
                    <div className="font-medium">{decision.fontSize}pt</div>
                  </div>
                  <div>
                    <span className="text-slate-600">Spalten:</span>
                    <div className="font-medium">{decision.columnCount}</div>
                  </div>
                  <div>
                    <span className="text-slate-600">Warnungen:</span>
                    <div className="font-medium">{decision.warnings.length}</div>
                  </div>
                </div>

                {decision.warnings.length > 0 && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded">
                    <h4 className="text-sm font-medium text-amber-800 mb-1">Warnungen:</h4>
                    <ul className="text-sm text-amber-700 space-y-1">
                      {decision.warnings.map((warning, i) => (
                        <li key={i}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}

            {engineStats.recentDecisions.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                Noch keine Layout-Entscheidungen vorhanden. Generieren Sie Ihr erstes Magazin in der Render Queue.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
