'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BrainCircuit, PlayCircle, Library } from 'lucide-react';
import { toast } from 'sonner';

export default function StudyPage() {
  const [selectedNoteId, setSelectedNoteId] = useState<string>('');
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const { data: notes, isLoading: isLoadingNotes } = useQuery({
    queryKey: ['notes'],
    queryFn: async () => {
      const res = await fetch('/api/notes');
      if (!res.ok) throw new Error('Failed to fetch notes');
      return res.json();
    }
  });

  const generateFlashcardsMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const res = await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId }),
      });
      if (!res.ok) throw new Error('Failed to generate flashcards');
      return res.json();
    },
    onSuccess: (data) => {
      setFlashcards(data.flashcards || []);
      setCurrentCardIndex(0);
      setIsFlipped(false);
      toast.success(`Generated ${data.flashcards?.length || 0} flashcards!`);
    },
    onError: () => {
      toast.error('Failed to generate flashcards. Please try again.');
    }
  });

  const handleGenerate = () => {
    if (!selectedNoteId) return;
    generateFlashcardsMutation.mutate(selectedNoteId);
  };

  const nextCard = () => {
    setIsFlipped(false);
    setCurrentCardIndex((prev) => Math.min(prev + 1, flashcards.length - 1));
  };

  const prevCard = () => {
    setIsFlipped(false);
    setCurrentCardIndex((prev) => Math.max(prev - 1, 0));
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto flex flex-col h-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Study Mode</h1>
        <p className="text-muted-foreground">Generate flashcards and quizzes directly from your notes using AI.</p>
      </div>

      {!flashcards.length ? (
        <Card className="flex-1 bg-background border-dashed flex flex-col items-center justify-center p-8">
          <Library className="h-16 w-16 text-muted-foreground mb-6 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">Generate Study Materials</h3>
          <p className="text-muted-foreground text-center max-w-md mb-8">
            Select one of your notes to automatically generate a set of flashcards to help you memorize key concepts.
          </p>
          
          <div className="flex w-full max-w-md items-center gap-2">
            <Select value={selectedNoteId} onValueChange={(val) => setSelectedNoteId(val ?? '')}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a note..." />
              </SelectTrigger>
              <SelectContent>
                {isLoadingNotes ? (
                  <SelectItem value="loading" disabled>Loading notes...</SelectItem>
                ) : notes?.length > 0 ? (
                  notes.map((note: any) => (
                    <SelectItem key={note._id} value={note._id}>
                      {note.title}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>No notes found.</SelectItem>
                )}
              </SelectContent>
            </Select>
            <Button 
              onClick={handleGenerate} 
              disabled={!selectedNoteId || generateFlashcardsMutation.isPending}
              className="shrink-0 gap-2"
            >
              {generateFlashcardsMutation.isPending ? 'Generating...' : <><BrainCircuit className="h-4 w-4" /> Generate</>}
            </Button>
          </div>
        </Card>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center space-y-8">
          <div className="flex justify-between w-full max-w-2xl items-center px-4">
            <span className="text-sm font-medium">Card {currentCardIndex + 1} of {flashcards.length}</span>
            <Button variant="ghost" size="sm" onClick={() => setFlashcards([])}>
              Exit Study Mode
            </Button>
          </div>

          <div 
            className="w-full max-w-2xl aspect-[3/2] perspective-1000 cursor-pointer"
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <div className={`relative w-full h-full transition-transform duration-500 transform-style-preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
              {/* Front of card */}
              <Card className="absolute w-full h-full backface-hidden flex flex-col items-center justify-center p-8 text-center bg-card shadow-lg hover:shadow-xl transition-shadow">
                <span className="absolute top-4 left-4 text-xs font-semibold text-muted-foreground uppercase tracking-widest">Question</span>
                <p className="text-2xl font-medium">{flashcards[currentCardIndex].front}</p>
                <div className="absolute bottom-4 flex items-center gap-2 text-xs text-muted-foreground">
                  Click to flip <PlayCircle className="h-3 w-3" />
                </div>
              </Card>

              {/* Back of card */}
              <Card className="absolute w-full h-full backface-hidden rotate-y-180 flex flex-col items-center justify-center p-8 text-center bg-primary text-primary-foreground shadow-lg">
                <span className="absolute top-4 left-4 text-xs font-semibold text-primary-foreground/70 uppercase tracking-widest">Answer</span>
                <p className="text-2xl font-medium">{flashcards[currentCardIndex].back}</p>
              </Card>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={prevCard} disabled={currentCardIndex === 0}>
              Previous
            </Button>
            <Button variant="outline" onClick={nextCard} disabled={currentCardIndex === flashcards.length - 1}>
              Next Card
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
