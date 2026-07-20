'use client';

import { useState, useEffect, useRef } from 'react';
import { UserButton } from '@clerk/nextjs';
import { Search, Menu, BrainCircuit, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useDebounce } from '@/hooks/use-debounce';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { setTheme, theme } = useTheme();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
  const debouncedQuery = useDebounce(query, 500);

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery) return [];
      const res = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`);
      if (!res.ok) throw new Error('Search failed');
      return res.json();
    },
    enabled: !!debouncedQuery && isFocused,
  });

  // Handle clicking outside to close search results
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      {/* Main Header */}
      <header className="flex h-14 items-center gap-2 sm:gap-4 border-b bg-background px-3 sm:px-4 lg:h-[60px] lg:px-6 relative z-10">
        {/* Mobile Menu Button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden h-9 w-9 touch-manipulation"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
        
        {/* Desktop Search */}
        <div className="hidden sm:flex w-full flex-1">
          <div className="relative max-w-md w-full" ref={searchRef}>
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Semantic search notes..."
              className="w-full appearance-none bg-background pl-8 shadow-none h-9"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
            />
            
            {isFocused && query && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-background border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                <div className="p-2 border-b bg-muted/30 flex items-center gap-2 text-xs text-muted-foreground">
                  <BrainCircuit className="h-3 w-3" />
                  AI Semantic Search
                </div>
                {isLoading ? (
                  <div className="p-4 text-sm text-center text-muted-foreground">Searching your brain...</div>
                ) : searchResults?.length > 0 ? (
                  <div className="p-2 flex flex-col gap-1">
                    {searchResults.map((result: { _id: string, title: string, type: string, snippet?: string, summary?: string, content?: string }) => (
                      <Link 
                        key={result._id} 
                        href={`/notes/${result._id}`}
                        className="p-2 rounded-md hover:bg-muted transition-colors block"
                        onClick={() => setIsFocused(false)}
                      >
                        <div className="font-medium text-sm line-clamp-1">{result.title}</div>
                        <div className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {result.snippet || result.summary || result.content?.substring(0, 150) || 'No preview available.'}
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-sm text-center text-muted-foreground">No semantically relevant notes found.</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Search Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="sm:hidden h-9 w-9 touch-manipulation"
          onClick={() => setShowMobileSearch(!showMobileSearch)}
        >
          {showMobileSearch ? (
            <X className="h-5 w-5" />
          ) : (
            <Search className="h-5 w-5" />
          )}
          <span className="sr-only">Toggle search</span>
        </Button>
        
        <div className="flex items-center gap-2 sm:gap-4 ml-auto">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 touch-manipulation"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
          <div className="[&_button]:h-8 [&_button]:w-8 md:[&_button]:h-9 md:[&_button]:w-9">
            <UserButton />
          </div>
        </div>
      </header>

      {/* Mobile Search Bar */}
      {showMobileSearch && (
        <div className="sm:hidden border-b bg-background px-3 py-2">
          <div className="relative" ref={searchRef}>
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Semantic search notes..."
              className="w-full appearance-none bg-background pl-8 shadow-none h-10"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              autoFocus
            />
            
            {isFocused && query && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-background border rounded-lg shadow-lg z-50 max-h-[50vh] overflow-y-auto">
                <div className="p-2 border-b bg-muted/30 flex items-center gap-2 text-xs text-muted-foreground">
                  <BrainCircuit className="h-3 w-3" />
                  AI Semantic Search
                </div>
                {isLoading ? (
                  <div className="p-4 text-sm text-center text-muted-foreground">Searching...</div>
                ) : searchResults?.length > 0 ? (
                  <div className="p-2 flex flex-col gap-1">
                    {searchResults.map((result: { _id: string, title: string, type: string, snippet?: string, summary?: string, content?: string }) => (
                      <Link 
                        key={result._id} 
                        href={`/notes/${result._id}`}
                        className="p-3 rounded-md hover:bg-muted active:bg-muted transition-colors block touch-manipulation"
                        onClick={() => {
                          setIsFocused(false);
                          setShowMobileSearch(false);
                        }}
                      >
                        <div className="font-medium text-sm line-clamp-1">{result.title}</div>
                        <div className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {result.snippet || result.summary || result.content?.substring(0, 150) || 'No preview available.'}
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-sm text-center text-muted-foreground">No results found.</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
