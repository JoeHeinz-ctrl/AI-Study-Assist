'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Placeholder from '@tiptap/extension-placeholder';
import { Markdown } from 'tiptap-markdown';
import { SearchAndReplace } from '@sereneinserenade/tiptap-search-and-replace';

// UI components
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';

// Custom extensions
import CustomBlockquote from './extensions/CustomBlockquote';
import CustomCodeBlock from './extensions/CustomCodeBlock';
import CustomImage from './extensions/CustomImage';
import SlashSuggestion from './extensions/SlashSuggestion';

// Icons
import {
  BrainCircuit,
  Save,
  Undo2,
  Redo2,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  Code,
  Code2,
  Table as TableIcon,
  Link2,
  Image as ImageIcon,
  Minus,
  Search,
  Maximize2,
  Download,
  BookOpen,
  Sparkles,
  Clock,
  FileDown,
  X,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  FileText,
  AlignLeft,
  Trash2,
  Lightbulb,
  Brain,
  Key,
  Flame
} from 'lucide-react';

interface NoteProps {
  initialData?: {
    _id: string;
    title: string;
    content: string;
    updatedAt?: string;
    tags?: string[];
  };
}

export function NoteEditor({ initialData }: NoteProps) {
  const [title, setTitle] = useState(initialData?.title || 'Untitled Note');
  const [content, setContent] = useState(initialData?.content || '');
  const [isAutoTitle, setIsAutoTitle] = useState(!initialData || initialData.title === 'Untitled Note');
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('edit');
  const [isSaving, setIsSaving] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [savedStatus, setSavedStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [isFocusMode, setIsFocusMode] = useState(false);
  
  // Find and replace states
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [matchCase, setMatchCase] = useState(false);

  // Slash Suggestion states
  const [slashQuery, setSlashQuery] = useState('');
  const [slashRange, setSlashRange] = useState<{ from: number; to: number } | null>(null);
  const [slashCoords, setSlashCoords] = useState<{ top: number; left: number } | null>(null);
  const [slashSelectedIndex, setSlashSelectedIndex] = useState(0);

  // Table of Contents state
  const [headings, setHeadings] = useState<{ id: string; text: string; level: number; pos: number }[]>([]);

  const router = useRouter();
  const searchParams = useSearchParams();
  const queryFolderId = searchParams.get('folderId');
  const queryClient = useQueryClient();
  const isNew = !initialData;

  // Reading progress + scroll tracking
  const [readingProgress, setReadingProgress] = useState(0);
  const [activeHeadingText, setActiveHeadingText] = useState<string | null>(null);

  const handleScrollProgress = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const max = scrollHeight - clientHeight;
    setReadingProgress(max > 0 ? Math.min(100, (scrollTop / max) * 100) : 0);
  }, []);

  // Mutation to save note content
  const saveMutation = useMutation({
    mutationFn: async (variables?: { title?: string; content?: string }) => {
      const url = isNew ? '/api/notes' : `/api/notes/${initialData!._id}`;
      const method = isNew ? 'POST' : 'PATCH';
      
      const activeTitle = variables?.title !== undefined ? variables.title : title;
      const activeContent = variables?.content !== undefined ? variables.content : content;
      
      const body: any = { title: activeTitle, content: activeContent };
      if (isNew) {
        const folderId = queryFolderId || (initialData as any)?.folderId;
        if (folderId) {
          body.folderId = folderId;
        }
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Save failed: ${res.status} ${errText}`);
      }
      return res.json();
    },
    onMutate: () => {
      setIsSaving(true);
      setSavedStatus('saving');
    },
    onSuccess: (data) => {
      setIsSaving(false);
      setSavedStatus('saved');
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      if (data?._id) {
        queryClient.invalidateQueries({ queryKey: ['note', data._id] });
      }
      if (isNew && data?._id) {
        router.replace(`/notes/${data._id}`);
      }
    },
    onError: (err) => {
      setIsSaving(false);
      setSavedStatus('error');
      console.error('Save error:', err);
      toast.error('Your note could not be saved. Please try again.');
    }
  });

  // Mutation to delete this note
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!initialData?._id) throw new Error('No note to delete');
      const res = await fetch(`/api/notes/${initialData._id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      if (initialData?._id) {
        queryClient.invalidateQueries({ queryKey: ['note', initialData._id] });
      }
      toast.success('Note deleted.');
      router.replace('/notes');
    },
    onError: () => {
      toast.error('Failed to delete note. Please try again.');
    }
  });

  const handleDeleteNote = () => {
    if (!confirm(`Delete "${title}"?\n\nThis action cannot be undone.`)) return;
    deleteMutation.mutate();
  };

  // Mutation to enhance note content via AI
  const enhanceMutation = useMutation({
    mutationFn: async () => {
      if (!content) throw new Error('Note is empty');
      const res = await fetch('/api/notes/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error('Enhancement failed');
      return res.json();
    },
    onMutate: () => setIsEnhancing(true),
    onSuccess: (data) => {
      setIsEnhancing(false);
      if (data.content) {
        setContent(data.content);
        if (editor) {
          editor.commands.setContent(data.content);
        }
        setViewMode('preview'); // Automatically switch to a gorgeous preview
        toast.success('Note enhanced and formatted successfully!');
        
        // Immediately save the newly enhanced content to the server to prevent any state lag issues
        saveMutation.mutate({ content: data.content });
      }
    },
    onError: (err) => {
      setIsEnhancing(false);
      console.error(err);
      toast.error('Failed to enhance note.');
    }
  });

  // Slash commands catalog
  const slashItems = useMemo(() => [
    { id: 'h1', title: 'Heading 1', description: 'Big section heading', icon: Heading1, command: ({ editor, range }: any) => editor.chain().focus().deleteRange(range).toggleHeading({ level: 1 }).run() },
    { id: 'h2', title: 'Heading 2', description: 'Medium section heading', icon: Heading2, command: ({ editor, range }: any) => editor.chain().focus().deleteRange(range).toggleHeading({ level: 2 }).run() },
    { id: 'h3', title: 'Heading 3', description: 'Small section heading', icon: Heading3, command: ({ editor, range }: any) => editor.chain().focus().deleteRange(range).toggleHeading({ level: 3 }).run() },
    { id: 'bulletList', title: 'Bullet List', description: 'Simple bulleted list', icon: List, command: ({ editor, range }: any) => editor.chain().focus().deleteRange(range).toggleBulletList().run() },
    { id: 'orderedList', title: 'Numbered List', description: 'Sequential numbered list', icon: ListOrdered, command: ({ editor, range }: any) => editor.chain().focus().deleteRange(range).toggleOrderedList().run() },
    { id: 'checklist', title: 'Checklist', description: 'Interactive task list', icon: ListChecks, command: ({ editor, range }: any) => editor.chain().focus().deleteRange(range).toggleTaskList().run() },
    { id: 'quote', title: 'Quote', description: 'Standard blockquote', icon: Quote, command: ({ editor, range }: any) => editor.chain().focus().deleteRange(range).toggleBlockquote().run() },
    { id: 'codeBlock', title: 'Code Block', description: 'Syntax highlighted code block', icon: Code2, command: ({ editor, range }: any) => editor.chain().focus().deleteRange(range).toggleCodeBlock().run() },
    { id: 'table', title: 'Table', description: 'Insert a 3x3 grid table', icon: TableIcon, command: ({ editor, range }: any) => editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
    { id: 'divider', title: 'Divider', description: 'Horizontal thematic split line', icon: Minus, command: ({ editor, range }: any) => editor.chain().focus().deleteRange(range).setHorizontalRule().run() },
    { id: 'image', title: 'Image URL', description: 'Embed image from address link', icon: ImageIcon, command: ({ editor, range }: any) => {
      const url = prompt('Enter image web address URL:');
      if (url) {
        editor.chain().focus().deleteRange(range).setImage({ src: url }).run();
      }
    }},
    { id: 'callout', title: 'Callout Box', description: 'Obsidian-style callout block', icon: AlertTriangle, command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().insertContent('[!NOTE] ').run();
    }},
  ], []);

  const filteredSlashItems = useMemo(() => {
    return slashItems.filter(item => item.title.toLowerCase().includes(slashQuery.toLowerCase()));
  }, [slashItems, slashQuery]);

  // Set up Tiptap Editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        blockquote: false,
        codeBlock: false,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline cursor-pointer',
        },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
      Placeholder.configure({
        placeholder: "Start writing...\nType '/' for formatting commands.\nSupports Markdown.\nAutosaves automatically.",
      }),
      Markdown,
      SearchAndReplace.configure({
        searchResultClass: 'bg-yellow-300/60 dark:bg-yellow-950/40 rounded px-0.5 border border-yellow-400/30',
      }),
      CustomBlockquote,
      CustomCodeBlock,
      CustomImage,
      SlashSuggestion.configure({
        suggestion: {
          char: '/',
          command: ({ editor, range, props }: any) => {
            props.command({ editor, range });
          },
          render: () => {
            return {
              onStart: (props: any) => {
                setSlashQuery(props.query);
                setSlashRange(props.range);
                setSlashSelectedIndex(0);
                const rect = props.clientRect?.();
                if (rect) {
                  setSlashCoords({ top: rect.bottom, left: rect.left });
                }
              },
              onUpdate: (props: any) => {
                setSlashQuery(props.query);
                setSlashRange(props.range);
                const rect = props.clientRect?.();
                if (rect) {
                  setSlashCoords({ top: rect.bottom, left: rect.left });
                }
              },
              onExit: () => {
                setSlashRange(null);
                setSlashCoords(null);
              },
            };
          },
        },
      }),
    ],
    content: initialData?.content || '',
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert max-w-none focus:outline-none min-h-[300px] text-base leading-relaxed',
      },
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (readerEvent) => {
              const url = readerEvent.target?.result as string;
              const { schema } = view.state;
              const node = schema.nodes.image.create({ src: url });
              const transaction = view.state.tr.replaceSelectionWith(node);
              view.dispatch(transaction);
            };
            reader.readAsDataURL(file);
            return true;
          }
        }
        return false;
      },
      handlePaste: (view, event) => {
        if (event.clipboardData && event.clipboardData.files && event.clipboardData.files.length > 0) {
          const file = event.clipboardData.files[0];
          if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (readerEvent) => {
              const url = readerEvent.target?.result as string;
              const { schema } = view.state;
              const node = schema.nodes.image.create({ src: url });
              const transaction = view.state.tr.replaceSelectionWith(node);
              view.dispatch(transaction);
            };
            reader.readAsDataURL(file);
            return true;
          }
        }
        return false;
      },
      handleKeyDown: (view, event) => {
        if (slashRange && slashCoords && filteredSlashItems.length > 0) {
          if (event.key === 'ArrowDown') {
            setSlashSelectedIndex((prev) => (prev + 1) % filteredSlashItems.length);
            return true;
          }
          if (event.key === 'ArrowUp') {
            setSlashSelectedIndex((prev) => (prev - 1 + filteredSlashItems.length) % filteredSlashItems.length);
            return true;
          }
          if (event.key === 'Enter') {
            const item = filteredSlashItems[slashSelectedIndex];
            if (item && editor) {
              item.command({ editor, range: slashRange });
              setSlashRange(null);
              setSlashCoords(null);
              return true;
            }
          }
          if (event.key === 'Escape') {
            setSlashRange(null);
            setSlashCoords(null);
            return true;
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      const markdown = (editor.storage as any).markdown.getMarkdown();
      setContent(markdown);
      updateHeadings(editor);
    },
  });

  // Extract headings for Table of Contents
  const updateHeadings = (editorInstance: any) => {
    const list: any[] = [];
    editorInstance.state.doc.descendants((node: any, pos: number) => {
      if (node.type.name === 'heading') {
        const level = node.attrs.level;
        const text = node.textContent;
        list.push({ id: `heading-${pos}`, text, level, pos });
      }
    });
    setHeadings(list);
  };

  const scrollToHeading = (pos: number) => {
    if (!editor) return;
    editor.commands.focus(pos);
    editor.commands.scrollIntoView();
  };

  // Find & Replace Search Sync Effect
  useEffect(() => {
    if (editor && showFindReplace) {
      editor.commands.setCaseSensitive(matchCase);
      editor.commands.setSearchTerm(findText);
    } else if (editor && !showFindReplace) {
      editor.commands.setSearchTerm('');
    }
  }, [findText, matchCase, showFindReplace, editor]);

  // Load content once when initialData loads or switches note ID
  useEffect(() => {
    if (editor && initialData) {
      const currentMarkdown = (editor.storage as any).markdown.getMarkdown();
      if (initialData.content !== currentMarkdown) {
        editor.commands.setContent(initialData.content);
        setTimeout(() => updateHeadings(editor), 150);
      }
    }
  }, [initialData?._id, editor]);

  // Autosave after 2 seconds of inactivity
  useEffect(() => {
    if (isNew && !content && title === 'Untitled Note') return;
    
    const timeoutId = setTimeout(() => {
      if (title !== initialData?.title || content !== initialData?.content) {
        saveMutation.mutate(undefined);
      }
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [title, content, initialData, isNew]);

  // Auto-generate title from first line of content if user hasn't edited it manually
  useEffect(() => {
    if (isAutoTitle && content) {
       const firstLine = content.split('\n').find(line => line.trim().length > 0) || '';
       const cleanTitle = firstLine.replace(/^[#*\s\[\]!xX\-]+/, '').substring(0, 60).trim();
       if (cleanTitle) {
          setTitle(cleanTitle);
       } else {
          setTitle('Untitled Note');
       }
    }
  }, [content, isAutoTitle]);

  // IntersectionObserver — track active heading for TOC highlight
  useEffect(() => {
    if (!editor || viewMode === 'preview') return;

    // Small delay so the DOM is settled after content loads
    const timer = setTimeout(() => {
      const proseMirrorEl = document.querySelector('.ProseMirror');
      if (!proseMirrorEl) return;
      const headingEls = proseMirrorEl.querySelectorAll('h1, h2, h3');
      if (headingEls.length === 0) return;

      const observer = new IntersectionObserver(
        (entries) => {
          const visible = entries.filter((e) => e.isIntersecting);
          if (visible.length > 0) {
            setActiveHeadingText(visible[0].target.textContent || null);
          }
        },
        { rootMargin: '-10% 0px -75% 0px', threshold: 0 }
      );

      headingEls.forEach((el) => observer.observe(el));
      return () => observer.disconnect();
    }, 300);

    return () => clearTimeout(timer);
  }, [editor, headings, viewMode]);



  // Find & Replace Controls Handlers
  const handleNext = () => editor?.commands.nextSearchResult();
  const handlePrev = () => editor?.commands.previousSearchResult();
  const handleReplace = () => {
    if (!editor) return;
    editor.commands.setReplaceTerm(replaceText);
    editor.commands.replace();
  };
  const handleReplaceAll = () => {
    if (!editor) return;
    editor.commands.setReplaceTerm(replaceText);
    editor.commands.replaceAll();
  };

  // Word statistics calculations
  const textContent = editor ? editor.getText() : '';
  const charCount = textContent.length;
  const wordCount = textContent.trim() ? textContent.trim().split(/\s+/).length : 0;
  const readingTime = Math.ceil(wordCount / 200) || 1;

  // Client Side File Downloader
  const downloadFile = (contentStr: string, filename: string, contentType: string) => {
    const blob = new Blob([contentStr], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportMarkdown = () => {
    if (!editor) return;
    const md = (editor.storage as any).markdown.getMarkdown();
    downloadFile(md, `${title || 'note'}.md`, 'text/markdown');
  };

  const exportHTML = () => {
    if (!editor) return;
    const html = editor.getHTML();
    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #111827; }
    h1 { border-bottom: 1px solid #e5e7eb; padding-bottom: 12px; margin-top: 2rem; font-size: 2.25rem; }
    h2 { font-size: 1.5rem; border-bottom: 1px solid #f3f4f6; padding-bottom: 8px; margin-top: 1.75rem; }
    h3 { font-size: 1.25rem; margin-top: 1.5rem; }
    p { margin: 1rem 0; }
    blockquote { border-left: 4px solid #e5e7eb; padding-left: 16px; color: #4b5563; font-style: italic; margin: 1.5rem 0; }
    pre { background: #f3f4f6; padding: 16px; border-radius: 8px; overflow-x: auto; font-family: monospace; }
    code { font-family: monospace; background: #f3f4f6; padding: 2px 4px; border-radius: 4px; font-size: 0.9em; }
    pre code { background: none; padding: 0; border-radius: 0; }
    table { border-collapse: collapse; width: 100%; margin: 1.5rem 0; }
    th, td { border: 1px solid #e5e7eb; padding: 8px 12px; text-align: left; }
    th { background-color: #f9fafb; font-weight: bold; }
    ul, ol { padding-left: 1.5rem; margin: 1rem 0; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  ${html}
</body>
</html>`;
    downloadFile(fullHtml, `${title || 'note'}.html`, 'text/html');
  };

  const exportText = () => {
    if (!editor) return;
    const txt = editor.getText();
    downloadFile(txt, `${title || 'note'}.txt`, 'text/plain');
  };

  // Custom renderer for callout nodes in ReactMarkdown
  const markdownComponents = {
    blockquote: ({ children, ...props }: any) => {
      let textContentStr = '';
      const extractText = (node: any): string => {
        if (!node) return '';
        if (typeof node === 'string') return node;
        if (Array.isArray(node)) return node.map(extractText).join('');
        if (node.props && node.props.children) return extractText(node.props.children);
        return '';
      };

      textContentStr = extractText(children);
      const match = textContentStr.match(/^\[!(NOTE|INFO|TODO|WARNING|ERROR|SUCCESS|TIP|DEFINITION|KEY|EXAMPLE|IMPORTANT)\]/i);

      if (match) {
        const type = match[1].toUpperCase();
        let bgClass = 'bg-blue-50/70 border-blue-500 dark:bg-blue-950/20 dark:border-blue-900/50 text-blue-950 dark:text-blue-100';
        let titleClass = 'text-blue-800 dark:text-blue-300';
        let Icon = Info;
        let titleLabel = 'Note';

        if (type === 'WARNING') {
          bgClass = 'bg-amber-50/70 border-amber-500 dark:bg-amber-950/20 dark:border-amber-900/50 text-amber-950 dark:text-amber-100';
          titleClass = 'text-amber-800 dark:text-amber-300';
          Icon = AlertTriangle;
          titleLabel = 'Warning';
        } else if (type === 'ERROR') {
          bgClass = 'bg-red-50/70 border-red-500 dark:bg-red-950/20 dark:border-red-900/50 text-red-950 dark:text-red-100';
          titleClass = 'text-red-800 dark:text-red-300';
          Icon = XCircle;
          titleLabel = 'Error';
        } else if (type === 'SUCCESS') {
          bgClass = 'bg-green-50/70 border-green-500 dark:bg-green-950/20 dark:border-green-900/50 text-green-950 dark:text-green-100';
          titleClass = 'text-green-800 dark:text-green-300';
          Icon = CheckCircle;
          titleLabel = 'Success';
        } else if (type === 'TODO') {
          bgClass = 'bg-purple-50/70 border-purple-500 dark:bg-purple-950/20 dark:border-purple-900/50 text-purple-950 dark:text-purple-100';
          titleClass = 'text-purple-800 dark:text-purple-300';
          Icon = FileText;
          titleLabel = 'Todo';
        } else if (type === 'INFO') {
          bgClass = 'bg-sky-50/70 border-sky-500 dark:bg-sky-950/20 dark:border-sky-900/50 text-sky-950 dark:text-sky-100';
          titleClass = 'text-sky-800 dark:text-sky-300';
          Icon = Info;
          titleLabel = 'Info';
        } else if (type === 'TIP') {
          bgClass = 'bg-emerald-50/70 border-emerald-500 dark:bg-emerald-950/20 dark:border-emerald-900/50 text-emerald-950 dark:text-emerald-100';
          titleClass = 'text-emerald-800 dark:text-emerald-300';
          Icon = Lightbulb;
          titleLabel = 'Tip';
        } else if (type === 'DEFINITION') {
          bgClass = 'bg-violet-50/70 border-violet-500 dark:bg-violet-950/20 dark:border-violet-900/50 text-violet-950 dark:text-violet-100';
          titleClass = 'text-violet-800 dark:text-violet-300';
          Icon = Brain;
          titleLabel = 'Definition';
        } else if (type === 'KEY') {
          bgClass = 'bg-amber-50/70 border-amber-500 dark:bg-amber-950/20 dark:border-amber-900/50 text-amber-950 dark:text-amber-100';
          titleClass = 'text-amber-800 dark:text-amber-300';
          Icon = Key;
          titleLabel = 'Key Point';
        } else if (type === 'EXAMPLE') {
          bgClass = 'bg-orange-50/70 border-orange-500 dark:bg-orange-950/20 dark:border-orange-900/50 text-orange-950 dark:text-orange-100';
          titleClass = 'text-orange-800 dark:text-orange-300';
          Icon = Flame;
          titleLabel = 'Example';
        } else if (type === 'IMPORTANT') {
          bgClass = 'bg-red-50/70 border-red-500 dark:bg-red-950/20 dark:border-red-900/50 text-red-950 dark:text-red-100';
          titleClass = 'text-red-800 dark:text-red-300';
          Icon = AlertTriangle;
          titleLabel = 'Important';
        }

        const cleanChildren = React.Children.map(children, (child: any, childIdx) => {
          if (childIdx === 0 && child.props && child.props.children) {
            const firstParagraphChildren = React.Children.map(child.props.children, (innerChild: any, innerIdx) => {
              if (innerIdx === 0 && typeof innerChild === 'string') {
                return innerChild.replace(/^\[!(NOTE|INFO|TODO|WARNING|ERROR|SUCCESS|TIP|DEFINITION|KEY|EXAMPLE|IMPORTANT)\]/i, '').trim();
              }
              return innerChild;
            });
            return React.cloneElement(child, child.props, firstParagraphChildren);
          }
          return child;
        });

        return (
          <div className={`my-4 border-l-4 rounded-r-lg p-4 ${bgClass} transition-all duration-200 shadow-sm relative overflow-hidden not-prose`}>
            <div className="flex items-center gap-2 mb-2 select-none">
              <Icon className="h-4 w-4 shrink-0" />
              <span className={`font-semibold uppercase tracking-wider text-xs ${titleClass}`}>{titleLabel}</span>
            </div>
            <div className="text-sm leading-relaxed">{cleanChildren}</div>
          </div>
        );
      }
      
      return (
        <blockquote className="border-l-4 border-muted-foreground/30 pl-4 py-1 bg-muted/10 rounded-r-md italic my-4 text-muted-foreground/90" {...props}>
          {children}
        </blockquote>
      );
    }
  };

  // Reusable Main Editor Canvas
  const renderEditorBody = () => {
    if (!editor) return null;

    if (viewMode === 'preview') {
      return (
        <div className="note-reading-view h-full flex flex-col relative border-t">
          {/* Reading Progress Bar */}
          <div className="mv-reading-progress-bar" style={{ width: `${readingProgress}%` }} />

          <div 
            className="note-reading-scroll flex-1 overflow-y-auto select-text" 
            onScroll={handleScrollProgress}
          >
            <div className="max-w-[760px] mx-auto py-8">
              {/* Large Document Title */}
              <h1 className="text-4xl font-extrabold tracking-tight text-foreground mb-4 select-text leading-tight">
                {title}
              </h1>

              {/* Reading Metadata Banner */}
              <div className="note-reading-meta select-none mb-8">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground/75" /> {readingTime} min read
                </span>
                <span className="note-reading-meta-dot">&bull;</span>
                <span className="flex items-center gap-1">
                  <AlignLeft className="h-3.5 w-3.5 text-muted-foreground/75" /> {wordCount} words
                </span>
                {initialData?.updatedAt && (
                  <>
                    <span className="note-reading-meta-dot">&bull;</span>
                    <span>Last edited {format(new Date(initialData.updatedAt), 'MMM d, yyyy h:mm a')}</span>
                  </>
                )}
                {initialData?.tags && initialData.tags.length > 0 && (
                  <>
                    <span className="note-reading-meta-dot">&bull;</span>
                    <div className="flex flex-wrap gap-1">
                      {initialData.tags.map(tag => (
                        <span key={tag} className="note-reading-tag">{tag}</span>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Tiptap content rendered as prose with editor styles */}
              <div className="mv-prose">
                <EditorContent editor={editor} />
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (viewMode === 'split') {
      return (
        <div className="flex-1 grid grid-cols-2 divide-x border-t overflow-hidden h-full">
          {/* Editable Canvas (Left) */}
          <div className="overflow-y-auto p-6 md:p-8 outline-none" onScroll={handleScrollProgress}>
            <EditorContent editor={editor} />
          </div>

          {/* Styled Realtime Preview (Right) */}
          <div className="overflow-y-auto p-6 md:p-8 bg-muted/10 prose dark:prose-invert max-w-none select-text" onScroll={handleScrollProgress}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {content || '*No content yet.*'}
            </ReactMarkdown>
          </div>
        </div>
      );
    }

    // Default Edit Mode (uses editor content wrapper)
    return (
      <div className="flex-1 overflow-y-auto p-6 md:p-8 outline-none border-t" onScroll={handleScrollProgress}>
        <EditorContent editor={editor} />
      </div>
    );
  };

  return (
    <div className="flex h-full w-full gap-6 select-text overflow-hidden relative font-sans text-foreground">
      {/* Print Layout wrapper (hidden inside viewport, printable via window.print) */}
      <div id="print-area-wrapper" className="hidden">
        <h1>{title}</h1>
        {editor && (
          <div className="prose max-w-none">
            <div dangerouslySetInnerHTML={{ __html: editor.getHTML() }} />
          </div>
        )}
      </div>

      {/* Editor Main Canvas Wrapper */}
      <div className="flex-1 flex flex-col h-full bg-background rounded-xl border border-border shadow-sm overflow-hidden min-w-0">
        
        {/* Header toolbar */}
        <div className="flex flex-wrap justify-between items-center bg-card p-4 gap-3 shrink-0 select-none">
          <Input 
            value={title} 
            onChange={(e) => {
              setTitle(e.target.value);
              setIsAutoTitle(false);
            }}
            className="text-xl font-bold border-none shadow-none focus-visible:ring-0 px-0 h-auto flex-1 min-w-[200px]"
            placeholder="Note Title"
          />

          <div className="flex items-center gap-3 shrink-0">
            {/* View Mode controls */}
            <div className="flex items-center gap-0.5 bg-muted p-0.5 rounded-lg border">
              <Button 
                variant={viewMode === 'edit' ? 'secondary' : 'ghost'} 
                size="sm" 
                className="h-7 text-xs px-2.5 rounded-md font-semibold" 
                onClick={() => { setViewMode('edit'); editor?.setEditable(true); }}
              >
                Edit
              </Button>
              <Button 
                variant={viewMode === 'preview' ? 'secondary' : 'ghost'} 
                size="sm" 
                className="h-7 text-xs px-2.5 rounded-md font-semibold" 
                onClick={() => { setViewMode('preview'); editor?.setEditable(false); }}
              >
                Preview
              </Button>
              <Button 
                variant={viewMode === 'split' ? 'secondary' : 'ghost'} 
                size="sm" 
                className="h-7 text-xs px-2.5 rounded-md font-semibold" 
                onClick={() => { setViewMode('split'); editor?.setEditable(true); }}
              >
                Split
              </Button>
            </div>

            <Button variant="default" size="sm" className="gap-1.5 h-8 font-semibold rounded-lg" onClick={() => saveMutation.mutate(undefined)}>
              <Save className="h-3.5 w-3.5" /> Save
            </Button>
            
            <Button 
              variant="secondary" 
              size="sm"
              className="gap-1.5 h-8 font-semibold rounded-lg text-indigo-600 dark:text-indigo-400" 
              onClick={() => enhanceMutation.mutate()}
              disabled={isEnhancing || !content}
            >
              <BrainCircuit className="h-3.5 w-3.5" /> {isEnhancing ? 'Enhancing...' : 'AI Enhance'}
            </Button>

            {/* Delete button — only shown for existing saved notes */}
            {!isNew && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 h-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={handleDeleteNote}
                disabled={deleteMutation.isPending}
                title="Delete this note"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Delete</span>
              </Button>
            )}
          </div>
        </div>

        {/* Retractable Find & Replace Widget */}
        {showFindReplace && (
          <div className="bg-muted/40 dark:bg-zinc-900/40 backdrop-blur-sm border-t px-4 py-2.5 flex flex-wrap items-center gap-2 text-xs select-none border-b">
            <div className="flex items-center gap-1 bg-background border rounded-lg px-2 py-1 flex-1 min-w-[150px]">
              <input
                type="text"
                placeholder="Find..."
                value={findText}
                onChange={(e) => setFindText(e.target.value)}
                className="w-full bg-transparent focus:outline-none border-none py-0.5"
              />
              {findText && (
                <button onClick={() => setFindText('')} className="text-muted-foreground hover:text-foreground">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 bg-background border rounded-lg px-2 py-1 flex-1 min-w-[150px]">
              <input
                type="text"
                placeholder="Replace..."
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
                className="w-full bg-transparent focus:outline-none border-none py-0.5"
              />
              {replaceText && (
                <button onClick={() => setReplaceText('')} className="text-muted-foreground hover:text-foreground">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            <label className="flex items-center gap-1.5 cursor-pointer font-medium text-muted-foreground hover:text-foreground select-none px-1">
              <input
                type="checkbox"
                checked={matchCase}
                onChange={(e) => setMatchCase(e.target.checked)}
                className="rounded border-border text-primary focus:ring-0 w-3.5 h-3.5 cursor-pointer"
              />
              <span>Match Case</span>
            </label>

            <div className="flex items-center gap-1.5 ml-auto">
              <Button variant="outline" size="sm" className="h-7 text-xs px-2.5 rounded-lg" onClick={handlePrev} disabled={!findText}>
                Prev
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-xs px-2.5 rounded-lg" onClick={handleNext} disabled={!findText}>
                Next
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-xs px-2.5 rounded-lg" onClick={handleReplace} disabled={!findText}>
                Replace
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-xs px-2.5 rounded-lg" onClick={handleReplaceAll} disabled={!findText}>
                Replace All
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground" onClick={() => setShowFindReplace(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Sticky Formatting Toolbar */}
        {editor && viewMode !== 'preview' && (
          <div className="flex items-center gap-0.5 bg-card p-2 border-t sticky top-0 z-20 overflow-x-auto scrollbar-none flex-nowrap shrink-0 border-b select-none">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
              <Redo2 className="h-4 w-4" />
            </Button>
            <div className="w-px h-5 bg-border mx-1 shrink-0" />
            
            <Button variant={editor.isActive('bold') ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8 rounded-lg" onClick={() => editor.chain().focus().toggleBold().run()} title="Bold">
              <Bold className="h-4 w-4" />
            </Button>
            <Button variant={editor.isActive('italic') ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8 rounded-lg" onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic">
              <Italic className="h-4 w-4" />
            </Button>
            <Button variant={editor.isActive('underline') ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8 rounded-lg" onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline">
              <UnderlineIcon className="h-4 w-4" />
            </Button>
            <Button variant={editor.isActive('strike') ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8 rounded-lg" onClick={() => editor.chain().focus().toggleStrike().run()} title="Strikethrough">
              <Strikethrough className="h-4 w-4" />
            </Button>
            <div className="w-px h-5 bg-border mx-1 shrink-0" />

            <Button variant={editor.isActive('heading', { level: 1 }) ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8 rounded-lg font-mono text-xs font-bold" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Heading 1">
              H1
            </Button>
            <Button variant={editor.isActive('heading', { level: 2 }) ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8 rounded-lg font-mono text-xs font-bold" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading 2">
              H2
            </Button>
            <Button variant={editor.isActive('heading', { level: 3 }) ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8 rounded-lg font-mono text-xs font-bold" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Heading 3">
              H3
            </Button>
            <div className="w-px h-5 bg-border mx-1 shrink-0" />

            <Button variant={editor.isActive('bulletList') ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8 rounded-lg" onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet List">
              <List className="h-4 w-4" />
            </Button>
            <Button variant={editor.isActive('orderedList') ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8 rounded-lg" onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered List">
              <ListOrdered className="h-4 w-4" />
            </Button>
            <Button variant={editor.isActive('taskList') ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8 rounded-lg" onClick={() => editor.chain().focus().toggleTaskList().run()} title="Checklist">
              <ListChecks className="h-4 w-4" />
            </Button>
            <div className="w-px h-5 bg-border mx-1 shrink-0" />

            <Button variant={editor.isActive('blockquote') ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8 rounded-lg" onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Blockquote / Callout">
              <Quote className="h-4 w-4" />
            </Button>
            <Button variant={editor.isActive('code') ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8 rounded-lg" onClick={() => editor.chain().focus().toggleCode().run()} title="Inline Code">
              <Code className="h-4 w-4" />
            </Button>
            <Button variant={editor.isActive('codeBlock') ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8 rounded-lg" onClick={() => editor.chain().focus().toggleCodeBlock().run()} title="Code Block">
              <Code2 className="h-4 w-4" />
            </Button>
            <Button variant={editor.isActive('table') ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8 rounded-lg" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="Table">
              <TableIcon className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => {
              const url = prompt('Enter hyperlink URL:');
              if (url) {
                editor.chain().focus().setLink({ href: url }).run();
              } else if (url === '') {
                editor.chain().focus().unsetLink().run();
              }
            }} title="Insert Link">
              <Link2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => {
              const url = prompt('Enter image URL:');
              if (url) {
                editor.chain().focus().setImage({ src: url }).run();
              }
            }} title="Insert Image Link">
              <ImageIcon className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Divider">
              <Minus className="h-4 w-4" />
            </Button>
            
            <div className="flex-1 shrink-0" />
            
            <Button variant={showFindReplace ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8 rounded-lg shrink-0" onClick={() => setShowFindReplace(!showFindReplace)} title="Find & Replace">
              <Search className="h-4 w-4" />
            </Button>
            
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg shrink-0" onClick={() => setIsFocusMode(true)} title="Focus Mode">
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Inline Floating Table Action Toolbar */}
        {editor && editor.isActive('table') && viewMode !== 'preview' && (
          <div className="flex items-center flex-wrap gap-1 p-1 bg-zinc-900 text-zinc-100 border border-zinc-800 rounded-lg shadow-lg text-[10px] sticky top-[48px] z-10 w-fit mx-auto my-2 shrink-0 select-none">
            <span className="px-1.5 text-zinc-500 uppercase tracking-wider text-[8px] font-bold">Table Options:</span>
            <button onClick={() => editor.chain().focus().addColumnBefore().run()} className="hover:bg-zinc-800 transition px-2 py-1 rounded">Col Left</button>
            <button onClick={() => editor.chain().focus().addColumnAfter().run()} className="hover:bg-zinc-800 transition px-2 py-1 rounded">Col Right</button>
            <button onClick={() => editor.chain().focus().deleteColumn().run()} className="hover:bg-zinc-800 transition px-2 py-1 text-red-400 rounded">Del Col</button>
            <div className="w-px h-3.5 bg-zinc-800 mx-0.5" />
            <button onClick={() => editor.chain().focus().addRowBefore().run()} className="hover:bg-zinc-800 transition px-2 py-1 rounded">Row Above</button>
            <button onClick={() => editor.chain().focus().addRowAfter().run()} className="hover:bg-zinc-800 transition px-2 py-1 rounded">Row Below</button>
            <button onClick={() => editor.chain().focus().deleteRow().run()} className="hover:bg-zinc-800 transition px-2 py-1 text-red-400 rounded">Del Row</button>
            <div className="w-px h-3.5 bg-zinc-800 mx-0.5" />
            <button onClick={() => editor.chain().focus().deleteTable().run()} className="hover:bg-red-950/80 transition px-2 py-1 text-red-400 rounded font-semibold">Delete Table</button>
          </div>
        )}

        {/* Main Editor Content Area */}
        {renderEditorBody()}

        {/* Word Statistics Footer */}
        <div className="bg-card px-4 py-2 border-t flex justify-between items-center text-xs text-muted-foreground select-none shrink-0">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <AlignLeft className="h-3.5 w-3.5" /> {wordCount} words
            </span>
            <span>{charCount} chars</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {readingTime} min read
            </span>
          </div>
          <div>
            {savedStatus === 'saving' ? (
              <span className="text-yellow-600 dark:text-yellow-400 font-medium">Saving...</span>
            ) : savedStatus === 'error' ? (
              <span className="text-destructive font-medium">⚠ Save Error</span>
            ) : (
              <span className="text-green-600 dark:text-green-400 font-medium">✓ Saved</span>
            )}
          </div>
        </div>
      </div>

      {/* Cursor Floating Slash Commands Menu */}
      {slashCoords && slashRange && (
        <div
          style={{
            position: 'fixed',
            top: `${slashCoords.top + 8}px`,
            left: `${slashCoords.left}px`,
            zIndex: 1000,
          }}
          className="w-72 bg-popover text-popover-foreground border border-border shadow-2xl rounded-xl p-1 max-h-72 overflow-y-auto animate-in fade-in-50 slide-in-from-top-2 duration-150"
        >
          {filteredSlashItems.length === 0 ? (
            <div className="px-3 py-2 text-xs text-muted-foreground select-none">No command matches</div>
          ) : (
            filteredSlashItems.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (editor && slashRange) {
                      item.command({ editor, range: slashRange });
                      setSlashRange(null);
                      setSlashCoords(null);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg text-xs transition ${
                    idx === slashSelectedIndex
                      ? 'bg-accent text-accent-foreground font-semibold'
                      : 'hover:bg-muted hover:text-foreground text-muted-foreground'
                  }`}
                >
                  <div className={`p-1.5 rounded-md border shrink-0 ${
                    idx === slashSelectedIndex ? 'bg-background border-accent-foreground/10' : 'bg-muted border-border/80'
                  }`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="truncate text-foreground font-medium">{item.title}</span>
                    <span className="text-[10px] text-muted-foreground/80 truncate font-normal">{item.description}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}

      {/* Right Desktop Sidebar: Outline outline & Controls */}
      {!isFocusMode && (
        <div className="w-64 border rounded-xl p-4 bg-card shrink-0 flex flex-col gap-5 overflow-y-auto hidden xl:flex select-none">
          {/* Export dropdown */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Export Document</span>
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center justify-between gap-2 border border-border/80 bg-background text-xs font-semibold h-9 rounded-lg px-3.5 py-2 hover:bg-muted hover:text-foreground transition select-none cursor-pointer w-full">
                <span className="flex items-center gap-2">
                  <Download className="h-3.5 w-3.5 text-muted-foreground" /> Export File
                </span>
                <span className="text-[10px] text-muted-foreground/60">▼</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuItem onClick={exportMarkdown} className="cursor-pointer gap-2.5 py-2">
                  <FileDown className="h-4 w-4 text-emerald-500" />
                  <span className="text-xs font-medium">Export as Markdown (.md)</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportHTML} className="cursor-pointer gap-2.5 py-2">
                  <FileDown className="h-4 w-4 text-blue-500" />
                  <span className="text-xs font-medium">Export as HTML (.html)</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportText} className="cursor-pointer gap-2.5 py-2">
                  <FileDown className="h-4 w-4 text-orange-500" />
                  <span className="text-xs font-medium">Export as Plain Text (.txt)</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.print()} className="cursor-pointer gap-2.5 py-2">
                  <FileDown className="h-4 w-4 text-rose-500" />
                  <span className="text-xs font-medium">Export as PDF (Print)</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Table of Contents heading Outline */}
          <div className="flex flex-col gap-2 border-t pt-4 flex-1 overflow-hidden">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Outline</span>
            {headings.length > 0 ? (
              <nav className="flex flex-col gap-1 overflow-y-auto pr-1 flex-1 max-h-[300px]">
                {headings.map((heading) => {
                  const isActive = activeHeadingText === heading.text;
                  return (
                    <button
                      key={heading.id}
                      onClick={() => scrollToHeading(heading.pos)}
                      className={`text-left text-[11px] transition-all py-1.5 rounded px-2.5 truncate w-full ${
                        isActive
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'hover:text-foreground hover:bg-muted/40 text-muted-foreground'
                      } ${
                        heading.level === 1 
                          ? 'pl-2 font-bold' 
                          : heading.level === 2 
                            ? 'pl-5 font-medium' 
                            : 'pl-8'
                      }`}
                      title={heading.text}
                    >
                      {heading.text}
                    </button>
                  );
                })}
              </nav>
            ) : (
              <div className="text-[11px] text-muted-foreground/50 italic py-1 pl-1">No headings in note.</div>
            )}
          </div>
        </div>
      )}

      {/* Focus Mode Fullscreen Overlay view */}
      {isFocusMode && (
        <div className="fixed inset-0 z-50 bg-background overflow-hidden p-6 md:p-10 flex flex-col items-center select-text">
          <div className="w-full max-w-3xl flex justify-between items-center mb-6 border-b pb-4 select-none shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-500" />
              <span className="text-xs font-bold tracking-widest uppercase text-muted-foreground">Focus Mode</span>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground/80">
                {wordCount} words &bull; {readingTime} min read
              </span>
              <Button variant="outline" size="sm" className="h-8 font-semibold rounded-lg text-xs" onClick={() => setIsFocusMode(false)}>
                Exit Focus
              </Button>
            </div>
          </div>
          
          <div className="w-full max-w-3xl flex-1 flex flex-col min-h-0 bg-background border rounded-xl shadow-sm overflow-hidden relative">
            {/* Reading Progress Bar */}
            <div className="mv-reading-progress-bar" style={{ width: `${readingProgress}%` }} />

            {/* Sticky toolbar in focus mode */}
            {editor && (
              <div className="flex items-center gap-0.5 bg-card p-2 border-b overflow-x-auto scrollbar-none flex-nowrap shrink-0 select-none">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
                  <Undo2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
                  <Redo2 className="h-4 w-4" />
                </Button>
                <div className="w-px h-5 bg-border mx-1 shrink-0" />
                <Button variant={editor.isActive('bold') ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8 rounded-lg" onClick={() => editor.chain().focus().toggleBold().run()}>
                  <Bold className="h-4 w-4" />
                </Button>
                <Button variant={editor.isActive('italic') ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8 rounded-lg" onClick={() => editor.chain().focus().toggleItalic().run()}>
                  <Italic className="h-4 w-4" />
                </Button>
                <Button variant={editor.isActive('underline') ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8 rounded-lg" onClick={() => editor.chain().focus().toggleUnderline().run()}>
                  <UnderlineIcon className="h-4 w-4" />
                </Button>
                <Button variant={editor.isActive('strike') ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8 rounded-lg" onClick={() => editor.chain().focus().toggleStrike().run()}>
                  <Strikethrough className="h-4 w-4" />
                </Button>
                <div className="w-px h-5 bg-border mx-1 shrink-0" />
                <Button variant={editor.isActive('bulletList') ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8 rounded-lg" onClick={() => editor.chain().focus().toggleBulletList().run()}>
                  <List className="h-4 w-4" />
                </Button>
                <Button variant={editor.isActive('orderedList') ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8 rounded-lg" onClick={() => editor.chain().focus().toggleOrderedList().run()}>
                  <ListOrdered className="h-4 w-4" />
                </Button>
                <Button variant={editor.isActive('taskList') ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8 rounded-lg" onClick={() => editor.chain().focus().toggleTaskList().run()}>
                  <ListChecks className="h-4 w-4" />
                </Button>
                <div className="w-px h-5 bg-border mx-1 shrink-0" />
                <Button variant={editor.isActive('blockquote') ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8 rounded-lg" onClick={() => editor.chain().focus().toggleBlockquote().run()}>
                  <Quote className="h-4 w-4" />
                </Button>
                <Button variant={editor.isActive('code') ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8 rounded-lg" onClick={() => editor.chain().focus().toggleCode().run()}>
                  <Code className="h-4 w-4" />
                </Button>
                <Button variant={editor.isActive('codeBlock') ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8 rounded-lg" onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
                  <Code2 className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            {/* Title and canvas body */}
            <div className="p-4 border-b shrink-0 flex items-center gap-2 select-none">
              <Input 
                value={title} 
                onChange={(e) => {
                  setTitle(e.target.value);
                  setIsAutoTitle(false);
                }}
                className="text-lg font-bold border-none shadow-none focus-visible:ring-0 px-0 h-auto flex-1"
                placeholder="Note Title"
              />
            </div>
            
            {/* Editor Canvas Scroll container */}
            <div className="flex-1 overflow-y-auto p-6 md:p-10 outline-none" onScroll={handleScrollProgress}>
              <EditorContent editor={editor} />
            </div>

            {/* Word stats floating footer */}
            <div className="bg-card px-4 py-2 border-t flex justify-between items-center text-xs text-muted-foreground select-none shrink-0">
              <span>Focus mode active</span>
              <span>{savedStatus === 'saving' ? 'Saving...' : savedStatus === 'error' ? '⚠ Save Error' : '✓ Saved'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
