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
      <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight flex items-center gap-2 sm:gap-3">
            <Brain className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
            <span className="text-2xl sm:text-4xl">AI Study Workspace</span>
          </h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            Upload documents, generate study materials, and track your learning progress
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto gap-1 sm:gap-0 bg-transparent sm:bg-muted p-0 sm:p-1">
            <TabsTrigger value="dashboard" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2.5 sm:py-2 data-[state=active]:bg-background">
              <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Dashboard</span>
              <span className="xs:hidden">Home</span>
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2.5 sm:py-2 data-[state=active]:bg-background">
              <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Upload</span>
              <span className="xs:hidden">Files</span>
            </TabsTrigger>
            <TabsTrigger value="generate" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2.5 sm:py-2 data-[state=active]:bg-background">
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Generate</span>
              <span className="xs:hidden">Create</span>
            </TabsTrigger>
            <TabsTrigger value="study" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2.5 sm:py-2 data-[state=active]:bg-background">
              <Play className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Sessions</span>
              <span className="xs:hidden">Study</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              <Card className="touch-manipulation">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
                  <CardTitle className="text-xs sm:text-sm font-medium">Study Time</CardTitle>
                  <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                  <div className="text-xl sm:text-2xl font-bold">
                    {Math.floor(totalStudyTime / 60)}h {totalStudyTime % 60}m
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Total time</p>
                </CardContent>
              </Card>

              <Card className="touch-manipulation">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
                  <CardTitle className="text-xs sm:text-sm font-medium">Active</CardTitle>
                  <Play className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                  <div className="text-xl sm:text-2xl font-bold">{activeSessions}</div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">In progress</p>
                </CardContent>
              </Card>

              <Card className="touch-manipulation">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
                  <CardTitle className="text-xs sm:text-sm font-medium">Completed</CardTitle>
                  <Award className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                  <div className="text-xl sm:text-2xl font-bold">{completedSessions}</div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Finished</p>
                </CardContent>
              </Card>

              <Card className="touch-manipulation">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
                  <CardTitle className="text-xs sm:text-sm font-medium">Success</CardTitle>
                  <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                  <div className="text-xl sm:text-2xl font-bold">
                    {totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0}%
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Rate</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              <Card className="cursor-pointer hover:bg-muted/50 active:bg-muted transition-colors touch-manipulation" onClick={() => setActiveTab('upload')}>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Upload className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    Upload Documents
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                  <p className="text-muted-foreground text-xs sm:text-sm">
                    Upload PDFs, Word docs, and more
                  </p>
                  <div className="mt-3 sm:mt-4">
                    <Badge variant="secondary" className="text-xs">
                      {documentsData?.pagination?.total || 0} documents
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:bg-muted/50 active:bg-muted transition-colors touch-manipulation" onClick={() => setActiveTab('generate')}>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    Generate Materials
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                  <p className="text-muted-foreground text-xs sm:text-sm">
                    Create flashcards, quizzes, and guides
                  </p>
                  <div className="mt-3 sm:mt-4">
                    <Badge variant="secondary" className="text-xs">
                      {notesData?.count || 0} notes available
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:bg-muted/50 active:bg-muted transition-colors touch-manipulation sm:col-span-2 lg:col-span-1" onClick={() => setActiveTab('study')}>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Play className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    Continue Studying
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                  <p className="text-muted-foreground text-xs sm:text-sm">
                    Resume or start new study sessions
                  </p>
                  <div className="mt-3 sm:mt-4">
                    <Badge variant="secondary" className="text-xs">
                      {activeSessions} active sessions
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Study Sessions */}
            <Card className="touch-manipulation">
              <CardHeader className="mobile-card-spacing pb-3 sm:pb-6">
                <CardTitle className="flex items-center justify-between text-base sm:text-lg">
                  <span>Recent Study Sessions</span>
                  <Button variant="outline" size="sm" onClick={() => setActiveTab('study')} className="touch-target h-8 text-xs sm:text-sm">
                    View All
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="mobile-card-spacing pt-0">
                {isLoadingSessions ? (
                  <div className="text-center py-6 sm:py-8 text-muted-foreground text-sm">
                    Loading sessions...
                  </div>
                ) : recentSessions.length === 0 ? (
                  <div className="text-center py-6 sm:py-8">
                    <Brain className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground text-sm sm:text-base">No study sessions yet</p>
                    <Button 
                      variant="outline" 
                      className="mt-3 sm:mt-4 touch-target text-xs sm:text-sm" 
                      size="sm"
                      onClick={() => setActiveTab('generate')}
                    >
                      Create Your First Session
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    {recentSessions.map((session: any) => {
                      const Icon = studyTypeIcons[session.studyType] || BookOpen;
                      return (
                        <div 
                          key={session._id} 
                          className="flex items-center justify-between p-2.5 sm:p-3 border rounded-lg hover:bg-muted/50 active:bg-muted cursor-pointer touch-manipulation transition-colors"
                          onClick={() => {
                            setSelectedSession(session._id);
                            setActiveTab('study');
                          }}
                        >
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                            <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                            <div className="min-w-0">
                              <h4 className="font-medium text-xs sm:text-sm truncate">{session.title}</h4>
                              <p className="text-[10px] sm:text-sm text-muted-foreground truncate">
                                {session.progress.completionPercentage}% • {session.sourceDocuments.length} source{session.sourceDocuments.length !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-2">
                            <Badge variant={session.status === 'completed' ? 'default' : 'secondary'} className="text-[10px] sm:text-xs">
                              {session.status}
                            </Badge>
                            <p className="text-[9px] sm:text-xs text-muted-foreground mt-1">
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

          <TabsContent value="upload" className="mt-4 sm:mt-6">
            <Card className="touch-manipulation">
              <CardHeader className="mobile-card-spacing pb-3 sm:pb-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Upload className="h-4 w-4 sm:h-5 sm:w-5" />
                  Upload Study Materials
                </CardTitle>
                <p className="text-muted-foreground text-xs sm:text-sm mt-1.5 sm:mt-2">
                  Upload documents to extract text and make them available for study material generation
                </p>
              </CardHeader>
              <CardContent className="mobile-card-spacing pt-0">
                <FileUpload onUploadComplete={handleUploadComplete} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="generate" className="mt-4 sm:mt-6">
            <StudyMaterialGenerator onGenerated={handleSessionGenerated} />
          </TabsContent>

          <TabsContent value="study" className="mt-4 sm:mt-6">
            <Card className="touch-manipulation">
              <CardHeader className="mobile-card-spacing pb-3 sm:pb-6">
                <CardTitle className="text-base sm:text-lg">Study Sessions</CardTitle>
                <p className="text-muted-foreground text-xs sm:text-sm mt-1.5 sm:mt-2">
                  Manage and continue your study sessions
                </p>
              </CardHeader>
              <CardContent className="mobile-card-spacing pt-0">
                {isLoadingSessions ? (
                  <div className="text-center py-6 sm:py-8 text-muted-foreground text-sm">
                    Loading sessions...
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <Brain className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 sm:mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">No Study Sessions</h3>
                    <p className="text-muted-foreground mb-4 sm:mb-6 text-xs sm:text-sm px-4">
                      Generate your first study materials to get started
                    </p>
                    <Button onClick={() => setActiveTab('generate')} className="touch-target text-sm" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Study Session
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {sessions.map((session: any) => {
                      const Icon = studyTypeIcons[session.studyType] || BookOpen;
                      return (
                        <Card key={session._id} className="hover:shadow-md active:shadow-sm transition-shadow touch-manipulation">
                          <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                                <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                                <Badge variant="outline" className="text-[10px] sm:text-xs whitespace-nowrap">
                                  {session.studyType.replace('_', ' ')}
                                </Badge>
                              </div>
                              <Badge variant={session.status === 'completed' ? 'default' : 'secondary'} className="text-[10px] sm:text-xs flex-shrink-0">
                                {session.status}
                              </Badge>
                            </div>
                            <h4 className="font-semibold text-sm sm:text-base line-clamp-2 mt-2">{session.title}</h4>
                          </CardHeader>
                          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                            <div className="space-y-2 sm:space-y-3">
                              <div className="text-xs sm:text-sm text-muted-foreground">
                                <div className="flex justify-between mb-1">
                                  <span>Progress</span>
                                  <span className="font-medium">{session.progress.completionPercentage}%</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-1.5 sm:h-2">
                                  <div 
                                    className="bg-primary h-1.5 sm:h-2 rounded-full transition-all"
                                    style={{ width: `${session.progress.completionPercentage}%` }}
                                  />
                                </div>
                              </div>
                              
                              <div className="text-[10px] sm:text-sm text-muted-foreground space-y-0.5 sm:space-y-1">
                                <p>{session.progress.completedItems} / {session.progress.totalItems} items</p>
                                <p>{session.sourceDocuments.length} source material{session.sourceDocuments.length !== 1 ? 's' : ''}</p>
                                <p className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(session.updatedAt), 'MMM d, yyyy')}
                                </p>
                              </div>

                              <div className="flex gap-1.5 sm:gap-2 pt-1 sm:pt-2">
                                <Button 
                                  size="sm" 
                                  className="flex-1 touch-target h-8 sm:h-9 text-xs sm:text-sm"
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
                                  className="touch-target h-8 w-8 sm:h-9 sm:w-9 p-0"
                                  onClick={() => {
                                    // TODO: Reset session
                                    toast.info('Reset functionality coming soon!');
                                  }}
                                >
                                  <RotateCcw className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="touch-target h-8 w-8 sm:h-9 sm:w-9 p-0"
                                  onClick={() => {
                                    // TODO: Delete session
                                    toast.info('Delete functionality coming soon!');
                                  }}
                                >
                                  <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
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
