'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  StickyNote,
  FolderOpen,
  Bookmark,
  MessageCircle,
  Settings, 
  PenTool,
  X
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';

const navItems = [
  { name: 'Notes', href: '/notes', icon: StickyNote },
  { name: 'Folders', href: '/folders', icon: FolderOpen },
  { name: 'Bookmarks', href: '/bookmarks', icon: Bookmark },
  { name: 'AI Chat', href: '/chat', icon: MessageCircle },
  { name: 'Settings', href: '/settings', icon: Settings },
];

interface SidebarProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Sidebar({ open, onOpenChange }: SidebarProps) {
  const pathname = usePathname();

  const sidebarContent = (
    <>
      <div className="flex h-14 items-center justify-between border-b px-4 lg:h-[60px] lg:px-6">
        <Link href="/notes" className="flex items-center gap-2 font-semibold">
          <StickyNote className="h-6 w-6 text-primary" />
          <span className="text-lg">MindVault</span>
        </Link>
        {onOpenChange && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden h-8 w-8 touch-manipulation"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4 gap-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onOpenChange && onOpenChange(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-3 md:py-2 transition-all hover:text-primary touch-manipulation",
                  isActive ? "bg-muted text-primary font-medium" : "text-muted-foreground"
                )}
              >
                <item.icon className="h-5 w-5 md:h-4 md:w-4" />
                <span className="text-base md:text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="mt-auto p-4 border-t">
        <Link 
          href="/notes/new" 
          onClick={() => onOpenChange && onOpenChange(false)}
          className={cn(
            buttonVariants({ variant: 'default' }), 
            "w-full justify-start gap-2 h-11 md:h-10 text-base md:text-sm touch-manipulation"
          )}
        >
          <PenTool className="h-5 w-5 md:h-4 md:w-4" />
          New Note
        </Link>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-background">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar */}
      {open !== undefined && onOpenChange && (
        <Sheet open={open} onOpenChange={onOpenChange}>
          <SheetContent side="left" className="w-[280px] sm:w-[320px] p-0 flex flex-col">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            {sidebarContent}
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}
