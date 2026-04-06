// FriendlyTeaching.cl — useExportReport hook
// Client-side hook for generating and downloading PDF reports via the export-report API.

'use client';
import { useState, useCallback } from 'react';
import type { ProgressReportData, InvoiceData } from '@/app/api/export-report/route';

export function useExportReport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportReport = useCallback(async (data: ProgressReportData | InvoiceData) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/export-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Error desconocido' }));
        setError(errData.error ?? `Error ${res.status}`);
        return;
      }

      // Get HTML content and open in a new window for print-to-PDF
      const html = await res.text();
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        setError('No se pudo abrir la ventana. Permite los pop-ups para este sitio.');
        return;
      }

      printWindow.document.write(html);
      printWindow.document.close();

      // Auto-trigger print dialog after a short delay so styles render
      setTimeout(() => {
        printWindow.print();
      }, 500);
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }, []);

  return { exportReport, loading, error };
}
