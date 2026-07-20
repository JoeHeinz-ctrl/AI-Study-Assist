'use client';

import { TrendingUp, AlertCircle, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface PredictionsTabProps {
  data?: any[]; // Array of prediction docs
}

export default function PredictionsTab({ data }: PredictionsTabProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4">
        <TrendingUp className="h-16 w-16 opacity-20" />
        <p>Select notes, enter a topic, and click Generate to see AI Exam Predictions.</p>
      </div>
    );
  }

  const getStars = (prob: string) => {
    switch(prob.toLowerCase()) {
      case 'high': return '★★★★★';
      case 'medium': return '★★★☆☆';
      case 'low': return '★☆☆☆☆';
      default: return '★★★☆☆';
    }
  };

  const getProbColor = (prob: string) => {
    switch(prob.toLowerCase()) {
      case 'high': return 'text-amber-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-muted-foreground';
      default: return 'text-yellow-500';
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-primary/10 rounded-xl text-primary">
          <TrendingUp className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Exam Question Predictions</h2>
          <p className="text-muted-foreground">AI-generated likely questions based on your notes</p>
        </div>
      </div>

      <div className="grid gap-6">
        {data.map((prediction: any, i: number) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="bg-muted/30 border-b pb-4">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{prediction.topic}</Badge>
                    <Badge variant="secondary" className="capitalize">{prediction.difficulty}</Badge>
                    <Badge variant="default">{prediction.expectedMarks} Marks</Badge>
                  </div>
                  <CardTitle className="text-xl leading-relaxed mt-2">{prediction.question}</CardTitle>
                </div>
                
                <div className="flex flex-col items-end shrink-0 bg-background p-3 rounded-lg border shadow-sm">
                  <div className={`font-bold text-lg tracking-widest ${getProbColor(prediction.probability)}`}>
                    {getStars(prediction.probability)}
                  </div>
                  <div className="text-xs text-muted-foreground font-medium uppercase mt-1">
                    {prediction.probability} Probability
                  </div>
                  <div className="w-full mt-3 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>AI Confidence</span>
                      <span>{prediction.confidenceScore}%</span>
                    </div>
                    <Progress value={prediction.confidenceScore} className="h-1.5" />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4 flex gap-3">
                <AlertCircle className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-700 dark:text-blue-400 mb-1">Why is this important?</h4>
                  <p className="text-sm text-muted-foreground">{prediction.reason}</p>
                </div>
              </div>
              
              {prediction.answerHint && (
                <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4 flex gap-3">
                  <Lightbulb className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-700 dark:text-green-400 mb-1">Answer Hint</h4>
                    <p className="text-sm text-muted-foreground">{prediction.answerHint}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
