"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserMenu } from "@/components/admin/UserMenu";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function AdminHeader() {
  return (
    <header className="sticky top-0 z-40 flex h-14 w-full shrink-0 items-center justify-between gap-2 border-b bg-background px-4 shadow-sm">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
      </div>
      
      <div className="flex flex-1 items-center justify-end gap-4 md:justify-between px-4">
        <div className="w-full max-w-sm hidden md:flex items-center relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            className="w-full bg-muted/50 pl-9 md:w-[300px] lg:w-[400px] rounded-full border-muted-foreground/20 focus-visible:ring-primary"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <UserMenu />
      </div>
    </header>
  );
}
