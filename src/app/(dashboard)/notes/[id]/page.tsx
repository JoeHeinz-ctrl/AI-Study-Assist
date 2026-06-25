'use client';

import { useQuery } from '@tanstack/react-query';
import { NoteEditor } from '@/components/features/notes/NoteEditor';
import { useParams } from 'next/navigation';

export default function EditNotePage() {
  const params = useParams();
  const id = params.id as string;

  const { data: note, isLoading } = useQuery({
    queryKey: ['note', id],
    queryFn: async () => {
      const res = await fetch(`/api/notes/${id}`);
      if (!res.ok) throw new Error('Failed to fetch note');
      return res.json();
    },
    enabled: !!id
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  if (!note) {
    return <div className="flex items-center justify-center h-full text-destructive">Note not found</div>;
  }

  return (
    <div className="h-[calc(100vh-8rem)]">
      <NoteEditor initialData={note} />
    </div>
  );
}
