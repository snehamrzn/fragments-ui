// app/components/InfoInline.tsx
// Inline, client component version of your Info page suitable for modal usage
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Upload } from 'lucide-react';
import { createFragment } from '@/services/api';
import { getUser, FormattedUser } from '@/services/auth';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

// Supported fragment types
const FRAGMENT_TYPES = [
  { value: 'text/plain', label: 'Plain Text' },
  { value: 'text/markdown', label: 'Markdown' },
  { value: 'text/html', label: 'HTML' },
  { value: 'text/csv', label: 'CSV' },
  { value: 'application/json', label: 'JSON' },
];

type Props = {
  onClose?: () => void;
  onCreated?: () => void;
};

export default function Info({ onClose, onCreated }: Props) {
  const [loading, setLoading] = useState(false);
  const [fragment, setFragment] = useState('');
  const [contentType, setContentType] = useState('text/plain');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [inputMethod, setInputMethod] = useState<'text' | 'file'>('text');
  const [user, setUser] = useState<FormattedUser | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const currentUser = await getUser();
        setUser(currentUser);
      } catch (err) {
        console.error('Failed to load user:', err);
      }
    }
    loadUser();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (file.type && FRAGMENT_TYPES.some((t) => t.value === file.type)) {
        setContentType(file.type);
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (file.type && FRAGMENT_TYPES.some((t) => t.value === file.type)) {
        setContentType(file.type);
      }
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

    if (!user) {
      toast.warning('Please log in to create fragments.');
      return;
    }

    if (inputMethod === 'text' && !fragment.trim()) {
      toast.warning('Please enter some content.');
      return;
    }

    if (inputMethod === 'file' && !selectedFile) {
      toast.warning('Please select a file.');
      return;
    }

    setLoading(true);

    const submittingId = toast.loading('Creating fragment...');

    try {
      const content = inputMethod === 'file' ? selectedFile! : fragment;

      const result = await createFragment(user, content, contentType);

      const fragmentId =
        typeof result === 'object' && result && 'id' in result ? (result as any).id : undefined;

      toast.success(
        fragmentId
          ? `Fragment ${fragmentId} created successfully.`
          : 'Fragment created successfully.',
        { id: submittingId }
      );

      // Reset form state
      setFragment('');
      setSelectedFile(null);
      setContentType('text/plain');
      setInputMethod('text');

      if (onCreated) onCreated();
    } catch (err) {
      console.error('Error creating fragment:', err);
      const message = err instanceof Error ? err.message : 'Failed to add fragment.';
      // Update the loading toast to error
      toast.error(message, { id: submittingId });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Fragment Type Selector */}
      <div className="space-y-2">
        <Label htmlFor="fragment-type">Fragment Type</Label>
        <Select value={contentType} onValueChange={setContentType}>
          <SelectTrigger id="fragment-type">
            <SelectValue placeholder="Select fragment type" />
          </SelectTrigger>
          <SelectContent>
            {FRAGMENT_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label} ({type.value})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Input Method Toggle */}
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

      {/* Text Input */}
      {inputMethod === 'text' && (
        <div className="space-y-2">
          <Label htmlFor="fragment-content">Content</Label>
          <Textarea
            id="fragment-content"
            value={fragment}
            onChange={(e) => setFragment(e.target.value)}
            placeholder="Type your fragment content here..."
            className="min-h-[200px] font-mono"
            required
          />
        </div>
      )}

      {/* File Upload with motion */}
      {inputMethod === 'file' && (
        <div className="space-y-2">
          <Label>File Upload</Label>
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
              accept="text/*,application/json"
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
                <p className="text-xs text-gray-500 mt-1">Supports text and JSON files</p>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Fragment'}
        </Button>
        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
