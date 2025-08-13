import StatsOverview from "@/components/dashboard/stats-overview";
import RecentJobs from "@/components/dashboard/recent-jobs";
import JsonPreview from "@/components/dashboard/json-preview";
import TemplatePacks from "@/components/dashboard/template-packs";
import LayoutEngineStatus from "@/components/dashboard/layout-engine-status";
import SystemHealth from "@/components/dashboard/system-health";

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <StatsOverview />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <RecentJobs />
          <JsonPreview />
        </div>
        
        <div className="space-y-8">
          <TemplatePacks />
          <LayoutEngineStatus />
          <SystemHealth />
        </div>
      </div>
    </div>
  );
}
