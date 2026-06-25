'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  BrainCircuit, 
  FileQuestion, 
  ClipboardList, 
  MessageSquare, 
  ToggleLeft,
  Users,
  GraduationCap,
  Trophy,
  Briefcase,
  Loader2,
  X,
  Plus,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

interface SourceDocument {
  id: string;
  type: 'note' | 'document';
  title: string;
  selected: boolean;
}

interface StudyMaterialGeneratorProps {
  onGenerated: (sessionId: string) => void;
}

const studyTypes = [
  { id: 'flashcards', name: 'Flashcards', icon: BookOpen, description: 'Question & answer cards for memorization' },
  { id: 'mcq', name: 'MCQ Quiz', icon: ClipboardList, description: 'Multiple choice questions' },
  { id: 'short_answer', name: 'Short Answer', icon: MessageSquare, description: 'Brief answer questions' },
  { id: 'long_answer', name: 'Long Answer', icon: FileQuestion, description: 'Detailed essay questions' },
  { id: 'fill_blanks', name: 'Fill in the Blanks', icon: ToggleLeft, description: 'Complete the missing words' },
  { id: 'true_false', name: 'True/False', icon: ToggleLeft, description: 'True or false statements' },
  { id: 'matching', name: 'Matching', icon: Users, description: 'Match terms with definitions' },
  { id: 'definitions', name: 'Key Definitions', icon: BookOpen, description: 'Important term definitions' },
  { id: 'concepts', name: 'Important Concepts', icon: BrainCircuit, description: 'Core concept explanations' },
  { id: 'summary', name: 'Chapter Summary', icon: ClipboardList, description: 'Condensed content summary' },
  { id: 'revision_sheet', name: 'Revision Sheet', icon: FileQuestion, description: 'One-page study guide' },
  { id: 'interview', name: 'Interview Questions', icon: Briefcase, description: 'Job interview preparation' },
  { id: 'viva', name: 'Viva Questions', icon: GraduationCap, description: 'Oral examination questions' }
];

const studyModes = [
  { id: 'beginner', name: 'Beginner', icon: BookOpen, description: 'Basic concepts and fundamentals' },
  { id: 'intermediate', name: 'Intermediate', icon: BrainCircuit, description: 'Building on basic knowledge' },
  { id: 'advanced', name: 'Advanced', icon: GraduationCap, description: 'Deep understanding required' },
  { id: 'exam_revision', name: 'Exam Revision', icon: ClipboardList, description: 'Quick review for exams' },
  { id: 'competitive_exam', name: 'Competitive Exam', icon: Trophy, description: 'Challenging questions' },
  { id: 'interview_prep', name: 'Interview Prep', icon: Briefcase, description: 'Job interview focused' }
];

