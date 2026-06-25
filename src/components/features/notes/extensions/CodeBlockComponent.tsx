'use client';

import { NodeViewWrapper, NodeViewContent, NodeViewProps } from '@tiptap/react';
import React, { useState } from 'react';
import { Check, Copy, WrapText } from 'lucide-react';

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'json', label: 'JSON' },
  { value: 'sql', label: 'SQL' },
  { value: 'bash', label: 'Bash' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'cpp', label: 'C++' },
  { value: 'java', label: 'Java' },
  { value: 'rust', label: 'Rust' },
  { value: 'go', label: 'Go' },
];

export default function CodeBlockComponent({ node, updateAttributes }: NodeViewProps) {
  const [copied, setCopied] = useState(false);
  const [wordWrap, setWordWrap] = useState(true);

  const handleCopy = () => {
    navigator.clipboard.writeText(node.textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lineCount = node.textContent.split('\n').length || 1;
  const language = node.attrs.language || 'javascript';

  return (
    <NodeViewWrapper className="code-block-wrapper relative border border-border/80 rounded-xl overflow-hidden my-6 bg-zinc-950 dark:bg-black shadow-md">
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/90 dark:bg-zinc-900 border-b border-border/40 text-xs text-zinc-400 select-none">
        <select
          value={language}
          onChange={(e) => updateAttributes({ language: e.target.value })}
          className="bg-transparent border-none outline-none cursor-pointer focus:ring-0 text-zinc-300 font-mono py-0.5 rounded hover:bg-zinc-800/50 px-1"
        >
          <option value="" disabled className="bg-zinc-900 text-zinc-500">Select language</option>
          {LANGUAGES.map((lang) => (
            <option key={lang.value} value={lang.value} className="bg-zinc-900 text-zinc-300">
              {lang.label}
            </option>
          ))}
        </select>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setWordWrap(!wordWrap)}
            className={`hover:text-zinc-200 transition px-2 py-1 rounded hover:bg-zinc-800 flex items-center gap-1 ${
              wordWrap ? 'text-zinc-200 bg-zinc-800/40' : 'text-zinc-400'
            }`}
            title="Toggle Word Wrap"
          >
            <WrapText className="h-3.5 w-3.5" />
            <span className="text-[10px] hidden sm:inline">{wordWrap ? 'Wrap On' : 'Wrap Off'}</span>
          </button>
          
          <button
            onClick={handleCopy}
            className="hover:text-zinc-200 transition px-2 py-1 rounded hover:bg-zinc-800 flex items-center gap-1.5"
            title="Copy Code"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-green-400" />
                <span className="text-[10px] text-green-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span className="text-[10px]">Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex font-mono text-xs leading-relaxed overflow-x-auto relative">
        {/* Line Numbers strip */}
        <div className="select-none text-zinc-600 text-right pr-3 pl-4 py-4 border-r border-zinc-800 bg-zinc-900/30 font-mono shrink-0 select-none text-[11px] leading-[20px]">
          {Array.from({ length: lineCount }).map((_, i) => (
            <div key={i} className="h-5">{i + 1}</div>
          ))}
        </div>
        
        {/* Code View Canvas */}
        <pre className={`p-4 m-0 flex-1 leading-5 text-[12px] text-zinc-100 ${
          wordWrap ? 'whitespace-pre-wrap break-all' : 'whitespace-pre overflow-x-auto'
        } focus:outline-none`}>
          <NodeViewContent as={"code" as any} className={`language-${language} block font-mono focus:outline-none`} />
        </pre>
      </div>
    </NodeViewWrapper>
  );
}
