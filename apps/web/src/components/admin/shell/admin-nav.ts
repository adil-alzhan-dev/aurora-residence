import type { ComponentType, SVGProps } from "react";

import { DashboardIcon, EnquiriesIcon, ResidencesIcon } from "@/components/admin/admin-icons";
import type { AdminDictionary } from "@/content/en-admin";
import { ADMIN_HOME, adminHref } from "@/lib/admin/paths";

type NavKey = keyof Pick<AdminDictionary["nav"], "dashboard" | "residences" | "enquiries">;

type NavItem = {
  key: NavKey;
  href: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
};

export const adminNavItems: NavItem[] = [
  { key: "dashboard", href: adminHref.dashboard, Icon: DashboardIcon },
  { key: "residences", href: adminHref.residences, Icon: ResidencesIcon },
  { key: "enquiries", href: adminHref.enquiries, Icon: EnquiriesIcon },
];

export function isNavActive(href: string, pathname: string) {
  return href === ADMIN_HOME ? pathname === ADMIN_HOME : pathname === href || pathname.startsWith(`${href}/`);
}

export function activeNavKey(pathname: string): NavKey {
  return adminNavItems.find((item) => isNavActive(item.href, pathname))?.key ?? "dashboard";
}
