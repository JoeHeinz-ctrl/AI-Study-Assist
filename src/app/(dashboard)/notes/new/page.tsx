import { Suspense } from 'react';
import { NoteEditor } from '@/components/features/notes/NoteEditor';

export default function NewNotePage() {
  return (
    <div className="h-[calc(100vh-8rem)]">
      <Suspense fallback={<div className="flex items-center justify-center h-full text-muted-foreground">Loading Editor...</div>}>
        <NoteEditor />
      </Suspense>
    </div>
  );
}
