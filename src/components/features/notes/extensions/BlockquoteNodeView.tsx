'use client';

import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import React from 'react';
import { Info, AlertTriangle, CheckCircle, XCircle, FileText, Lightbulb, Brain, Key, Flame } from 'lucide-react';

interface BlockquoteNodeViewProps {
  node: {
    firstChild: {
      textContent: string;
    } | null;
  };
}

export default function BlockquoteNodeView({ node }: BlockquoteNodeViewProps) {
  const text = node.firstChild?.textContent || '';
  const match = text.match(/^\[!(NOTE|INFO|TODO|WARNING|ERROR|SUCCESS|TIP|DEFINITION|KEY|EXAMPLE|IMPORTANT)\]/i);

  if (match) {
    const type = match[1].toUpperCase();

    // Custom aesthetic color schemes matching Tailwind / HSL palette
    let bgClass = 'bg-blue-50/70 border-blue-500 dark:bg-blue-950/20 dark:border-blue-700/80';
    let textClass = 'text-blue-950 dark:text-blue-100';
    let titleClass = 'text-blue-800 dark:text-blue-300';
    let Icon = Info;
    let title = 'Note';

    if (type === 'WARNING') {
      bgClass = 'bg-amber-50/70 border-amber-500 dark:bg-amber-950/20 dark:border-amber-700/80';
      textClass = 'text-amber-950 dark:text-amber-100';
      titleClass = 'text-amber-800 dark:text-amber-300';
      Icon = AlertTriangle;
      title = 'Warning';
    } else if (type === 'ERROR') {
      bgClass = 'bg-red-50/70 border-red-500 dark:bg-red-950/20 dark:border-red-700/80';
      textClass = 'text-red-950 dark:text-red-100';
      titleClass = 'text-red-800 dark:text-red-300';
      Icon = XCircle;
      title = 'Error';
    } else if (type === 'SUCCESS') {
      bgClass = 'bg-green-50/70 border-green-500 dark:bg-green-950/20 dark:border-green-700/80';
      textClass = 'text-green-950 dark:text-green-100';
      titleClass = 'text-green-800 dark:text-green-300';
      Icon = CheckCircle;
      title = 'Success';
    } else if (type === 'TODO') {
      bgClass = 'bg-purple-50/70 border-purple-500 dark:bg-purple-950/20 dark:border-purple-700/80';
      textClass = 'text-purple-950 dark:text-purple-100';
      titleClass = 'text-purple-800 dark:text-purple-300';
      Icon = FileText;
      title = 'Todo';
    } else if (type === 'INFO') {
      bgClass = 'bg-sky-50/70 border-sky-500 dark:bg-sky-950/20 dark:border-sky-700/80';
      textClass = 'text-sky-950 dark:text-sky-100';
      titleClass = 'text-sky-800 dark:text-sky-300';
      Icon = Info;
      title = 'Info';
    } else if (type === 'TIP') {
      bgClass = 'bg-emerald-50/70 border-emerald-500 dark:bg-emerald-950/20 dark:border-emerald-700/80';
      textClass = 'text-emerald-950 dark:text-emerald-100';
      titleClass = 'text-emerald-800 dark:text-emerald-300';
      Icon = Lightbulb;
      title = 'Tip';
    } else if (type === 'DEFINITION') {
      bgClass = 'bg-violet-50/70 border-violet-500 dark:bg-violet-950/20 dark:border-violet-700/80';
      textClass = 'text-violet-950 dark:text-violet-100';
      titleClass = 'text-violet-800 dark:text-violet-300';
      Icon = Brain;
      title = 'Definition';
    } else if (type === 'KEY') {
      bgClass = 'bg-amber-50/70 border-amber-500 dark:bg-amber-950/20 dark:border-amber-700/80';
      textClass = 'text-amber-950 dark:text-amber-100';
      titleClass = 'text-amber-800 dark:text-amber-300';
      Icon = Key;
      title = 'Key Point';
    } else if (type === 'EXAMPLE') {
      bgClass = 'bg-orange-50/70 border-orange-500 dark:bg-orange-950/20 dark:border-orange-700/80';
      textClass = 'text-orange-950 dark:text-orange-100';
      titleClass = 'text-orange-800 dark:text-orange-300';
      Icon = Flame;
      title = 'Example';
    } else if (type === 'IMPORTANT') {
      bgClass = 'bg-red-50/70 border-red-500 dark:bg-red-950/20 dark:border-red-700/80';
      textClass = 'text-red-950 dark:text-red-100';
      titleClass = 'text-red-800 dark:text-red-300';
      Icon = AlertTriangle;
      title = 'Important';
    }

    return (
      <NodeViewWrapper className={`my-4 border-l-4 rounded-r-lg p-4 ${bgClass} transition-all duration-200 shadow-sm relative overflow-hidden`}>
        <div className="flex items-center gap-2 mb-2 select-none">
          <Icon className="h-4 w-4 shrink-0" />
          <span className={`font-semibold uppercase tracking-wider text-xs ${titleClass}`}>{title}</span>
        </div>
        <div className={`prose-sm dark:prose-invert ${textClass} [&_p:first-of-type]:mt-0 [&_p]:my-1`}>
          <NodeViewContent />
        </div>
      </NodeViewWrapper>
    );
  }

  // Fallback to beautiful normal blockquote styling
  return (
    <NodeViewWrapper className="my-4 border-l-4 border-muted-foreground/30 pl-4 py-1.5 bg-muted/10 rounded-r-md italic text-muted-foreground/90">
      <NodeViewContent />
    </NodeViewWrapper>
  );
}
