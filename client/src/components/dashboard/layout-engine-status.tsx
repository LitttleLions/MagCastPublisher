import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function LayoutEngineStatus() {
  const engineStatus = [
    { label: "Auto-fitting", status: "enabled", value: "Enabled" },
    { label: "Typography scaling", status: "info", value: "9.5-10.5pt" },
    { label: "Column optimization", status: "info", value: "1-3 cols" },
    { label: "Image focal points", status: "processing", value: "Processing" },
  ];

  const decisionScores = [
    { variant: "Feature A", score: 94, color: "text-green-600" },
    { variant: "Feature B", score: 87, color: "text-green-600" },
    { variant: "Reportage A", score: 76, color: "text-amber-600" },
  ];

  const getStatusBadge = (status: string, value: string) => {
    switch (status) {
      case "enabled":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Enabled</Badge>;
      case "processing":
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Processing</Badge>;
      case "info":
        return <span className="text-xs text-slate-500">{value}</span>;
      default:
        return <span className="text-xs text-slate-500">{value}</span>;
    }
  };

  return (
    <Card data-testid="layout-engine-status">
      <CardHeader className="border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900">Layout Engine Status</h2>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {engineStatus.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm text-slate-600">{item.label}</span>
              {getStatusBadge(item.status, item.value)}
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-slate-200">
          <h3 className="text-sm font-medium text-slate-900 mb-3">Last Decision Scores</h3>
          <div className="space-y-2">
            {decisionScores.map((score, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-slate-600" data-testid={`score-variant-${index}`}>
                  {score.variant}
                </span>
                <span className={`font-medium ${score.color}`} data-testid={`score-value-${index}`}>
                  {score.score}/100
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
