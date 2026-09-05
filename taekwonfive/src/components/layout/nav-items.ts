import { ClipboardCheck, LayoutDashboard, Users } from "lucide-react";

export const NAV_ITEMS = [
  { href: "/", label: "대시보드", icon: LayoutDashboard },
  { href: "/students", label: "학생관리", icon: Users },
  { href: "/attendance", label: "출석체크", icon: ClipboardCheck },
] as const;
