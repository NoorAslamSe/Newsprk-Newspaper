import type { Metadata } from "next";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ActiveThemeProvider } from "@/components/active-theme";
import { QueryProvider } from "@/components/providers/query-provider";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/Sidebar";
import { AdminHeader } from "@/components/admin/Header";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { cookies } from "next/headers";
import { AuthProvider } from "@/components/providers/auth-provider";

export const metadata: Metadata = {
  title: {
    default: "Dashboard – Trendsposts",
    template: "%s | Dashboard",
  },
  description: "Trendsposts Dashboard",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const activeThemeValue = cookieStore.get("active_theme")?.value;
  const isScaled = activeThemeValue?.endsWith("-scaled");
  
  const sidebarCookie = cookieStore.get("sidebar_state")?.value;
  const defaultOpen = sidebarCookie === "true" || sidebarCookie === undefined;

  return (
    <div
      dir="ltr"
      className={cn(
        "min-h-screen w-full bg-background font-sans text-foreground antialiased flex",
        activeThemeValue ? `theme-${activeThemeValue}` : "",
        isScaled ? "theme-scaled" : ""
      )}
    >
      <AuthProvider>
        <TooltipProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
            enableColorScheme
          >
            <ActiveThemeProvider initialTheme={activeThemeValue}>
              <QueryProvider>
                <SidebarProvider defaultOpen={defaultOpen}>
                  <AdminSidebar />
                  <SidebarInset className="flex flex-col flex-1 bg-muted/10 h-screen overflow-hidden w-full overflow-x-hidden">
                    <AdminHeader />
                    <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 lg:p-8 w-full">
                      {children}
                    </main>
                  </SidebarInset>
                </SidebarProvider>
                <Toaster />
              </QueryProvider>
            </ActiveThemeProvider>
          </ThemeProvider>
        </TooltipProvider>
      </AuthProvider>
    </div>
  );
}
