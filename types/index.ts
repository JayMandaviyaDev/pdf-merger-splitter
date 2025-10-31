export interface UploadedFile {
  id: string;
  file: File;
  name: string;
  pageCount: number;
  preview?: string;
}

export interface PageRange {
  start: number;
  end: number;
}

export interface SplitOptions {
  ranges: PageRange[];
  type: 'range' | 'individual';
}