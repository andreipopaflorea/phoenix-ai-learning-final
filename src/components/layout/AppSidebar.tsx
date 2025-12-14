import { useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  FileText, 
  Calendar, 
  Lightbulb, 
  Layers, 
  BarChart3, 
  Settings,
  Flame
} from "lucide-react";
import phoenixLogo from "@/assets/phoenix-logo.png";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Materials", icon: FileText, path: "/materials" },
  { label: "Agenda", icon: Calendar, path: "/agenda" },
  { label: "Plan", icon: Lightbulb, path: "/plan" },
  { label: "Flashcards", icon: Layers, path: "/flashcards" },
  { label: "Progress", icon: BarChart3, path: "/progress" },
  { label: "Settings", icon: Settings, path: "/settings" },
];

const AppSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <aside className="w-64 h-screen bg-card border-r border-border flex flex-col fixed left-0 top-0">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
          <img src={phoenixLogo} alt="Phoenix" className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-lg text-foreground">Phoenix</h1>
          <p className="text-xs text-muted-foreground">Micro-learning</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-2">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <button
                  onClick={() => navigate(item.path)}
                  className={`nav-item w-full ${isActive ? "active" : ""}`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Streak Card */}
      <div className="p-4">
        <div className="bg-secondary rounded-2xl p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
            <Flame className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <p className="text-xl font-bold text-foreground">6 days</p>
            <p className="text-sm text-muted-foreground">Current streak</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;
