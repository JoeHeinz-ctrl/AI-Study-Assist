'use client';

import { BookOpen } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface StudyMaterialTabProps {
  data?: any;
}

export default function StudyMaterialTab({ data }: StudyMaterialTabProps) {
  if (!data) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4">
        <BookOpen className="h-16 w-16 opacity-20" />
        <p>Select notes, enter a topic, and click Generate to create Study Material.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">{data.title}</h2>
        <div className="flex gap-2">
          <Badge variant="secondary">{data.topic}</Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Explanation</CardTitle>
          <CardDescription>Comprehensive overview of the topic</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap leading-relaxed">{data.explanation}</p>
        </CardContent>
      </Card>

      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle>Simplified Explanation (ELI5)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg leading-relaxed">{data.simplifiedExplanation}</p>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Important Concepts</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2">
              {data.importantConcepts?.map((concept: string, i: number) => (
                <li key={i}>{concept}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Key Points</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2">
              {data.keyPoints?.map((point: string, i: number) => (
                <li key={i}>{point}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Real-World Example</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="italic text-muted-foreground">{data.realWorldExample}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-medium">{data.summary}</p>
        </CardContent>
      </Card>
    </div>
  );
}
