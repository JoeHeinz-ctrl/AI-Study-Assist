'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, 
  BookOpen, 
  FileText, 
  Clock, 
  TrendingUp,
  Brain,
  Target,
  Award,
  Calendar,
  Play,
  RotateCcw,
  Trash2,
  Plus,
  BarChart3,
  Users,
  Settings,
  Sparkles
} from 'lucide-react';
import { FileUpload } from '@/components/features/study/FileUpload';
import { StudyMaterialGenerator } from '@/components/features/study/StudyMaterialGenerator';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function StudyPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  // Fetch study sessions
  const { data: sessionsData, isLoading: isLoadingSessions, refetch: refetchSessions } = useQuery({
    queryKey: ['study-sessions'],
    queryFn: async () => {
      const res = await fetch('/api/study/sessions');
      if (!res.ok) throw new Error('Failed to fetch study sessions');
      return res.json();
    }
  });

  // Fetch notes count
  const { data: notesData } = useQuery({
    queryKey: ['notes-count'],
    queryFn: async () => {
      const res = await fetch('/api/notes');
      if (!res.ok) throw new Error('Failed to fetch notes');
      const data = await res.json();
      return { count: data.length };
    }
  });

  // Fetch documents count
  const { data: documentsData } = useQuery({
    queryKey: ['documents-count'],
    queryFn: async () => {
      const res = await fetch('/api/documents');
      if (!res.ok) throw new Error('Failed to fetch documents');
      return res.json();
    }
  });

  const handleSessionGenerated = (sessionId: string) => {
    setSelectedSession(sessionId);
    setActiveTab('study');
    refetchSessions();
    toast.success('Study session created! Ready to start studying.');
  };

  const handleUploadComplete = () => {
    toast.success('Files uploaded and processed! They are now available for study material generation.');
  };

  const sessions = sessionsData?.sessions || [];
  const recentSessions = sessions.slice(0, 6);
  const stats = sessionsData?.stats || {};

  // Calculate dashboard statistics
  const totalStudyTime = Object.values(stats).reduce((acc: number, stat: any) => acc + (stat.totalStudyTime || 0), 0);
  const activeSessions = stats.active?.count || 0;
  const completedSessions = stats.completed?.count || 0;
  const totalSessions = sessions.length;

  const studyTypeIcons: Record<string, any> = {
    flashcards: BookOpen,
    mcq: Target,
    short_answer: FileText,
    long_answer: FileText,
    fill_blanks: Users,
    true_false: Target,
    matching: Users,
    definitions: BookOpen,
    concepts: Brain,
    summary: FileText,
    revision_sheet: FileText,
    interview: Users,
    viva: Users
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
            <Brain className="h-8 w-8 text-primary" />
            AI Study Workspace
          </h1>
          <p className="text-muted-foreground mt-2">
            Upload documents, generate study materials, and track your learning progress
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload Files
            </TabsTrigger>
            <TabsTrigger value="generate" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Generate Materials
            </TabsTrigger>
            <TabsTrigger value="study" className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Study Sessions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Study Time</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Math.floor(totalStudyTime / 60)}h {totalStudyTime % 60}m
                  </div>
                  <p className="text-xs text-muted-foreground">Across all sessions</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                  <Play className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{activeSessions}</div>
                  <p className="text-xs text-muted-foreground">Currently in progress</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{completedSessions}</div>
                  <p className="text-xs text-muted-foreground">Study sessions finished</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">Completion rate</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setActiveTab('upload')}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5 text-primary" />
                    Upload Documents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    Upload PDFs, Word docs, presentations, and text files to create study materials
                  </p>
                  <div className="mt-4">
                    <Badge variant="secondary">
                      {documentsData?.pagination?.total || 0} documents
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setActiveTab('generate')}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Generate Materials
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    Create flashcards, quizzes, and study guides from your notes and documents
                  </p>
                  <div className="mt-4">
                    <Badge variant="secondary">
                      {notesData?.count || 0} notes available
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setActiveTab('study')}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="h-5 w-5 text-primary" />
                    Continue Studying
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    Resume your study sessions or start new ones from generated materials
                  </p>
                  <div className="mt-4">
                    <Badge variant="secondary">
                      {activeSessions} active sessions
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Study Sessions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Recent Study Sessions
                  <Button variant="outline" size="sm" onClick={() => setActiveTab('study')}>
                    View All
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingSessions ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading sessions...
                  </div>
                ) : recentSessions.length === 0 ? (
                  <div className="text-center py-8">
                    <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">No study sessions yet</p>
                    <Button 
                      variant="outline" 
                      className="mt-4" 
                      onClick={() => setActiveTab('generate')}
                    >
                      Create Your First Session
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentSessions.map((session: any) => {
                      const Icon = studyTypeIcons[session.studyType] || BookOpen;
                      return (
                        <div 
                          key={session._id} 
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                          onClick={() => {
                            setSelectedSession(session._id);
                            setActiveTab('study');
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="h-5 w-5 text-primary" />
                            <div>
                              <h4 className="font-medium">{session.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {session.progress.completionPercentage}% complete • {session.sourceDocuments.length} sources
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant={session.status === 'completed' ? 'default' : 'secondary'}>
                              {session.status}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(session.updatedAt), 'MMM d')}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upload">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload Study Materials
                </CardTitle>
                <p className="text-muted-foreground">
                  Upload documents to extract text and make them available for study material generation
                </p>
              </CardHeader>
              <CardContent>
                <FileUpload onUploadComplete={handleUploadComplete} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="generate">
            <StudyMaterialGenerator onGenerated={handleSessionGenerated} />
          </TabsContent>

          <TabsContent value="study">
            <Card>
              <CardHeader>
                <CardTitle>Study Sessions</CardTitle>
                <p className="text-muted-foreground">
                  Manage and continue your study sessions
                </p>
              </CardHeader>
              <CardContent>
                {isLoadingSessions ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading sessions...
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="text-center py-12">
                    <Brain className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No Study Sessions</h3>
                    <p className="text-muted-foreground mb-6">
                      Generate your first study materials to get started
                    </p>
                    <Button onClick={() => setActiveTab('generate')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Study Session
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sessions.map((session: any) => {
                      const Icon = studyTypeIcons[session.studyType] || BookOpen;
                      return (
                        <Card key={session._id} className="hover:shadow-md transition-shadow">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                <Icon className="h-5 w-5 text-primary" />
                                <Badge variant="outline" className="text-xs">
                                  {session.studyType.replace('_', ' ')}
                                </Badge>
                              </div>
                              <Badge variant={session.status === 'completed' ? 'default' : 'secondary'}>
                                {session.status}
                              </Badge>
                            </div>
                            <h4 className="font-semibold line-clamp-2">{session.title}</h4>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div className="text-sm text-muted-foreground">
                                <div className="flex justify-between">
                                  <span>Progress</span>
                                  <span>{session.progress.completionPercentage}%</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2 mt-1">
                                  <div 
                                    className="bg-primary h-2 rounded-full transition-all"
                                    style={{ width: `${session.progress.completionPercentage}%` }}
                                  />
                                </div>
                              </div>
                              
                              <div className="text-sm text-muted-foreground">
                                <p>{session.progress.completedItems} / {session.progress.totalItems} items</p>
                                <p>{session.sourceDocuments.length} source materials</p>
                                <p className="flex items-center gap-1 mt-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(session.updatedAt), 'MMM d, yyyy')}
                                </p>
                              </div>

                              <div className="flex gap-2 pt-2">
                                <Button 
                                  size="sm" 
                                  className="flex-1"
                                  onClick={() => {
                                    // TODO: Navigate to study session
                                    toast.info('Study session functionality coming soon!');
                                  }}
                                >
                                  <Play className="h-3 w-3 mr-1" />
                                  {session.status === 'completed' ? 'Review' : 'Continue'}
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    // TODO: Reset session
                                    toast.info('Reset functionality coming soon!');
                                  }}
                                >
                                  <RotateCcw className="h-3 w-3" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    // TODO: Delete session
                                    toast.info('Delete functionality coming soon!');
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
