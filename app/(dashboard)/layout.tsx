import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { PageTransition } from "@/components/dashboard/page-transition";
import { FloatingTimer } from "@/components/dashboard/floating-timer";
import { CommandPalette } from "@/components/dashboard/command-palette";
import { getRunningTimeEntry } from "@/lib/actions/time-entries";
import type { Project } from "@/types/database.types";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await verifySession();
  const supabase = await createClient();

  const [runningEntry, { data: projects }] = await Promise.all([
    getRunningTimeEntry().catch(() => null),
    supabase.from("projects").select("*").eq("status", "active").order("name"),
  ]);

  return (
    <SidebarProvider>
      <AppSidebar email={session.email} />
      <SidebarInset>
        <Topbar />
        <main className="flex-1 p-4 md:p-6">
          <PageTransition>{children}</PageTransition>
        </main>
        <FloatingTimer
          initialEntry={
            runningEntry
              ? {
                  id: runningEntry.id,
                  projectId: runningEntry.projectId,
                  projectName: runningEntry.projectName,
                  startedAt: runningEntry.startedAt,
                  description: runningEntry.description,
                }
              : null
          }
          projects={(projects ?? []) as Project[]}
        />
        <CommandPalette />
      </SidebarInset>
    </SidebarProvider>
  );
}