export function StudyMaterialGenerator({ onGenerated }: StudyMaterialGeneratorProps) {
  const [selectedStudyType, setSelectedStudyType] = useState<string>('');
  const [selectedStudyMode, setSelectedStudyMode] = useState<string>('');
  const [studyTitle, setStudyTitle] = useState('');
  const [selectedSources, setSelectedSources] = useState<SourceDocument[]>([]);
  const [settings, setSettings] = useState({
    showAnswersImmediately: true,
    shuffleQuestions: false,
    numberOfQuestions: undefined as number | undefined,
    timeLimitPerQuestion: undefined as number | undefined
  });
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [newFocusArea, setNewFocusArea] = useState('');

  // Fetch notes
  const { data: notes, isLoading: isLoadingNotes } = useQuery({
    queryKey: ['notes'],
    queryFn: async () => {
      const res = await fetch('/api/notes');
      if (!res.ok) throw new Error('Failed to fetch notes');
      return res.json();
    }
  });

  // Fetch documents
  const { data: documents, isLoading: isLoadingDocuments } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const res = await fetch('/api/documents?status=completed');
      if (!res.ok) throw new Error('Failed to fetch documents');
      return res.json();
    }
  });

  // Generate study material
  const generateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/study/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast.success('Study material generated successfully!');
      onGenerated(data.sessionId);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to generate study material');
    }
  });

  const handleSourceToggle = (source: { id: string; type: 'note' | 'document'; title: string }) => {
    setSelectedSources(prev => {
      const exists = prev.find(s => s.id === source.id && s.type === source.type);
      if (exists) {
        return prev.filter(s => !(s.id === source.id && s.type === source.type));
      } else {
        return [...prev, { ...source, selected: true }];
      }
    });
  };

  const addFocusArea = () => {
    if (newFocusArea.trim() && !focusAreas.includes(newFocusArea.trim())) {
      setFocusAreas([...focusAreas, newFocusArea.trim()]);
      setNewFocusArea('');
    }
  };

  const removeFocusArea = (area: string) => {
    setFocusAreas(focusAreas.filter(a => a !== area));
  };

  const handleGenerate = () => {
    if (!selectedStudyType || !selectedStudyMode || selectedSources.length === 0) {
      toast.error('Please select study type, mode, and at least one source');
      return;
    }

    const data = {
      studyType: selectedStudyType,
      studyMode: selectedStudyMode,
      sourceDocuments: selectedSources.map(s => ({ type: s.type, id: s.id })),
      title: studyTitle || `${studyTypes.find(t => t.id === selectedStudyType)?.name} Study Session`,
      settings,
      options: {
        focusAreas: focusAreas.length > 0 ? focusAreas : undefined,
        count: settings.numberOfQuestions
      }
    };

    generateMutation.mutate(data);
  };

  const isLoading = isLoadingNotes || isLoadingDocuments;
  const allSources = [
    ...(notes || []).map((note: any) => ({ id: note._id, type: 'note' as const, title: note.title })),
    ...(documents?.documents || []).map((doc: any) => ({ id: doc._id, type: 'document' as const, title: doc.originalName }))
  ];

  return (
    <div className="space-y-6">
      {/* Study Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Select Study Material Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {studyTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedStudyType === type.id;
              
              return (
                <Card 
                  key={type.id}
                  className={`cursor-pointer transition-all ${
                    isSelected 
                      ? 'ring-2 ring-primary bg-primary/5' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedStudyType(type.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Icon className={`h-5 w-5 mt-0.5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div>
                        <h4 className="font-semibold text-sm">{type.name}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{type.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Study Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            Select Difficulty Level
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {studyModes.map((mode) => {
              const Icon = mode.icon;
              const isSelected = selectedStudyMode === mode.id;
              
              return (
                <Card 
                  key={mode.id}
                  className={`cursor-pointer transition-all ${
                    isSelected 
                      ? 'ring-2 ring-primary bg-primary/5' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedStudyMode(mode.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Icon className={`h-5 w-5 mt-0.5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div>
                        <h4 className="font-semibold text-sm">{mode.name}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{mode.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Source Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Source Materials</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading materials...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Selected sources */}
              {selectedSources.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Selected ({selectedSources.length})</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedSources.map((source) => (
                      <Badge key={`${source.type}-${source.id}`} variant="default" className="flex items-center gap-1">
                        {source.type === 'note' ? <BookOpen className="h-3 w-3" /> : <FileQuestion className="h-3 w-3" />}
                        {source.title}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 ml-1"
                          onClick={() => handleSourceToggle(source)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Available sources */}
              <div className="max-h-60 overflow-y-auto space-y-2">
                {allSources.map((source) => {
                  const isSelected = selectedSources.some(s => s.id === source.id && s.type === source.type);
                  return (
                    <div 
                      key={`${source.type}-${source.id}`}
                      className="flex items-center space-x-2 p-2 rounded hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleSourceToggle(source)}
                    >
                      <Checkbox checked={isSelected} disabled />
                      {source.type === 'note' ? (
                        <BookOpen className="h-4 w-4 text-blue-500" />
                      ) : (
                        <FileQuestion className="h-4 w-4 text-green-500" />
                      )}
                      <span className="text-sm flex-1">{source.title}</span>
                      <Badge variant="outline" className="text-xs">
                        {source.type}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Study Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Study Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Study Session Title (Optional)</Label>
            <Input
              id="title"
              value={studyTitle}
              onChange={(e) => setStudyTitle(e.target.value)}
              placeholder="Enter a custom title for this study session"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="questions">Number of Questions</Label>
              <Input
                id="questions"
                type="number"
                min="1"
                max="50"
                value={settings.numberOfQuestions || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, numberOfQuestions: e.target.value ? parseInt(e.target.value) : undefined }))}
                placeholder="Auto"
              />
            </div>

            <div>
              <Label htmlFor="timeLimit">Time Limit (minutes per question)</Label>
              <Input
                id="timeLimit"
                type="number"
                min="0.5"
                max="30"
                step="0.5"
                value={settings.timeLimitPerQuestion || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, timeLimitPerQuestion: e.target.value ? parseFloat(e.target.value) : undefined }))}
                placeholder="No limit"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="showAnswers"
                checked={settings.showAnswersImmediately}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, showAnswersImmediately: Boolean(checked) }))}
              />
              <Label htmlFor="showAnswers">Show answers immediately</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="shuffle"
                checked={settings.shuffleQuestions}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, shuffleQuestions: Boolean(checked) }))}
              />
              <Label htmlFor="shuffle">Shuffle questions</Label>
            </div>
          </div>

          {/* Focus Areas */}
          <div>
            <Label>Focus Areas (Optional)</Label>
            <div className="flex gap-2 mt-2">
              <Input
                value={newFocusArea}
                onChange={(e) => setNewFocusArea(e.target.value)}
                placeholder="Add a topic to focus on..."
                onKeyPress={(e) => e.key === 'Enter' && addFocusArea()}
              />
              <Button type="button" onClick={addFocusArea} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {focusAreas.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {focusAreas.map((area) => (
                  <Badge key={area} variant="secondary" className="flex items-center gap-1">
                    {area}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 ml-1"
                      onClick={() => removeFocusArea(area)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Generate Button */}
      <div className="flex justify-center">
        <Button 
          onClick={handleGenerate}
          disabled={!selectedStudyType || !selectedStudyMode || selectedSources.length === 0 || generateMutation.isPending}
          size="lg"
          className="px-8"
        >
          {generateMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <BrainCircuit className="h-4 w-4 mr-2" />
              Generate Study Material
            </>
          )}
        </Button>
      </div>
    </div>
  );
}