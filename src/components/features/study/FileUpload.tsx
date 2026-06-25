'use client';

import { useState, useRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  File, 
  FileText, 
  X, 
  Check, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  error?: string;
}

interface FileUploadProps {
  onUploadComplete?: (files: UploadedFile[]) => void;
  maxFiles?: number;
  maxSize?: number; // in MB
  accept?: string[];
}

export function FileUpload({ 
  onUploadComplete, 
  maxFiles = 10,
  maxSize = 50,
  accept = ['pdf', 'docx', 'txt', 'md', 'pptx']
}: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedTypes = {
    pdf: 'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    txt: 'text/plain',
    md: 'text/markdown',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  };

  const acceptString = accept
    .map(type => acceptedTypes[type as keyof typeof acceptedTypes])
    .filter(Boolean)
    .join(',');

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    if (uploadedFiles.length + acceptedFiles.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setIsUploading(true);
    
    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: getFileType(file.name),
      status: 'uploading',
      progress: 0
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);

    // Upload files
    for (let i = 0; i < acceptedFiles.length; i++) {
      const file = acceptedFiles[i];
      const fileId = newFiles[i].id;

      try {
        await uploadFile(file, fileId);
      } catch (error) {
        updateFileStatus(fileId, 'error', 0, error instanceof Error ? error.message : 'Upload failed');
      }
    }

    setIsUploading(false);
    
    const completedFiles = uploadedFiles.filter(f => f.status === 'completed');
    if (completedFiles.length > 0 && onUploadComplete) {
      onUploadComplete(completedFiles);
    }
  }, [uploadedFiles, maxFiles, onUploadComplete]);

  const uploadFile = async (file: File, fileId: string) => {
    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      throw new Error(`File too large. Maximum size is ${maxSize}MB`);
    }

    const formData = new FormData();
    formData.append('file', file);

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId && f.status === 'uploading'
          ? { ...f, progress: Math.min(f.progress + 10, 90) }
          : f
      ));
    }, 200);

    try {
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      const result = await response.json();
      
      // Update to processing status
      updateFileStatus(fileId, 'processing', 100);
      
      // Poll for processing completion
      await pollProcessingStatus(result.documentId, fileId);

    } catch (error) {
      clearInterval(progressInterval);
      throw error;
    }
  };

  const pollProcessingStatus = async (documentId: string, fileId: string) => {
    const maxAttempts = 30; // 30 seconds max
    let attempts = 0;

    const poll = async (): Promise<void> => {
      try {
        const response = await fetch(`/api/documents?id=${documentId}`);
        if (!response.ok) {
          throw new Error('Failed to check processing status');
        }

        const data = await response.json();
        const document = data.documents?.[0];

        if (document?.processingStatus === 'completed') {
          updateFileStatus(fileId, 'completed', 100);
          toast.success(`${document.originalName} processed successfully!`);
          return;
        }

        if (document?.processingStatus === 'failed') {
          throw new Error(document.processingError || 'Processing failed');
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 1000); // Poll every second
        } else {
          throw new Error('Processing timeout');
        }
      } catch (error) {
        updateFileStatus(fileId, 'error', 0, error instanceof Error ? error.message : 'Processing failed');
      }
    };

    poll();
  };

  const updateFileStatus = (id: string, status: UploadedFile['status'], progress: number, error?: string) => {
    setUploadedFiles(prev => prev.map(file =>
      file.id === id
        ? { ...file, status, progress, error }
        : file
    ));
  };

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== id));
  };

  const getFileType = (filename: string): string => {
    const extension = filename.split('.').pop()?.toLowerCase() || '';
    return accept.includes(extension) ? extension : 'unknown';
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <File className="h-4 w-4 text-red-500" />;
      case 'docx':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'txt':
      case 'md':
        return <FileText className="h-4 w-4 text-gray-500" />;
      case 'pptx':
        return <File className="h-4 w-4 text-orange-500" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'completed':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptString.split(',').reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as any),
    maxFiles,
    maxSize: maxSize * 1024 * 1024,
    disabled: isUploading
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary/50'
              }
              ${isUploading ? 'cursor-not-allowed opacity-50' : ''}
            `}
          >
            <input {...getInputProps()} ref={fileInputRef} />
            
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            
            <h3 className="text-lg font-semibold mb-2">
              {isDragActive ? 'Drop files here' : 'Upload Study Materials'}
            </h3>
            
            <p className="text-muted-foreground mb-4">
              Drag & drop files here, or click to select files
            </p>
            
            <p className="text-sm text-muted-foreground">
              Supports: {accept.map(type => type.toUpperCase()).join(', ')} • Max {maxSize}MB per file • Up to {maxFiles} files
            </p>
            
            {!isDragActive && (
              <Button 
                variant="outline" 
                className="mt-4"
                disabled={isUploading}
              >
                Select Files
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {uploadedFiles.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold mb-3">Uploaded Files</h4>
            <div className="space-y-3">
              {uploadedFiles.map((file) => (
                <div key={file.id} className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
                  <div className="flex-shrink-0">
                    {getFileIcon(file.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                    
                    {file.status === 'uploading' || file.status === 'processing' ? (
                      <div className="mt-1">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                          <span>
                            {file.status === 'uploading' ? 'Uploading...' : 'Processing...'}
                          </span>
                          <span>{file.progress}%</span>
                        </div>
                        <Progress value={file.progress} className="h-1" />
                      </div>
                    ) : file.status === 'error' ? (
                      <p className="text-xs text-red-500 mt-1">{file.error}</p>
                    ) : (
                      <p className="text-xs text-green-600 mt-1">Ready for study</p>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(file.status)}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                      disabled={file.status === 'uploading' || file.status === 'processing'}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}