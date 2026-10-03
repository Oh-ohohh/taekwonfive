import { ClipboardCheck, LayoutDashboard, Users } from "lucide-react";

export const NAV_ITEMS = [
  { href: "/", label: "도장 현황", icon: LayoutDashboard },
  { href: "/attendance", label: "출석 체크", icon: ClipboardCheck },
  { href: "/students", label: "수련생 관리", icon: Users },
] as const;
