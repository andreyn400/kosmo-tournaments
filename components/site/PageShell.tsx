import { type ReactNode } from "react";
import { Logo } from "./Logo";
import { SidebarNav } from "./SidebarNav";
import { SidebarMiniCalendar } from "./SidebarMiniCalendar";
import { MobileNav } from "./MobileNav";

type PageShellProps = {
  title: ReactNode;
  action?: ReactNode;
  children: ReactNode;
};

export function PageShell({ title, action, children }: PageShellProps) {
  return (
    <div className="min-h-full flex">
      <aside
        className="hidden md:flex flex-col w-60 border-r border-border bg-surface fixed top-0 left-0 bottom-0 z-30 overflow-y-auto"
        style={{ boxShadow: "2px 0 8px rgba(0,0,0,0.04)" }}
      >
        <div className="h-16 flex items-center px-5 border-b border-border flex-shrink-0">
          <Logo />
        </div>
        <SidebarNav />
        <SidebarMiniCalendar />
        <div className="mt-auto p-4 text-[11px] text-fade tracking-wide flex-shrink-0">
          © Kosmo Padel
        </div>
      </aside>
      <div className="flex-1 md:pl-60 min-w-0">
        <header
          className="h-16 border-b border-border bg-surface sticky top-0 z-20 flex items-center gap-3 px-4 md:px-8"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
        >
          <div className="md:hidden">
            <MobileNav />
          </div>
          <h1 className="text-lg md:text-xl font-semibold text-black flex-1 min-w-0 truncate">
            {title}
          </h1>
          {action ? <div className="flex-shrink-0">{action}</div> : null}
        </header>
        <main className="px-4 md:px-8 py-6 md:py-8 max-w-6xl">{children}</main>
      </div>
    </div>
  );
}
