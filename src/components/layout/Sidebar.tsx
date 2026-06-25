'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  BookOpen, 
  LayoutDashboard, 
  Library, 
  Settings, 
  PenTool, 
  BrainCircuit, 
  Bookmark,
  FolderOpen
} from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Notes', href: '/notes', icon: BookOpen },
  { name: 'Folders', href: '/folders', icon: FolderOpen },
  { name: 'Bookmarks', href: '/bookmarks', icon: Bookmark },
  { name: 'AI Chat', href: '/chat', icon: BrainCircuit },
  { name: 'Study', href: '/study', icon: Library },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 flex-col border-r bg-background md:flex">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <BrainCircuit className="h-6 w-6 text-primary" />
          <span className="text-lg">MindVault</span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4 gap-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                  isActive ? "bg-muted text-primary" : "text-muted-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="mt-auto p-4 border-t">
        <Link href="/notes/new" className={cn(buttonVariants({ variant: 'outline' }), "w-full justify-start gap-2")}>
          <PenTool className="h-4 w-4" />
          New Note
        </Link>
      </div>
    </aside>
  );
}
