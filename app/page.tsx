'use client';

import { useState } from 'react';
import { FileStack, Scissors } from 'lucide-react';
import PDFMerger from '@/components/PDFMerger';
import PDFSplitter from '@/components/PDFSplitter';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'merge' | 'split'>('merge');

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            PDF Merger & Splitter
          </h1>
          <p className="text-gray-600">
            Merge multiple PDFs into one or split a PDF into multiple files
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('merge')}
              className={`flex-1 py-4 px-6 font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'merge'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <FileStack className="h-5 w-5" />
              Merge PDFs
            </button>
            <button
              onClick={() => setActiveTab('split')}
              className={`flex-1 py-4 px-6 font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'split'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Scissors className="h-5 w-5" />
              Split PDF
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {activeTab === 'merge' ? <PDFMerger /> : <PDFSplitter />}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>
            All processing happens in your browser. Your files are never uploaded to
            any server.
          </p>
        </div>
      </div>
    </main>
  );
}