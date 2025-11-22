'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, Loader2 } from 'lucide-react';
import { updateFragment } from '@/services/api';
import { FormattedUser } from '@/services/auth';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface EditFragmentModalProps {
  fragmentId: string;
  fragmentType: string;
  initialContent: string;
  user: FormattedUser;
  onClose: () => void;
  onUpdated: () => void;
}

export default function EditFragmentModal({
  fragmentId,
  fragmentType,
  initialContent,
  user,
  onClose,
  onUpdated,
}: EditFragmentModalProps) {
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState(initialContent);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [inputMethod, setInputMethod] = useState<'text' | 'file'>('text');
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // For images, default to file upload method
  useEffect(() => {
    if (fragmentType.startsWith('image/')) {
      setInputMethod('file');
    }
  }, [fragmentType]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (inputMethod === 'text' && !content.trim()) {
      toast.warning('Please enter some content.');
      return;
    }

    if (inputMethod === 'file' && !selectedFile) {
      toast.warning('Please select a file.');
      return;
    }

    setLoading(true);
    const updatingId = toast.loading('Updating fragment...');

    try {
      const updateContent = inputMethod === 'file' ? selectedFile! : content;
      await updateFragment(user, fragmentId, updateContent, fragmentType);

      toast.success('Fragment updated successfully!', { id: updatingId });
      onUpdated();
      onClose();
    } catch (err) {
      console.error('Error updating fragment:', err);
      const message = err instanceof Error ? err.message : 'Failed to update fragment.';
      toast.error(message, { id: updatingId });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label className="text-sm text-slate-600">Fragment ID</Label>
        <div className="font-mono text-xs bg-slate-100 p-2 rounded">{fragmentId}</div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm text-slate-600">Fragment Type</Label>
        <div className="font-mono text-xs bg-slate-100 p-2 rounded">{fragmentType}</div>
      </div>

      {/* Input Method Toggle - only for non-images */}
      {!fragmentType.startsWith('image/') && (
        <div className="space-y-2">
          <Label>Input Method</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={inputMethod === 'text' ? 'default' : 'outline'}
              onClick={() => setInputMethod('text')}
              size="sm"
            >
              Text Input
            </Button>
            <Button
              type="button"
              variant={inputMethod === 'file' ? 'default' : 'outline'}
              onClick={() => setInputMethod('file')}
              size="sm"
            >
              File Upload
            </Button>
          </div>
        </div>
      )}

      {/* Text Input */}
      {inputMethod === 'text' && !fragmentType.startsWith('image/') && (
        <div className="space-y-2">
          <Label htmlFor="fragment-content">Content</Label>
          <Textarea
            id="fragment-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type your fragment content here..."
            className="min-h-[200px] font-mono"
            required
          />
        </div>
      )}

      {/* File Upload */}
      {inputMethod === 'file' && (
        <div className="space-y-2">
          <Label>Upload New File</Label>
          <motion.div
            className="border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            animate={{
              scale: isDragging ? 1.02 : 1,
              borderColor: isDragging ? '#7c3aed' : undefined,
              backgroundColor: isDragging ? 'rgba(124,58,237,0.05)' : 'transparent',
            }}
            transition={{ type: 'spring', stiffness: 280, damping: 20 }}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="hidden"
              accept={fragmentType.startsWith('image/') ? 'image/*' : 'text/*,application/json,image/*'}
            />
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            {selectedFile ? (
              <div>
                <p className="text-sm font-medium">{selectedFile.name}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium">Drag and drop a file here, or click to browse</p>
                <p className="text-xs text-gray-500 mt-1">Upload a new file to replace the current content</p>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            'Update Fragment'
          )}
        </Button>
        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
