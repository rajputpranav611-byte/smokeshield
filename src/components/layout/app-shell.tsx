import { Sidebar } from "./sidebar";
import { TopCommandBar } from "./top-command-bar";
import { MobileNav } from "./mobile-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:pl-[248px] flex flex-col min-h-screen">
        <TopCommandBar />
        <main className="flex-1 pb-16 lg:pb-0">
          <div className="mx-auto max-w-[1600px] p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
