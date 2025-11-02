'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  accept?: Record<string, string[]>;
  multiple?: boolean;
  disabled?: boolean;
}

export default function FileUpload({
  onFilesSelected,
  accept = { 'application/pdf': ['.pdf'] },
  multiple = true,
  disabled = false,
}: FileUploadProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      onFilesSelected(acceptedFiles);
    },
    [onFilesSelected]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple,
    disabled,
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors
        ${
          disabled
            ? 'cursor-not-allowed opacity-50 border-gray-200'
            : isDragActive
            ? 'border-black bg-gray-50 cursor-pointer'
            : 'border-gray-300 hover:border-gray-400 cursor-pointer'
        }`}
    >
      <input {...getInputProps()} />
      <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
      {isDragActive ? (
        <p className="text-lg text-black font-medium">Drop the PDF files here...</p>
      ) : (
        <div>
          <p className="text-lg mb-2 font-medium text-gray-900">
            {multiple ? 'Drag & drop PDF files here' : 'Drag & drop a PDF file here'}
          </p>
          <p className="text-sm text-gray-500">or click to select {multiple ? 'files' : 'file'}</p>
        </div>
      )}
    </div>
  );
}