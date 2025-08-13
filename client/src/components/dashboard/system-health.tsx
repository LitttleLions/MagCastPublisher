import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface HealthStatus {
  prince: { status: string; message: string };
  assets: { status: string; message: string };
  webhooks: { status: string; message: string };
  queue: { status: string; message: string };
}

export default function SystemHealth() {
  const { data: health, isLoading } = useQuery<HealthStatus>({
    queryKey: ["/api/health"],
  });

  const getStatusIndicator = (status: string) => {
    switch (status) {
      case "online":
        return <div className="w-3 h-3 bg-green-500 rounded-full" />;
      case "delayed":
        return <div className="w-3 h-3 bg-amber-500 rounded-full" />;
      case "offline":
        return <div className="w-3 h-3 bg-red-500 rounded-full" />;
      default:
        return <div className="w-3 h-3 bg-slate-300 rounded-full" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "online":
        return "text-green-600";
      case "delayed":
        return "text-amber-600";
      case "offline":
        return "text-red-600";
      default:
        return "text-slate-500";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 bg-slate-200 rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-6 bg-slate-200 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const services = [
    { name: "Prince Renderer", ...health?.prince },
    { name: "Asset Pipeline", ...health?.assets },
    { name: "Webhook Service", ...health?.webhooks },
    { name: "Queue Manager", ...health?.queue },
  ];

  return (
    <Card data-testid="system-health">
      <CardHeader className="border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900">System Health</h2>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {services.map((service, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getStatusIndicator(service.status || "unknown")}
                <span className="text-sm text-slate-600" data-testid={`service-name-${index}`}>
                  {service.name}
                </span>
              </div>
              <span 
                className={`text-xs font-medium ${getStatusText(service.status || "unknown")}`}
                data-testid={`service-status-${index}`}
              >
                {service.status === "online" ? "Online" : 
                 service.status === "delayed" ? "Delayed" :
                 service.status === "offline" ? "Offline" : "Unknown"}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
