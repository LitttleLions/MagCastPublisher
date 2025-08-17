import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  LayoutGrid,
  Upload,
  Layers,
  Settings,
  BarChart3,
  Images,
  FileText
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutGrid },
  { name: "Datenverwaltung", href: "/json-ingestion", icon: Upload },
  { name: "Templates", href: "/templates", icon: Layers },
  { name: "Layout Engine", href: "/layout-engine", icon: Settings },
  { name: "Render Queue", href: "/render-queue", icon: BarChart3 },
  { name: "Assets", href: "/assets", icon: Images },
  { name: "Publications", href: "/publications", icon: FileText },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="w-64 bg-white border-r border-slate-200 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-semibold text-slate-900">MagCast</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {navigation.map((item, index) => (
          <Link
            key={index}
            href={item.href}
            className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
              location === item.href
                ? "bg-slate-100 text-slate-900"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <item.icon className="mr-3 h-5 w-5" />
            {item.name}
          </Link>
        ))}
        </div>

        {/* Recent Issues */}
        <div className="mt-8">
          <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
            Recent Issues
          </h3>
          <div className="space-y-2">
            <div className="px-3 py-2 bg-green-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-900">Stadt & Meer</span>
                <span className="text-xs text-green-600">Ready</span>
              </div>
              <div className="text-xs text-slate-500">2025-09-01</div>
            </div>
            <div className="px-3 py-2 bg-amber-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-900">Tech Today</span>
                <span className="text-xs text-amber-600">Processing</span>
              </div>
              <div className="text-xs text-slate-500">2025-08-28</div>
            </div>
          </div>
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-slate-300 rounded-full" />
          <div>
            <div className="text-sm font-medium text-slate-900">Sarah Chen</div>
            <div className="text-xs text-slate-500">Editor</div>
          </div>
        </div>
      </div>
    </div>
  );
}