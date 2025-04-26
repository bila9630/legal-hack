'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { cn } from '@/lib/utils';
import { Loader2, ZoomIn, ZoomOut, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PdfViewerProps {
  file: File | null;
  className?: string;
}

export default function PdfViewer({ file, className }: PdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.5);
  const [isRendering, setIsRendering] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const renderPage = useCallback(async (pdf: PDFDocumentProxy, pageNumber: number, pdfjsLib: any) => {
    if (!canvasRef.current) return;

    try {
      setIsRendering(true);
      const page = await pdf.getPage(pageNumber);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) return;

      const viewport = page.getViewport({ scale });
      
      // Calculate the maximum width based on the viewport width
      const maxWidth = window.innerWidth * 0.9; // 90% of viewport width
      const actualScale = scale * Math.min(1, maxWidth / viewport.width);
      const scaledViewport = page.getViewport({ scale: actualScale });

      canvas.height = scaledViewport.height;
      canvas.width = scaledViewport.width;

      await page.render({
        canvasContext: context,
        viewport: scaledViewport,
      }).promise;
    } catch (error) {
      console.error('Error rendering page:', error);
      setError('Failed to render page. Please try again.');
    } finally {
      setIsRendering(false);
    }
  }, [scale]);

  useEffect(() => {
    if (!file || !isMounted) return;

    const loadPdf = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const pdfjsLib = await import('pdfjs-dist');
        
        if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js`;
        }

        const fileArrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: fileArrayBuffer }).promise;
        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        await renderPage(pdf, 1, pdfjsLib);
      } catch (error) {
        console.error('Error loading PDF:', error);
        setError('Failed to load PDF. Please ensure the file is valid and try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadPdf();
  }, [file, renderPage, isMounted]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        changePage(-1);
      } else if (e.key === 'ArrowRight') {
        changePage(1);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentPage]);

  const changePage = async (delta: number) => {
    if (!pdfDoc) return;

    try {
      const pdfjsLib = await import('pdfjs-dist');
      const newPage = currentPage + delta;
      if (newPage >= 1 && newPage <= pdfDoc.numPages) {
        setCurrentPage(newPage);
        await renderPage(pdfDoc, newPage, pdfjsLib);
      }
    } catch (error) {
      console.error('Error changing page:', error);
      setError('Failed to change page. Please try again.');
    }
  };

  const handleZoom = async (delta: number) => {
    const newScale = Math.max(0.5, Math.min(3, scale + delta));
    setScale(newScale);
    if (pdfDoc) {
      const pdfjsLib = await import('pdfjs-dist');
      await renderPage(pdfDoc, currentPage, pdfjsLib);
    }
  };

  const handleDownload = () => {
    if (file) {
      const url = URL.createObjectURL(file);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  if (!isMounted) {
    return null;
  }

  if (!file) {
    return (
      <div className="text-center p-4 text-gray-500">
        No PDF file selected
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <p className="text-gray-500">Loading PDF...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4 text-red-500 bg-red-50 rounded-lg border border-red-200">
        {error}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-center gap-4 w-full", className)}>
      <div className="w-full max-w-4xl bg-background rounded-lg shadow-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground truncate max-w-[200px]" title={file.name}>
            {file.name}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleZoom(-0.25)}
              title="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">{Math.round(scale * 100)}%</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleZoom(0.25)}
              title="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownload}
              title="Download PDF"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="relative">
          {isRendering && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          <canvas ref={canvasRef} className="max-w-full mx-auto" />
        </div>
      </div>

      {pdfDoc && (
        <div className="flex items-center gap-4 bg-background rounded-lg shadow-sm p-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => changePage(-1)}
            disabled={currentPage <= 1 || isRendering}
            title="Previous page"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => changePage(1)}
            disabled={currentPage >= totalPages || isRendering}
            title="Next page"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  );
} 