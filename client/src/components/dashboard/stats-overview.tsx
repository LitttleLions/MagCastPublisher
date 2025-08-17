import { Card, CardContent } from "@/components/ui/card";
import { FileText, Settings, FileImage, Layers } from "lucide-react";
import { useState, useEffect } from "react";

interface Stats {
  activeIssues: number;
  renderJobs: number;
  pdfsGenerated: number;
  templatePacks: number;
  queuedJobs: number;
}

export default function StatsOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
      setStats(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-slate-200 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statItems = [
    {
      title: "Active Issues",
      value: stats?.activeIssues || 0,
      icon: FileText,
      change: "+8%",
      changeLabel: "from last month",
      isPositive: true,
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      title: "Render Jobs",
      value: stats?.renderJobs || 0,
      icon: Settings,
      changeLabel: `${stats?.queuedJobs || 0} in queue`,
      bgColor: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      title: "PDF Generated",
      value: stats?.pdfsGenerated || 0,
      icon: FileImage,
      change: "+15%",
      changeLabel: "this week",
      isPositive: true,
      bgColor: "bg-purple-100",
      iconColor: "text-purple-600",
    },
    {
      title: "Template Packs",
      value: stats?.templatePacks || 0,
      icon: Layers,
      changeLabel: "2 Modern, 3 Classic",
      bgColor: "bg-amber-100",
      iconColor: "text-amber-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6" data-testid="stats-overview">
      {statItems.map((item, index) => {
        const Icon = item.icon;
        return (
          <Card key={index} className="border border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">{item.title}</p>
                  <p 
                    className="text-2xl font-semibold text-slate-900 mt-1"
                    data-testid={`stat-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {item.value}
                  </p>
                </div>
                <div className={`w-10 h-10 ${item.bgColor} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${item.iconColor}`} />
                </div>
              </div>
              <div className="flex items-center mt-4">
                {item.change && (
                  <>
                    <span className={`text-xs font-medium ${item.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                      {item.change}
                    </span>
                    <span className="text-xs text-slate-500 ml-1">{item.changeLabel}</span>
                  </>
                )}
                {!item.change && (
                  <span className="text-xs text-slate-600">{item.changeLabel}</span>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
