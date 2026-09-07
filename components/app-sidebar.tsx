"use client"

import * as React from "react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  CommandIcon,
  LayoutDashboardIcon,
  FileTextIcon,
  TagsIcon,
  MegaphoneIcon,
  ImageIcon,
  UsersIcon,
  Settings2Icon,
} from "lucide-react"
import Link from "next/link"

const data = {
  user: {
    name: "Trendsposts",
    email: "contact@Trendsposts.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: <LayoutDashboardIcon />,
    },
    {
      title: "Posts",
      url: "/dashboard/posts",
      icon: <FileTextIcon />,
    },
    {
      title: "Categories",
      url: "/dashboard/categories",
      icon: <TagsIcon />,
    },
    {
      title: "Ads Manager",
      url: "/dashboard/ads",
      icon: <MegaphoneIcon />,
    },
    {
      title: "Media",
      url: "/dashboard/media",
      icon: <ImageIcon />,
    },
    {
      title: "Users",
      url: "/dashboard/users",
      icon: <UsersIcon />,
    },
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: <Settings2Icon />,
    },
  ],
  navSecondary: [
    // reserved for future secondary items
  ],
  documents: [
    // reserved for future shortcuts
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <Link href="/" className="flex items-center gap-2 shrink-0">
                <span
                  className="font-black text-2xl tracking-tight"
                  style={{ color: "var(--g-color)", letterSpacing: "-0.03em" }}
                >
                  Trends<span style={{ color: "var(--heading-color)" }}>Posts</span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        {data.navSecondary.length ? (
          <NavSecondary items={data.navSecondary} className="mt-auto" />
        ) : null}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
