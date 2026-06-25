'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bookmark, Plus, ExternalLink, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function BookmarksPage() {
  const [url, setUrl] = useState('');
  const queryClient = useQueryClient();

  const { data: bookmarks, isLoading } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: async () => {
      const res = await fetch('/api/bookmarks');
      if (!res.ok) throw new Error('Failed to fetch bookmarks');
      return res.json();
    }
  });

  const addBookmarkMutation = useMutation({
    mutationFn: async (newUrl: string) => {
      const res = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newUrl }),
      });
      if (!res.ok) throw new Error('Failed to add bookmark');
      return res.json();
    },
    onSuccess: () => {
      setUrl('');
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      toast.success('Bookmark added successfully');
    },
    onError: () => {
      toast.error('Failed to add bookmark');
    }
  });

  const handleAddBookmark = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    addBookmarkMutation.mutate(url);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bookmarks</h1>
          <p className="text-muted-foreground">Save and organize links with AI summaries.</p>
        </div>
        
        <form onSubmit={handleAddBookmark} className="flex w-full md:w-auto gap-2">
          <Input
            type="url"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full md:w-64 bg-background"
            required
            disabled={addBookmarkMutation.isPending}
          />
          <Button type="submit" disabled={addBookmarkMutation.isPending}>
            {addBookmarkMutation.isPending ? 'Saving...' : <><Plus className="h-4 w-4 mr-2" /> Add</>}
          </Button>
        </form>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="h-48 rounded-xl bg-muted animate-pulse"></div>
          ))
        ) : bookmarks && bookmarks.length > 0 ? (
          bookmarks.map((bookmark: any) => (
            <Card key={bookmark._id} className="overflow-hidden flex flex-col hover:shadow-md transition-shadow">
              {bookmark.previewImageUrl && (
                <div 
                  className="h-32 w-full bg-cover bg-center border-b" 
                  style={{ backgroundImage: `url(${bookmark.previewImageUrl})` }}
                />
              )}
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base line-clamp-2">
                  <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-primary flex items-start gap-2">
                    {bookmark.title}
                    <ExternalLink className="h-3 w-3 inline-block shrink-0 mt-1" />
                  </a>
                </CardTitle>
                <CardDescription className="text-xs">{new URL(bookmark.url).hostname}</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0 flex-1 flex flex-col justify-between">
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                  {bookmark.summary || 'No summary available.'}
                </p>
                <div className="flex flex-wrap gap-1 mt-auto">
                  {bookmark.tags?.slice(0, 3).map((tag: string) => (
                    <span key={tag} className="text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-xl bg-background">
            <Bookmark className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No bookmarks yet</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Paste a URL above to save a link. AI will automatically summarize its content and add relevant tags.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
