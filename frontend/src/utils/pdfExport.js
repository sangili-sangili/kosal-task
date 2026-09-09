import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Capture a DOM element and fit it onto a SINGLE A4 PDF page.
 * The image is scaled down proportionally if the content is taller than A4.
 *
 * @param {string} elementId - The HTML element ID to capture
 * @param {string} filename  - Output PDF filename (without .pdf extension)
 */
export async function downloadElementAsPdf(elementId, filename = 'Booking_Receipt') {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`[pdfExport] Element "${elementId}" not found.`);
    return false;
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: element.scrollWidth,  // avoid right-side clipping
      foreignObjectRendering: false,
      letterRendering: true,
      removeContainer: true,
    });

    const imgData = canvas.toDataURL('image/png');

    // A4 dimensions with 6 mm margin on each side
    const MARGIN = 6;   // mm
    const A4_W = 210; // mm
    const A4_H = 297; // mm
    const maxW = A4_W - MARGIN * 2; // 198 mm usable
    const maxH = A4_H - MARGIN * 2; // 285 mm usable

    // Scale image to fit within printable area — single page, no splitting
    const ratio = canvas.width / canvas.height;
    let imgW = maxW;
    let imgH = imgW / ratio;

    if (imgH > maxH) {
      // Content taller than one page — scale down to fit height
      imgH = maxH;
      imgW = imgH * ratio;
    }

    // Center horizontally
    const offsetX = MARGIN + (maxW - imgW) / 2;
    const offsetY = MARGIN;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    pdf.addImage(imgData, 'PNG', offsetX, offsetY, imgW, imgH);
    pdf.save(`${filename}.pdf`);
    return true;
  } catch (error) {
    console.error('[pdfExport] Error generating PDF:', error);
    window.print(); // graceful fallback
    return false;
  }
}

export default downloadElementAsPdf;
