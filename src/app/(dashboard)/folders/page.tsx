'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FolderOpen, Plus, FolderPlus } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function FoldersPage() {
  const [newFolderName, setNewFolderName] = useState('');
  const queryClient = useQueryClient();

  const { data: folders, isLoading } = useQuery({
    queryKey: ['folders'],
    queryFn: async () => {
      const res = await fetch('/api/folders');
      if (!res.ok) throw new Error('Failed to fetch folders');
      return res.json();
    }
  });

  const createFolderMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error('Failed to create folder');
      return res.json();
    },
    onSuccess: () => {
      setNewFolderName('');
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      toast.success('Folder created!');
    },
    onError: () => toast.error('Failed to create folder')
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    createFolderMutation.mutate(newFolderName.trim());
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Folders</h1>
          <p className="text-muted-foreground">Organize your notes into folders.</p>
        </div>
        <form onSubmit={handleCreate} className="flex w-full md:w-auto gap-2">
          <Input
            placeholder="New folder name..."
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            className="w-full md:w-52 bg-background"
            disabled={createFolderMutation.isPending}
          />
          <Button type="submit" disabled={createFolderMutation.isPending} className="gap-2 shrink-0">
            <FolderPlus className="h-4 w-4" /> Create
          </Button>
        </form>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          [1,2,3,4].map(i => <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />)
        ) : folders && folders.length > 0 ? (
          folders.map((folder: any) => (
            <Link key={folder._id} href={`/folders/${folder._id}`}>
              <Card className="hover:border-primary/50 cursor-pointer transition-all hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <FolderOpen className="h-8 w-8 text-primary/70" />
                    <CardTitle className="text-base line-clamp-1">{folder.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{folder.noteCount ?? 0} notes</p>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-xl bg-background">
            <FolderOpen className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium">No folders yet</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Create a folder above to start organizing your notes into collections.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
