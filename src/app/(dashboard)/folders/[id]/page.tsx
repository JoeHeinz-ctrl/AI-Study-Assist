'use client';

import { useState, use } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import Link from 'next/link';
import { Plus, Trash2, Loader2, StickyNote, Folder, ArrowLeft, Search, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

interface FolderDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function FolderDetailPage({ params }: FolderDetailPageProps) {
  const { id: folderId } = use(params);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const queryClient = useQueryClient();

  // Fetch folder details and its notes
  const { data, isLoading, error } = useQuery({
    queryKey: ['folder', folderId],
    queryFn: async () => {
      const res = await fetch(`/api/folders/${folderId}`);
      if (!res.ok) {
        if (res.status === 404) {
          toast.error('Folder not found');
          router.push('/folders');
        }
        throw new Error('Failed to fetch folder details');
      }
      return res.json();
    },
    enabled: !!folderId && folderId !== 'undefined',
  });

  // Delete folder mutation
  const deleteFolderMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/folders/${folderId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete folder');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      toast.success('Folder deleted. Notes have been moved to Uncategorized.');
      router.push('/folders');
    },
    onError: () => {
      toast.error('Failed to delete folder. Please try again.');
    }
  });

  // Delete a specific note mutation (reusable from notes page)
  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const res = await fetch(`/api/notes/${noteId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete note');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folder', folderId] });
      toast.success('Note deleted.');
    },
    onError: () => {
      toast.error('Failed to delete note. Please try again.');
    }
  });

  const handleDeleteFolder = () => {
    if (
      !confirm(
        `Delete folder "${data?.folder?.name}"?\n\nYour notes will NOT be deleted. They will become uncategorized.`
      )
    ) {
      return;
    }
    deleteFolderMutation.mutate();
  };

  const handleDeleteNote = (e: React.MouseEvent, noteId: string, noteTitle: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Delete "${noteTitle}"?\n\nThis action cannot be undone.`)) return;
    deleteNoteMutation.mutate(noteId);
  };

  const folder = data?.folder;
  const notes = data?.notes || [];

  // Filter notes locally
  const filteredNotes = notes.filter((note: any) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      note.title?.toLowerCase().includes(q) ||
      note.content?.toLowerCase().includes(q) ||
      note.summary?.toLowerCase().includes(q) ||
      note.tags?.some((t: string) => t.toLowerCase().includes(q))
    );
  });

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center gap-4">
        <p className="text-destructive font-medium">Error loading folder details.</p>
        <Link href="/folders" className={buttonVariants({ variant: 'outline' })}>
          Back to Folders
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto h-full flex flex-col font-sans">
      {/* Navigation & Actions Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/folders"
            className="p-2 rounded-lg border hover:bg-muted/50 transition-colors"
            title="Back to Folders"
          >
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">
              <span>Folders</span>
              <span>/</span>
              <span>{isLoading ? 'Loading...' : folder?.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <Folder className="h-7 w-7 text-primary/70 shrink-0" />
              <h1 className="text-3xl font-extrabold tracking-tight select-text">
                {isLoading ? <div className="h-8 w-40 bg-muted animate-pulse rounded" /> : folder?.name}
              </h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isLoading && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeleteFolder}
              disabled={deleteFolderMutation.isPending}
              className="gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg h-9 font-semibold"
            >
              {deleteFolderMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete Folder
            </Button>
          )}

          <Link
            href={`/notes/new?folderId=${folderId}`}
            className={buttonVariants({ variant: 'default', size: 'sm', className: 'gap-2 rounded-lg h-9 font-semibold shadow-sm' })}
          >
            <Plus className="h-4 w-4" /> New Note
          </Link>
        </div>
      </div>

      {/* Search Filter Strip */}
      {!isLoading && notes.length > 0 && (
        <div className="flex items-center space-x-2 select-none">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search notes in this folder..."
              className="pl-8 bg-background rounded-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <span className="text-xs text-muted-foreground font-medium">
            {filteredNotes.length} of {notes.length} note{notes.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Folder Notes Grid */}
      <div className="flex-1 overflow-y-auto pr-1">
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 rounded-xl bg-muted/50 animate-pulse border border-border/60" />
            ))}
          </div>
        ) : filteredNotes.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredNotes.map((note: any) => (
              <motion.div
                key={note._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="relative group"
              >
                <Link href={`/notes/${note._id}`}>
                  <Card className="hover:border-primary/50 cursor-pointer transition-all hover:shadow-md h-full flex flex-col rounded-xl bg-card border-border/80 relative overflow-hidden">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-base font-bold line-clamp-1 pr-8 leading-tight">
                        {note.title || 'Untitled Note'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 flex-1 flex flex-col">
                      <p className="text-xs text-muted-foreground line-clamp-3 mb-4 flex-1 leading-relaxed">
                        {note.summary || note.content?.substring(0, 120) || 'No content yet.'}
                      </p>
                      <div className="flex items-center justify-between mt-auto text-[10px] text-muted-foreground font-medium">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(note.updatedAt), 'MMM d, yyyy')}
                        </span>
                        {note.tags && note.tags.length > 0 && (
                          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">
                            {note.tags[0]}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                {/* Delete note button */}
                <button
                  onClick={(e) => handleDeleteNote(e, note._id, note.title)}
                  disabled={deleteNoteMutation.isPending}
                  className="absolute top-3.5 right-3.5 p-1.5 rounded-lg bg-background/80 dark:bg-zinc-900/80 backdrop-blur-sm border border-border/80 text-muted-foreground hover:text-destructive hover:border-destructive/50 hover:bg-destructive/5 transition-all duration-150 opacity-0 group-hover:opacity-100 shadow-sm z-10"
                  title="Delete note"
                >
                  {deleteNoteMutation.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3" />
                  )}
                </button>
              </motion.div>
            ))}
          </div>
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[40vh] p-8 text-center bg-background rounded-xl border border-dashed select-none">
            <StickyNote className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-bold tracking-tight">No notes in this folder</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-5 mt-1 leading-normal">
              Create a note inside this folder to start organizing your thoughts.
            </p>
            <Link
              href={`/notes/new?folderId=${folderId}`}
              className={buttonVariants({ variant: 'default', className: 'rounded-lg font-semibold px-5' })}
            >
              Create Note
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[40vh] p-8 text-center bg-background rounded-xl border border-dashed select-none">
            <Search className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-bold tracking-tight">No notes match "{searchTerm}"</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-5 mt-1 leading-normal">
              Try modifying your search filter to find the note.
            </p>
            <Button variant="outline" onClick={() => setSearchTerm('')} className="rounded-lg font-semibold">
              Clear Filter
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
