'use client';

import { useState } from 'react';
import { FileStack, Scissors } from 'lucide-react';
import PDFMerger from '@/components/PDFMerger';
import PDFSplitter from '@/components/PDFSplitter';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'merge' | 'split'>('merge');

  return (
    <main className="min-h-screen bg-black py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            PDF Merger & Splitter
          </h1>
          <p className="text-gray-400">
            Merge multiple PDFs into one or split a PDF into multiple files
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-2xl overflow-hidden border border-gray-200">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('merge')}
              className={`flex-1 py-4 px-6 font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'merge'
                  ? 'bg-black text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FileStack className="h-5 w-5" />
              Merge PDFs
            </button>
            <button
              onClick={() => setActiveTab('split')}
              className={`flex-1 py-4 px-6 font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'split'
                  ? 'bg-black text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Scissors className="h-5 w-5" />
              Split PDF
            </button>
          </div>

          <div className="p-8 bg-white">
            {activeTab === 'merge' ? <PDFMerger /> : <PDFSplitter />}
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-400">
          <p>
            All processing happens in your browser. Your files are never uploaded to
            any server.
          </p>
        </div>
      </div>
    </main>
  );
}