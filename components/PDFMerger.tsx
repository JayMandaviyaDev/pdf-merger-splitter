'use client';

import { useState } from 'react';
import { GripVertical, X, FileText, Download, Loader2 } from 'lucide-react';
import FileUpload from './FileUpload';
import { UploadedFile } from '@/types';
import { mergePDFs, getPDFPageCount, downloadPDF } from '@/lib/pdf-utils';

export default function PDFMerger() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleFilesSelected = async (selectedFiles: File[]) => {
    const newFiles: UploadedFile[] = [];

    for (const file of selectedFiles) {
      try {
        const pageCount = await getPDFPageCount(file);
        newFiles.push({
          id: Math.random().toString(36).substr(2, 9),
          file,
          name: file.name,
          pageCount,
        });
      } catch (error) {
        console.error(`Error loading ${file.name}:`, error);
      }
    }

    setFiles([...files, ...newFiles]);
  };

  const removeFile = (id: string) => {
    setFiles(files.filter((f) => f.id !== id));
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newFiles = [...files];
    const draggedFile = newFiles[draggedIndex];
    newFiles.splice(draggedIndex, 1);
    newFiles.splice(index, 0, draggedFile);

    setFiles(newFiles);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      alert('Please upload at least 2 PDF files to merge');
      return;
    }

    setLoading(true);
    try {
      const pdfFiles = files.map((f) => f.file);
      const mergedPdf = await mergePDFs(pdfFiles);
      downloadPDF(mergedPdf, 'merged.pdf');
    } catch (error) {
      console.error('Error merging PDFs:', error);
      alert('Failed to merge PDFs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <FileUpload onFilesSelected={handleFilesSelected} multiple={true} disabled={loading} />

      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Files to Merge ({files.length})
            </h3>
            <button
              onClick={() => setFiles([])}
              className="text-sm text-gray-600 hover:text-black font-medium"
            >
              Clear All
            </button>
          </div>

          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={file.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-3 p-4 bg-white border rounded-lg transition-all cursor-move hover:shadow-md ${
                  draggedIndex === index ? 'opacity-50' : ''
                }`}
              >
                <GripVertical className="h-5 w-5 text-gray-400" />
                <FileText className="h-8 w-8 text-black flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {file.pageCount} {file.pageCount === 1 ? 'page' : 'pages'}
                  </p>
                </div>
                <button
                  onClick={() => removeFile(file.id)}
                  className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded"
                  disabled={loading}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={handleMerge}
            disabled={loading || files.length < 2}
            className="w-full py-3 px-4 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Merging PDFs...
              </>
            ) : (
              <>
                <Download className="h-5 w-5" />
                Merge & Download PDF
              </>
            )}
          </button>

          <p className="text-sm text-gray-500 text-center">
            Drag files to reorder them before merging
          </p>
        </div>
      )}
    </div>
  );
}