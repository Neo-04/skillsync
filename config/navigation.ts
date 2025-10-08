export interface NavigationItem {
  label: string;
  href: string;
}
import { LayoutDashboard, FileText, Users, KanbanSquare, User, FolderKanban, BarChart4, Mail } from "lucide-react";
export const primaryNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "DPR", href: "/dpr", icon: FileText },
  { name: "Employees", href: "/employees", icon: Users },
  { name: "Profile", href: "/profile", icon: User },
  { name: "Projects", href: "/projects", icon: FolderKanban },
  { name: "KPI", href: "/kpi", icon: BarChart4 },
  { name: "APAR", href: "/apar", icon: BarChart4 },
  { name: "Settings", href: "/settings", icon: Mail },
];

