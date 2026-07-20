'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Brain, 
  Search, 
  BookOpen, 
  Layers, 
  HelpCircle, 
  TrendingUp, 
  FileText,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

// Placeholder components for tabs
import StudyMaterialTab from '@/components/features/study-hub/StudyMaterialTab';
import FlashcardsTab from '@/components/features/study-hub/FlashcardsTab';
import QuizTab from '@/components/features/study-hub/QuizTab';
import PredictionsTab from '@/components/features/study-hub/PredictionsTab';
import RevisionSheetTab from '@/components/features/study-hub/RevisionSheetTab';

type Note = {
  _id: string;
  title: string;
  updatedAt: string;
};

export default function StudyHubPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
  const [topic, setTopic] = useState('');
  const [activeTab, setActiveTab] = useState('study_material');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  
  const [generatedData, setGeneratedData] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const res = await fetch('/api/notes');
      if (res.ok) {
        const data = await res.json();
        setNotes(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedNotes(filteredNotes.map(n => n._id));
    } else {
      setSelectedNotes([]);
    }
  };

  const handleNoteToggle = (noteId: string, checked: boolean) => {
    if (checked) {
      setSelectedNotes([...selectedNotes, noteId]);
    } else {
      setSelectedNotes(selectedNotes.filter(id => id !== noteId));
    }
  };

  const handleGenerate = async () => {
    if (selectedNotes.length === 0) {
      toast.error('Please select at least one note');
      return;
    }
    if (!topic) {
      toast.error('Please enter a topic to generate materials for');
      return;
    }

    setIsGenerating(true);
    setGenerationStep('Generating Embeddings...');
    
    // Simulate some steps before real generation to match the UX requirement
    setTimeout(() => setGenerationStep('Retrieving Context...'), 1500);
    setTimeout(() => setGenerationStep(`Creating ${activeTab.replace('_', ' ')}...`), 3000);

    try {
      const res = await fetch('/api/study-hub/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteIds: selectedNotes,
          topic,
          type: activeTab
        })
      });

      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Generation failed');

      setGeneratedData(prev => ({
        ...prev,
        [activeTab]: data.result
      }));

      toast.success('Generated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate');
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex items-center justify-between pb-4 border-b">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            Study Hub
          </h1>
          <p className="text-muted-foreground">
            Transform your notes into personalized learning materials using AI.
          </p>
        </div>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden min-h-0">
        {/* Left Panel */}
        <div className="w-80 flex flex-col border rounded-xl bg-card overflow-hidden">
          <div className="p-4 border-b space-y-4">
            <h2 className="font-semibold text-lg">Knowledge Base</h2>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Topic</label>
              <Input 
                placeholder="e.g. React Hooks, History of Rome" 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>

            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notes..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="select-all" 
                checked={selectedNotes.length === filteredNotes.length && filteredNotes.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                Select All ({selectedNotes.length}/{filteredNotes.length})
              </label>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredNotes.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No notes found.
              </div>
            ) : (
              filteredNotes.map(note => (
                <div key={note._id} className="flex items-start space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <Checkbox 
                    id={note._id}
                    checked={selectedNotes.includes(note._id)}
                    onCheckedChange={(c) => handleNoteToggle(note._id, c as boolean)}
                    className="mt-1"
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor={note._id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {note.title}
                    </label>
                    <p className="text-xs text-muted-foreground">
                      {new Date(note.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t bg-muted/20">
            <Button 
              className="w-full relative overflow-hidden group" 
              onClick={handleGenerate}
              disabled={isGenerating || selectedNotes.length === 0 || !topic}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Brain className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
                  Generate Material
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Main Area */}
        <div className="flex-1 flex flex-col min-w-0 border rounded-xl bg-card overflow-hidden relative">
          
          <AnimatePresence>
            {isGenerating && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center"
              >
                <div className="relative">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Brain className="h-6 w-6 text-primary animate-pulse" />
                  </div>
                </div>
                <motion.p 
                  key={generationStep}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 text-lg font-medium text-foreground"
                >
                  {generationStep}
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
            <div className="px-4 pt-4 border-b">
              <TabsList className="w-full justify-start overflow-x-auto">
                <TabsTrigger value="study_material" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" /> Study Material
                </TabsTrigger>
                <TabsTrigger value="flashcards" className="flex items-center gap-2">
                  <Layers className="h-4 w-4" /> Flashcards
                </TabsTrigger>
                <TabsTrigger value="quiz" className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" /> Quiz
                </TabsTrigger>
                <TabsTrigger value="predictions" className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" /> AI Predictions
                </TabsTrigger>
                <TabsTrigger value="revision_sheet" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Revision Sheet
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-muted/10">
              <TabsContent value="study_material" className="mt-0 h-full">
                <StudyMaterialTab data={generatedData.study_material} />
              </TabsContent>
              <TabsContent value="flashcards" className="mt-0 h-full">
                <FlashcardsTab data={generatedData.flashcards} />
              </TabsContent>
              <TabsContent value="quiz" className="mt-0 h-full">
                <QuizTab data={generatedData.quiz} />
              </TabsContent>
              <TabsContent value="predictions" className="mt-0 h-full">
                <PredictionsTab data={generatedData.predictions} />
              </TabsContent>
              <TabsContent value="revision_sheet" className="mt-0 h-full">
                <RevisionSheetTab data={generatedData.revision_sheet} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
