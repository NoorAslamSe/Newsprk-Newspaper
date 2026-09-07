"use client";

import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  FileText,
  FolderTree,
  Home,
  Megaphone,
  Image as ImageIcon,
  Users,
  Settings,
  ShieldCheck,
  Key,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import BrandIcon from "../ui/icons/BrandIcon";

const adminNav = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Posts", url: "/dashboard/posts", icon: FileText },
  { title: "Categories", url: "/dashboard/categories", icon: FolderTree },
  { title: "Homepage", url: "/dashboard/homepage", icon: Home },
  { title: "Ads Manager", url: "/dashboard/ads", icon: Megaphone },
  { title: "Media", url: "/dashboard/media", icon: ImageIcon },
  { title: "Users", url: "/dashboard/users", icon: Users },
  { title: "Permissions", url: "/dashboard/settings/permissions", icon: ShieldCheck },
  { title: "API Tokens", url: "/dashboard/settings/api", icon: Key },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

export function AdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const isItemActive = (itemUrl: string) => {
    return pathname === itemUrl;
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="flex h-14 items-center justify-center border-b ">
        <div className="flex w-full items-center gap-2 overflow-hidden px-2">
          <Link href="/dashboard" className="flex items-center gap-2 shrink-0 group-data-[collapsible=icon]:hidden">
            <span
              className="font-black text-2xl tracking-tight"
              style={{ letterSpacing: "-0.03em" }}
            >
              <div className="flex items-center gap-2"><span><BrandIcon className="w-6 h-6 sm:w-7 sm:h-7 shrink-0" /></span>
                <span style={{ color: "var(--g-color)" }}>Trends<span className="text-foreground">Posts</span></span>
              </div>
            </span>
          </Link>
          <Link href="/dashboard" className="hidden items-center justify-center w-full group-data-[collapsible=icon]:flex">
            <BrandIcon className="size-6 shrink-0 text-primary" />
          </Link>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminNav.map((item) => {
                const active = isItemActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                      className="data-[active=true]:font-semibold"
                      style={
                        active
                          ? { backgroundColor: "var(--g-color)", color: "#ffffff" }
                          : undefined
                      }
                    >
                      <Link href={item.url}>
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Back to Site" className="cursor-pointer bg-black hover:bg-primary rounded-md px-2 py-2">
              <Link href="/">
                <span className="truncate group-data-[collapsible=icon]:hidden w-full text-center text-sm text-white cursor-pointer rounded-md px-2 py-2">
                  View Website &rarr;
                </span>
                <span className="hidden group-data-[collapsible=icon]:block text-center text-sm text-white cursor-pointer rounded-md  w-full">
                  &rarr;
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
