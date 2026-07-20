'use client';

import { FileText, Download, Printer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface RevisionSheetTabProps {
  data?: any;
}

export default function RevisionSheetTab({ data }: RevisionSheetTabProps) {
  if (!data) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4">
        <FileText className="h-16 w-16 opacity-20" />
        <p>Select notes, enter a topic, and click Generate to create a Revision Sheet.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">{data.title}</h2>
          <p className="text-muted-foreground mt-1">One-page summary for {data.topic}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" /> Print
          </Button>
          <Button size="sm">
            <Download className="h-4 w-4 mr-2" /> Export PDF
          </Button>
        </div>
      </div>

      <div className="print-area bg-card border shadow-sm rounded-xl p-8 space-y-8">
        
        {/* Important Concepts & Bullet Points */}
        <div className="grid md:grid-cols-2 gap-8">
          {data.importantConcepts && data.importantConcepts.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2 border-b pb-2">
                Important Concepts
              </h3>
              <div className="space-y-3">
                {data.importantConcepts.map((item: any, i: number) => (
                  <div key={i}>
                    <span className="font-semibold text-primary">{item.concept}:</span>{' '}
                    <span className="text-muted-foreground">{item.explanation}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.definitions && data.definitions.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2 border-b pb-2">
                Key Definitions
              </h3>
              <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                {data.definitions.map((item: any, i: number) => (
                  <li key={i}>
                    <strong className="text-foreground">{item.term}:</strong> {item.definition}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <Separator />

        {/* Formulae & Algorithms */}
        <div className="grid md:grid-cols-2 gap-8">
          {data.formulae && data.formulae.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2 border-b pb-2">
                Formulae
              </h3>
              <div className="grid gap-4">
                {data.formulae.map((item: any, i: number) => (
                  <Card key={i} className="bg-muted/30">
                    <CardContent className="p-4">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xl font-mono text-primary my-2 bg-background p-2 rounded text-center border">{item.formula}</div>
                      <div className="text-sm text-muted-foreground">{item.context}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {data.algorithms && data.algorithms.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2 border-b pb-2">
                Algorithms / Processes
              </h3>
              <div className="space-y-4">
                {data.algorithms.map((item: any, i: number) => (
                  <div key={i}>
                    <h4 className="font-medium mb-2">{item.name}</h4>
                    <ol className="list-decimal pl-5 text-sm text-muted-foreground space-y-1">
                      {item.steps.map((step: string, sIndex: number) => (
                        <li key={sIndex}>{step}</li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* General Bullet Points & Exam Tips */}
        <div className="grid md:grid-cols-2 gap-8 pt-4 border-t">
          {data.bulletPoints && data.bulletPoints.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2 border-b pb-2">
                Quick Summary Notes
              </h3>
              <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                {data.bulletPoints.map((point: string, i: number) => (
                  <li key={i}>{point}</li>
                ))}
              </ul>
            </div>
          )}

          {data.examTips && data.examTips.length > 0 && (
            <div className="space-y-4 bg-primary/5 p-6 rounded-xl border border-primary/20">
              <h3 className="text-xl font-semibold flex items-center gap-2 text-primary">
                💡 Exam Tips
              </h3>
              <ul className="space-y-3">
                {data.examTips.map((tip: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm font-medium">
                    <span className="text-primary mt-0.5">•</span> {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0;
            border: none;
            box-shadow: none;
          }
        }
      `}} />
    </div>
  );
}
