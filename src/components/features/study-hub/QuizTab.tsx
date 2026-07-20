'use client';

import { useState } from 'react';
import { HelpCircle, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface QuizTabProps {
  data?: any; // Quiz doc inserted to DB
}

export default function QuizTab({ data }: QuizTabProps) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!data || !data.questions) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4">
        <HelpCircle className="h-16 w-16 opacity-20" />
        <p>Select notes, enter a topic, and click Generate to create a Quiz.</p>
      </div>
    );
  }

  const handleAnswerChange = (qIndex: number, value: string) => {
    if (isSubmitted) return;
    setAnswers({ ...answers, [qIndex]: value });
  };

  const calculateScore = () => {
    let score = 0;
    data.questions.forEach((q: any, i: number) => {
      const userAnswer = answers[i]?.toLowerCase().trim();
      const correctAnswer = q.correctAnswer.toLowerCase().trim();
      if (userAnswer === correctAnswer) {
        score++;
      } else if (q.type === 'mcq' && userAnswer === correctAnswer) {
        score++; // Handled safely by above logic
      }
    });
    return score;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-3xl font-bold">{data.title}</h2>
        <p className="text-muted-foreground">Topic: {data.topic} • Difficulty: {data.difficulty}</p>
      </div>

      {isSubmitted && (
        <Card className="bg-primary/5 border-primary">
          <CardContent className="pt-6 flex flex-col items-center justify-center space-y-2">
            <h3 className="text-2xl font-bold">Your Score</h3>
            <div className="text-5xl font-black text-primary">
              {calculateScore()} <span className="text-2xl text-muted-foreground">/ {data.totalQuestions}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        {data.questions.map((q: any, index: number) => {
          const isCorrect = answers[index]?.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim();
          const hasAnswered = !!answers[index];
          
          return (
            <Card key={index} className={isSubmitted ? (isCorrect ? 'border-green-500/50' : 'border-red-500/50') : ''}>
              <CardHeader>
                <CardTitle className="text-lg flex gap-2">
                  <span className="text-muted-foreground">{index + 1}.</span> 
                  {q.questionText}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {q.type === 'mcq' || q.type === 'true_false' ? (
                  <RadioGroup 
                    value={answers[index] || ''} 
                    onValueChange={(val) => handleAnswerChange(index, val)}
                    className="space-y-3"
                  >
                    {(q.options || ['True', 'False']).map((opt: string, oIndex: number) => (
                      <div key={oIndex} className="flex items-center space-x-2">
                        <RadioGroupItem value={opt} id={`q${index}-o${oIndex}`} disabled={isSubmitted} />
                        <Label htmlFor={`q${index}-o${oIndex}`} className="text-base font-normal cursor-pointer flex-1">
                          {opt}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                ) : (
                  <Input 
                    placeholder="Type your answer here..." 
                    value={answers[index] || ''}
                    onChange={(e) => handleAnswerChange(index, e.target.value)}
                    disabled={isSubmitted}
                  />
                )}
              </CardContent>
              {isSubmitted && (
                <CardFooter className="bg-muted/50 rounded-b-lg border-t flex flex-col items-start gap-2 pt-4">
                  <div className="flex items-center gap-2 font-medium">
                    {isCorrect ? (
                      <span className="text-green-500 flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Correct</span>
                    ) : (
                      <span className="text-red-500 flex items-center gap-1"><XCircle className="h-4 w-4" /> Incorrect</span>
                    )}
                  </div>
                  {!isCorrect && (
                    <div className="text-sm">
                      <span className="font-semibold">Correct Answer:</span> {q.correctAnswer}
                    </div>
                  )}
                  {q.explanation && (
                    <div className="text-sm text-muted-foreground mt-2 border-l-2 pl-3">
                      {q.explanation}
                    </div>
                  )}
                </CardFooter>
              )}
            </Card>
          );
        })}
      </div>

      {!isSubmitted && (
        <div className="flex justify-end pt-4">
          <Button size="lg" onClick={() => setIsSubmitted(true)}>Submit Quiz</Button>
        </div>
      )}
    </div>
  );
}
