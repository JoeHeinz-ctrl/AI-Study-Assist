'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, ChevronLeft, ChevronRight, Shuffle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface FlashcardsTabProps {
  data?: any[]; // Array of flashcard docs inserted to DB
}

export default function FlashcardsTab({ data }: FlashcardsTabProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cards, setCards] = useState<any[]>(data || []);

  // Sync state if new data arrives
  if (data && data !== cards && data.length > 0) {
    setCards(data);
    setCurrentIndex(0);
    setIsFlipped(false);
  }

  if (!cards || cards.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4">
        <Layers className="h-16 w-16 opacity-20" />
        <p>Select notes, enter a topic, and click Generate to create Flashcards.</p>
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  const progress = ((currentIndex + 1) / cards.length) * 100;

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % cards.length);
    }, 150);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
    }, 150);
  };

  const handleShuffle = () => {
    setIsFlipped(false);
    setTimeout(() => {
      const shuffled = [...cards].sort(() => Math.random() - 0.5);
      setCards(shuffled);
      setCurrentIndex(0);
    }, 150);
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'easy': return 'bg-green-500/10 text-green-500 hover:bg-green-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20';
      case 'hard': return 'bg-red-500/10 text-red-500 hover:bg-red-500/20';
      default: return 'bg-primary/10 text-primary';
    }
  };

  return (
    <div className="h-full flex flex-col max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500 pt-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">Study Flashcards</h2>
          <p className="text-sm text-muted-foreground">Card {currentIndex + 1} of {cards.length}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleShuffle}>
            <Shuffle className="h-4 w-4 mr-2" /> Shuffle
          </Button>
        </div>
      </div>

      <Progress value={progress} className="h-2" />

      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
        <div 
          className="relative w-full max-w-2xl aspect-[3/2] cursor-pointer perspective-1000"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <motion.div
            className="w-full h-full relative preserve-3d"
            animate={{ rotateX: isFlipped ? 180 : 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          >
            {/* Front */}
            <div className="absolute inset-0 w-full h-full backface-hidden">
              <div className="w-full h-full bg-card border shadow-lg rounded-2xl p-8 flex flex-col relative overflow-hidden group hover:border-primary/50 transition-colors">
                <div className="absolute top-4 right-4 flex gap-2">
                  <Badge variant="outline" className={getDifficultyColor(currentCard.difficulty)}>
                    {currentCard.difficulty}
                  </Badge>
                </div>
                <div className="absolute top-4 left-4 text-sm text-muted-foreground">
                  {currentCard.topic}
                </div>
                <div className="flex-1 flex items-center justify-center text-center">
                  <h3 className="text-2xl md:text-3xl font-medium leading-relaxed">{currentCard.front}</h3>
                </div>
                <div className="absolute bottom-4 left-0 w-full text-center text-sm text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity">
                  Click to flip
                </div>
              </div>
            </div>

            {/* Back */}
            <div className="absolute inset-0 w-full h-full backface-hidden rotate-x-180">
              <div className="w-full h-full bg-primary text-primary-foreground shadow-lg rounded-2xl p-8 flex flex-col relative overflow-y-auto">
                <div className="flex-1 flex items-center justify-center text-center">
                  <p className="text-xl md:text-2xl leading-relaxed">{currentCard.back}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-6 mt-auto pb-8">
        <Button variant="outline" size="icon" className="h-12 w-12 rounded-full" onClick={handlePrev}>
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-red-500">
          <AlertTriangle className="h-4 w-4 mr-2" /> Mark Difficult
        </Button>
        <Button variant="outline" size="icon" className="h-12 w-12 rounded-full" onClick={handleNext}>
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>
      
      {/* Required custom utility for 3D flip since tailwind doesn't have it built in perfectly */}
      <style dangerouslySetInnerHTML={{__html: `
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-x-180 { transform: rotateX(180deg); }
      `}} />
    </div>
  );
}
