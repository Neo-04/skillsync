export interface NavigationItem {
  label: string;
  href: string;
}

export const primaryNavigation: NavigationItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Employees", href: "/employees" },
  { label: "Projects", href: "/projects" },
  { label: "AI Tools", href: "/ai" },
  { label: "Profile", href: "/profile" },
  { label: "Settings", href: "/settings" },
];
