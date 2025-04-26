'use client';

import { useEffect, useRef, useState } from 'react';
import { PDFDocumentProxy } from 'pdfjs-dist';

interface PdfViewerProps {
  file: File | null;
  className?: string;
}

export default function PdfViewer({ file, className }: PdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const initPdfJs = async () => {
      const pdfjsLib = await import('pdfjs-dist');
      // Initialize the worker from a separate file
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.js',
        import.meta.url,
      ).toString();
      return pdfjsLib;
    };

    if (!file) return;

    const loadPdf = async () => {
      try {
        const pdfjsLib = await initPdfJs();
        const fileArrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: fileArrayBuffer }).promise;
        setPdfDoc(pdf);
        renderPage(pdf, 1);
      } catch (error) {
        console.error('Error loading PDF:', error);
      }
    };

    loadPdf();
  }, [file]);

  const renderPage = async (pdf: PDFDocumentProxy, pageNumber: number) => {
    if (!canvasRef.current) return;

    try {
      const page = await pdf.getPage(pageNumber);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) return;

      const viewport = page.getViewport({ scale: 1.5 });
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;
    } catch (error) {
      console.error('Error rendering page:', error);
    }
  };

  const changePage = async (delta: number) => {
    if (!pdfDoc) return;

    const newPage = currentPage + delta;
    if (newPage >= 1 && newPage <= pdfDoc.numPages) {
      setCurrentPage(newPage);
      await renderPage(pdfDoc, newPage);
    }
  };

  if (!file) {
    return <div className="text-center p-4">No PDF file selected</div>;
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative overflow-auto max-h-[80vh] border border-gray-200 rounded-lg">
        <canvas ref={canvasRef} className="max-w-full" />
      </div>
      {pdfDoc && (
        <div className="flex items-center gap-4 mt-4">
          <button
            onClick={() => changePage(-1)}
            disabled={currentPage <= 1}
            className="px-4 py-2 bg-gray-200 rounded-md disabled:opacity-50"
          >
            Previous
          </button>
          <span>
            Page {currentPage} of {pdfDoc.numPages}
          </span>
          <button
            onClick={() => changePage(1)}
            disabled={currentPage >= pdfDoc.numPages}
            className="px-4 py-2 bg-gray-200 rounded-md disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
} 