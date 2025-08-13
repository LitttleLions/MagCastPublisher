import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type TemplatePack } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Layers, Eye, Settings, Download } from "lucide-react";

export default function Templates() {
  const { data: packs = [], isLoading } = useQuery<TemplatePack[]>({
    queryKey: ["/api/template-packs"],
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updatePackMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TemplatePack> }) => {
      const response = await apiRequest("PATCH", `/api/template-packs/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/template-packs"] });
      toast({
        title: "Success",
        description: "Template pack updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update template pack",
        variant: "destructive",
      });
    },
  });

  const toggleActive = (pack: TemplatePack) => {
    updatePackMutation.mutate({
      id: pack.id,
      data: { isActive: !pack.isActive }
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="h-8 bg-slate-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-32 bg-slate-200 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">Template Management</h1>
        <p className="text-slate-600">
          Manage layout templates and styling packs for magazine generation
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packs.map((pack) => (
          <Card key={pack.id} className="border border-slate-200 hover:shadow-md transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center">
                    <Layers className="w-4 h-4 text-brand-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900" data-testid={`template-name-${pack.id}`}>
                    {pack.name}
                  </h3>
                </div>
                <Badge 
                  variant={pack.isActive ? "default" : "secondary"}
                  className={pack.isActive ? "bg-green-100 text-green-700 hover:bg-green-100" : ""}
                >
                  {pack.isActive ? "Active" : "Available"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-slate-600 mb-3">{pack.description}</p>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{Array.isArray(pack.variants) ? pack.variants.length : 0} variants</span>
                  <span>{pack.version}</span>
                </div>
              </div>

              {Array.isArray(pack.variants) && pack.variants.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-2">Variants</h4>
                  <div className="space-y-1">
                    {pack.variants.slice(0, 3).map((variant: any, index: number) => (
                      <div key={index} className="text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded">
                        Variant {variant.id}: {variant.columns} col{variant.columns > 1 ? 's' : ''}
                        {variant.hero && ` • Hero: ${variant.hero.min_vh}-${variant.hero.max_vh}vh`}
                      </div>
                    ))}
                    {pack.variants.length > 3 && (
                      <div className="text-xs text-slate-400 px-2">
                        +{pack.variants.length - 3} more variants
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex space-x-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  data-testid={`preview-${pack.id}`}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Preview
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  data-testid={`settings-${pack.id}`}
                >
                  <Settings className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  data-testid={`download-${pack.id}`}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>

              <Button
                onClick={() => toggleActive(pack)}
                disabled={updatePackMutation.isPending}
                className={`w-full ${
                  pack.isActive 
                    ? "bg-red-600 hover:bg-red-700 text-white" 
                    : "bg-brand-600 hover:bg-brand-700 text-white"
                }`}
                data-testid={`toggle-${pack.id}`}
              >
                {pack.isActive ? "Deactivate" : "Activate"}
              </Button>
            </CardContent>
          </Card>
        ))}

        {packs.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Layers className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No Template Packs Found</h3>
            <p className="text-slate-600 mb-4">
              Template packs will appear here once they are created or imported.
            </p>
            <Button>
              <Layers className="w-4 h-4 mr-2" />
              Create Template Pack
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
