export interface NavigationItem {
  label: string;
  href: string;
}
import { LayoutDashboard, FileText, Users, KanbanSquare, User, FolderKanban, BarChart4, Mail } from "lucide-react";
export const primaryNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "KPI", href: "/kpi", icon: BarChart4 },
  { name: "DPR", href: "/dpr", icon: FileText },
  { name: "Employees", href: "/employees", icon: Users },
  { name: "Projects", href: "/projects", icon: FolderKanban },
  { name: "APAR", href: "/apar", icon: BarChart4 },
  { name: "Profile", href: "/profile", icon: User },
  { name: "Settings", href: "/settings", icon: Mail },
];

