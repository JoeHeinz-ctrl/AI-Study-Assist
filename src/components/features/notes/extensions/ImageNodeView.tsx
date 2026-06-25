'use client';

import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import React, { useState } from 'react';

export default function ImageNodeView({ node, updateAttributes, selected }: NodeViewProps) {
  const { src, alt, width } = node.attrs as { src: string; alt: string | null; width: string };
  const [caption, setCaption] = useState(alt || '');

  const handleWidthChange = (w: string) => {
    updateAttributes({ width: w });
  };

  const handleCaptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCaption(val);
    updateAttributes({ alt: val });
  };

  // Convert width attribute to CSS styles
  const widthStyle = width || '100%';

  return (
    <NodeViewWrapper className={`my-6 flex flex-col items-center group relative ${
      selected ? 'ring-2 ring-primary/50 rounded-xl p-1' : ''
    }`}>
      {/* Resizing / Width controls (visible on hover) */}
      <div className="absolute top-2 right-2 flex items-center gap-1 bg-background/90 dark:bg-zinc-900/90 backdrop-blur-sm border border-border/80 rounded-lg p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 select-none text-[10px] font-semibold text-muted-foreground">
        <span className="px-1 text-[9px] uppercase tracking-wider text-muted-foreground/75">Size:</span>
        {(['25%', '50%', '75%', '100%'] as const).map((w) => (
          <button
            key={w}
            onClick={() => handleWidthChange(w)}
            className={`px-1.5 py-0.5 rounded transition ${
              widthStyle === w
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted hover:text-foreground'
            }`}
          >
            {w}
          </button>
        ))}
      </div>

      {/* Image container */}
      <div 
        className="overflow-hidden rounded-xl border border-border/60 shadow-sm transition-all duration-200"
        style={{ width: widthStyle }}
      >
        <img
          src={src}
          alt={alt || 'Note attachment'}
          className="w-full h-auto object-cover select-none block pointer-events-none"
        />
      </div>

      {/* Caption input */}
      <input
        type="text"
        value={caption}
        onChange={handleCaptionChange}
        placeholder="Add a caption..."
        className="mt-2 text-center text-xs text-muted-foreground placeholder-muted-foreground/50 border-b border-transparent hover:border-border/60 focus:border-primary focus:outline-none w-1/2 bg-transparent py-0.5 transition duration-150"
      />
    </NodeViewWrapper>
  );
}
