import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type TemplatePack } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function TemplatePacks() {
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
      <Card>
        <CardHeader>
          <div className="h-6 bg-slate-200 rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 bg-slate-200 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="template-packs">
      <CardHeader className="border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900">Active Templates</h2>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {packs.map((pack) => (
            <div key={pack.id} className="p-4 border border-slate-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-slate-900" data-testid={`pack-name-${pack.id}`}>
                  {pack.name}
                </h3>
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant={pack.isActive ? "default" : "secondary"}
                    className={pack.isActive ? "bg-green-100 text-green-700 hover:bg-green-100" : ""}
                  >
                    {pack.isActive ? "Active" : "Available"}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleActive(pack)}
                    disabled={updatePackMutation.isPending}
                    data-testid={`toggle-pack-${pack.id}`}
                  >
                    {pack.isActive ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-3">{pack.description}</p>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{Array.isArray(pack.variants) ? pack.variants.length : 0} variants</span>
                <span>{pack.version}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
