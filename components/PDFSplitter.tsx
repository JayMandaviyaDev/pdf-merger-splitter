'use client';

import { useState } from 'react';
import { FileText, Download, Loader2, Scissors, AlertCircle } from 'lucide-react';
import FileUpload from './FileUpload';
import { PageRange } from '@/types';
import {
  splitPDF,
  splitPDFIntoIndividual,
  getPDFPageCount,
  downloadPDF,
} from '@/lib/pdf-utils';

export default function PDFSplitter() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [splitType, setSplitType] = useState<'range' | 'individual'>('range');
  const [ranges, setRanges] = useState<PageRange[]>([{ start: 1, end: 1 }]);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelected = async (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) return;

    const selectedFile = selectedFiles[0];
    const fileSizeMB = selectedFile.size / (1024 * 1024);

    // Warn for files larger than 50MB
    if (fileSizeMB > 50) {
      if (!confirm(`This file is ${fileSizeMB.toFixed(1)}MB. Large files may take longer to process. Continue?`)) {
        return;
      }
    }

    setFile(selectedFile);
    setError(null);
    setLoading(true);

    try {
      const count = await getPDFPageCount(selectedFile);
      setPageCount(count);
      setRanges([{ start: 1, end: Math.min(count, 10) }]); // Default to first 10 pages
    } catch (error) {
      console.error('Error loading PDF:', error);
      setError('Failed to load PDF. The file may be corrupted or invalid.');
      setFile(null);
    } finally {
      setLoading(false);
    }
  };

  const addRange = () => {
    const lastRange = ranges[ranges.length - 1];
    const newStart = Math.min(lastRange.end + 1, pageCount);
    setRanges([...ranges, { start: newStart, end: pageCount }]);
  };

  const updateRange = (index: number, field: 'start' | 'end', value: number) => {
    const newRanges = [...ranges];
    newRanges[index][field] = Math.max(1, Math.min(pageCount, value));
    setRanges(newRanges);
  };

  const removeRange = (index: number) => {
    if (ranges.length > 1) {
      setRanges(ranges.filter((_, i) => i !== index));
    }
  };

  const handleSplit = async () => {
    if (!file) return;

    setLoading(true);
    setProgress(0);
    setError(null);

    try {
      let splitPdfs: Uint8Array[];

      if (splitType === 'individual') {
        // Warn if too many pages
        if (pageCount > 100) {
          if (!confirm(`This will create ${pageCount} separate PDF files. This may take a while and consume browser memory. Continue?`)) {
            setLoading(false);
            return;
          }
        }

        // Split with progress updates
        splitPdfs = [];
        const fileBuffer = await file.arrayBuffer();
        const { PDFDocument } = await import('pdf-lib');
        const pdf = await PDFDocument.load(fileBuffer);

        for (let i = 0; i < pageCount; i++) {
          const newPdf = await PDFDocument.create();
          const [page] = await newPdf.copyPages(pdf, [i]);
          newPdf.addPage(page);
          splitPdfs.push(await newPdf.save());
          
          setProgress(Math.round(((i + 1) / pageCount) * 100));
          
          // Allow UI to update every 10 pages
          if (i % 10 === 0) {
            await new Promise(resolve => setTimeout(resolve, 0));
          }
        }

        // Download with delays to prevent browser blocking
        for (let i = 0; i < splitPdfs.length; i++) {
          downloadPDF(splitPdfs[i], `page_${i + 1}.pdf`);
          
          // Add delay between downloads
          if (i < splitPdfs.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      } else {
        // Validate ranges
        for (const range of ranges) {
          if (range.start > range.end) {
            setError('Start page must be less than or equal to end page');
            setLoading(false);
            return;
          }
          if (range.start < 1 || range.end > pageCount) {
            setError(`Page numbers must be between 1 and ${pageCount}`);
            setLoading(false);
            return;
          }
        }

        // Check for overlapping ranges
        const sortedRanges = [...ranges].sort((a, b) => a.start - b.start);
        for (let i = 0; i < sortedRanges.length - 1; i++) {
          if (sortedRanges[i].end >= sortedRanges[i + 1].start) {
            setError('Page ranges cannot overlap');
            setLoading(false);
            return;
          }
        }

        splitPdfs = await splitPDF(file, ranges);
        
        // Download with delays
        for (let i = 0; i < splitPdfs.length; i++) {
          const range = ranges[i];
          downloadPDF(splitPdfs[i], `pages_${range.start}-${range.end}.pdf`);
          setProgress(Math.round(((i + 1) / splitPdfs.length) * 100));
          
          if (i < splitPdfs.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 150));
          }
        }
      }

      // Success message
      setTimeout(() => {
        alert(`✅ Successfully split into ${splitPdfs.length} PDF(s)!`);
        setProgress(0);
      }, 500);

    } catch (error) {
      console.error('Error splitting PDF:', error);
      setError('Failed to split PDF. The file may be too large or corrupted. Try splitting into fewer ranges.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPageCount(0);
    setRanges([{ start: 1, end: 1 }]);
    setError(null);
    setProgress(0);
  };

  const getTotalPages = () => {
    if (splitType === 'individual') return pageCount;
    return ranges.reduce((sum, range) => sum + (range.end - range.start + 1), 0);
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <FileUpload onFilesSelected={handleFileSelected} multiple={false} disabled={loading} />
      ) : (
        <>
          <div className="p-4 bg-white border rounded-lg">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="h-8 w-8 text-red-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {pageCount} {pageCount === 1 ? 'page' : 'pages'} • {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
              <button
                onClick={reset}
                disabled={loading}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
              >
                Change File
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Split Mode</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="splitType"
                      checked={splitType === 'range'}
                      onChange={() => setSplitType('range')}
                      disabled={loading}
                      className="w-4 h-4"
                    />
                    <span>Split by Page Ranges (Recommended)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="splitType"
                      checked={splitType === 'individual'}
                      onChange={() => setSplitType('individual')}
                      disabled={loading}
                      className="w-4 h-4"
                    />
                    <span>Split into Individual Pages</span>
                  </label>
                </div>
              </div>

              {splitType === 'range' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium">Page Ranges</label>
                    <button
                      onClick={addRange}
                      disabled={loading}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
                    >
                      + Add Range
                    </button>
                  </div>

                  {ranges.map((range, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="number"
                          min="1"
                          max={pageCount}
                          value={range.start}
                          onChange={(e) =>
                            updateRange(index, 'start', parseInt(e.target.value) || 1)
                          }
                          disabled={loading}
                          className="w-24 px-3 py-2 border rounded-lg disabled:opacity-50"
                          placeholder="From"
                        />
                        <span className="text-gray-500">to</span>
                        <input
                          type="number"
                          min="1"
                          max={pageCount}
                          value={range.end}
                          onChange={(e) =>
                            updateRange(index, 'end', parseInt(e.target.value) || 1)
                          }
                          disabled={loading}
                          className="w-24 px-3 py-2 border rounded-lg disabled:opacity-50"
                          placeholder="To"
                        />
                        <span className="text-sm text-gray-500">
                          ({range.end - range.start + 1}{' '}
                          {range.end - range.start + 1 === 1 ? 'page' : 'pages'})
                        </span>
                      </div>
                      {ranges.length > 1 && (
                        <button
                          onClick={() => removeRange(index)}
                          disabled={loading}
                          className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {splitType === 'individual' && pageCount > 50 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-800">
                    ⚠️ This will create {pageCount} separate files. For large PDFs, consider using page ranges instead.
                  </p>
                </div>
              )}
            </div>
          </div>

          {loading && progress > 0 && (
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-green-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 text-center">
                Processing... {progress}%
              </p>
            </div>
          )}

          <button
            onClick={handleSplit}
            disabled={loading}
            className="w-full py-3 px-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {progress > 0 ? `Splitting PDF... ${progress}%` : 'Preparing...'}
              </>
            ) : (
              <>
                <Scissors className="h-5 w-5" />
                Split & Download {splitType === 'range' ? `(${ranges.length} ${ranges.length === 1 ? 'file' : 'files'})` : `(${pageCount} files)`}
              </>
            )}
          </button>

          <div className="text-sm text-gray-500 space-y-1">
            {splitType === 'individual' ? (
              <p className="text-center">
                Will create {pageCount} separate PDF files, one for each page
              </p>
            ) : (
              <p className="text-center">
                Will extract {getTotalPages()} {getTotalPages() === 1 ? 'page' : 'pages'} across {ranges.length} {ranges.length === 1 ? 'file' : 'files'}
              </p>
            )}
            <p className="text-center text-xs">
              💡 Tip: Files will download automatically with a small delay between each
            </p>
          </div>
        </>
      )}
    </div>
  );
}