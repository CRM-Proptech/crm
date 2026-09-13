import Link from "next/link";
import {
  Building2,
  CalendarCheck,
  GitBranch,
  LayoutDashboard,
  Sparkles,
  UserRound,
  Users,
  UsersRound,
} from "lucide-react";
import type { SessionUser } from "@/lib/session";
import { canManageTeam } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/constants";
import { signOut } from "@/actions/auth";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: UserRound },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/pipeline", label: "Pipeline", icon: GitBranch },
  { href: "/inventory", label: "Inventory", icon: Building2 },
  { href: "/matches", label: "Matches", icon: Sparkles },
  { href: "/visits", label: "Site visits", icon: CalendarCheck },
];

export function AppShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const nav = (
    <>
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            className="flex min-h-10 shrink-0 items-center gap-2 rounded-md px-2 text-sm text-sidebar-foreground/90 transition-colors duration-150 hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Icon className="size-4" aria-hidden="true" />
            {link.label}
          </Link>
        );
      })}
      {canManageTeam(user.role) ? (
        <Link
          href="/users"
          className="flex min-h-10 shrink-0 items-center gap-2 rounded-md px-2 text-sm text-sidebar-foreground/90 transition-colors duration-150 hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <UsersRound className="size-4" aria-hidden="true" />
          Team
        </Link>
      ) : null}
    </>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="bg-sidebar text-sidebar-foreground">
        <div className="flex flex-col gap-4 px-4 py-4 lg:h-full lg:py-5">
          <div className="flex items-center justify-between gap-4">
            <Link href="/dashboard" className="px-1">
              <p className="font-serif text-2xl tracking-tight">Keystone</p>
              <p className="hidden text-xs text-sidebar-muted lg:block">Property-native CRM</p>
            </Link>
            <form action={signOut} className="lg:hidden">
              <Button type="submit" variant="ghost" className="h-10 text-sidebar-foreground hover:bg-sidebar-accent">
                Sign out
              </Button>
            </form>
          </div>
          <nav className="-mx-2 flex gap-1 overflow-x-auto pb-1 lg:mx-0 lg:flex-1 lg:flex-col" aria-label="Main">
            {nav}
          </nav>
          <div className="hidden border-t border-white/10 pt-4 lg:block">
            <p className="px-2 text-sm font-medium">{user.name}</p>
            <p className="px-2 text-xs text-sidebar-muted">{ROLE_LABELS[user.role]}</p>
            <form action={signOut} className="mt-3 px-2">
              <Button type="submit" variant="ghost" className="h-9 px-0 text-sidebar-foreground hover:bg-sidebar-accent">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </aside>
      <div className="min-w-0">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 lg:px-8 lg:py-8">{children}</div>
      </div>
    </div>
  );
}
