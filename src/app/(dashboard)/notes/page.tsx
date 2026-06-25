'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import Link from 'next/link';
import { Plus, Search, Trash2, Loader2, StickyNote } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function NotesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: notes, isLoading } = useQuery({
    queryKey: ['notes'],
    queryFn: async () => {
      const res = await fetch('/api/notes');
      if (!res.ok) throw new Error('Failed to fetch notes');
      return res.json();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const res = await fetch(`/api/notes/${noteId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete note');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast.success('Note deleted successfully.');
      setDeletingId(null);
    },
    onError: () => {
      toast.error('Failed to delete note. Please try again.');
      setDeletingId(null);
    }
  });

  const handleDelete = (e: React.MouseEvent, noteId: string, noteTitle: string) => {
    e.preventDefault(); // prevent navigating to the note
    e.stopPropagation();
    if (!confirm(`Delete "${noteTitle}"?\n\nThis action cannot be undone.`)) return;
    setDeletingId(noteId);
    deleteMutation.mutate(noteId);
  };

  // Local filter by search term
  const filteredNotes = notes?.filter((note: any) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      note.title?.toLowerCase().includes(q) ||
      note.content?.toLowerCase().includes(q) ||
      note.summary?.toLowerCase().includes(q) ||
      note.tags?.some((t: string) => t.toLowerCase().includes(q))
    );
  }) ?? [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto h-full flex flex-col">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Notes</h1>
        <Link href="/notes/new" className={buttonVariants({ variant: 'default', className: 'gap-2' })}>
          <Plus className="h-4 w-4" /> New Note
        </Link>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Filter notes..."
            className="pl-8 bg-background"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {notes && (
          <span className="text-sm text-muted-foreground">
            {filteredNotes.length} of {notes.length} note{notes.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : filteredNotes.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredNotes.map((note: any) => (
              <div key={note._id} className="relative group">
                <Link href={`/notes/${note._id}`}>
                  <Card className="hover:border-primary/50 cursor-pointer transition-all hover:shadow-md h-full flex flex-col">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-lg line-clamp-1 pr-8">{note.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 flex-1 flex flex-col">
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">
                        {note.summary || note.content?.substring(0, 120) || 'No content yet.'}
                      </p>
                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(note.updatedAt), 'MMM d, yyyy')}
                        </span>
                        {note.tags && note.tags.length > 0 && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-md">
                            {note.tags[0]}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                {/* Delete button — visible on hover */}
                <button
                  onClick={(e) => handleDelete(e, note._id, note.title)}
                  disabled={deletingId === note._id}
                  className="absolute top-3 right-3 p-1.5 rounded-lg bg-background/80 dark:bg-zinc-900/80 backdrop-blur-sm border border-border/80 text-muted-foreground hover:text-destructive hover:border-destructive/50 hover:bg-destructive/5 transition-all duration-150 opacity-0 group-hover:opacity-100 shadow-sm z-10"
                  title="Delete note"
                >
                  {deletingId === note._id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            ))}
          </div>
        ) : notes?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-background rounded-xl border border-dashed">
            <StickyNote className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium">No notes yet</h3>
            <p className="text-muted-foreground mb-4">Create your first note to start organizing your thoughts.</p>
            <Link href="/notes/new" className={buttonVariants({ variant: 'default' })}>Create Note</Link>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-background rounded-xl border border-dashed">
            <Search className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium">No notes match "{searchTerm}"</h3>
            <p className="text-muted-foreground mb-4">Try a different search term.</p>
            <Button variant="outline" onClick={() => setSearchTerm('')}>Clear Filter</Button>
          </div>
        )}
      </div>
    </div>
  );
}
