import jsPDF from 'jspdf/dist/jspdf.es.min.js';

export interface ScanPdfData {
  classification: string;
  confidence: number;
  riskLevel: string;
  secondaryPredictions: Array<{ name: string; confidence: number }>;
  abcdeMetrics: {
    asymmetry: number;
    borderIrregularity: number;
    colorDivergence: number;
    diameterProfile: number;
    evolvingTracking: number;
  };
  imageUrl: string;       // URL or base64 data URI
  heatmapUrl?: string;    // URL or base64 data URI
}

/**
 * Fetches an image from a URL and returns it as a base64 data URI.
 * If the input is already a data URI, returns it as-is.
 */
async function imageToBase64(url: string): Promise<string> {
  if (url.startsWith('data:')) return url;

  const response = await fetch(url);
  const blob = await response.blob();

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Generates a clinical PDF report for a skin lesion scan.
 * Returns the PDF as a Blob so the caller can download and/or upload it.
 */
export async function generateScanPdf(data: ScanPdfData): Promise<Blob> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const primary = "#0F172A";
  const secondary = "#475569";

  // 1. Header Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("CLINICAL SKINSHEET SCREENING REPORT", 14, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text(`Generated Session: ${new Date().toLocaleString()} | Reference Pipeline: ML-EFFICIENTNET-V4`, 14, 26);

  // 2. Differential Diagnoses Block (Top 3)
  doc.setTextColor(primary);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("1. Neural Network Differential Diagnoses (Top 3 Predictions)", 14, 52);
  doc.setDrawColor(226, 232, 240);
  doc.line(14, 54, 196, 54);

  // Rank 1: Primary
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`1. Primary Finding: ${data.classification}`, 16, 62);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(secondary);
  doc.text(`Confidence: ${data.confidence}%  [Risk Level: ${data.riskLevel.toUpperCase()}]`, 22, 67);

  // Rank 2 & 3
  const sec1 = data.secondaryPredictions?.[0]
    ? `${data.secondaryPredictions[0].name} (${data.secondaryPredictions[0].confidence}%)`
    : "N/A";
  const sec2 = data.secondaryPredictions?.[1]
    ? `${data.secondaryPredictions[1].name} (${data.secondaryPredictions[1].confidence}%)`
    : "N/A";

  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(`2. Secondary Consideration: ${sec1.split(' (')[0]}`, 16, 75);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(secondary);
  doc.text(`Confidence: ${sec1.includes('(') ? sec1.split(' (')[1].replace(')', '') : 'N/A'}`, 22, 80);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(`3. Tertiary Consideration: ${sec2.split(' (')[0]}`, 16, 88);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(secondary);
  doc.text(`Confidence: ${sec2.includes('(') ? sec2.split(' (')[1].replace(')', '') : 'N/A'}`, 22, 93);

  // 3. Processed Optical Analytics Fields (images)
  doc.setTextColor(primary);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("2. Processed Optical Analytics Fields", 14, 106);
  doc.line(14, 108, 196, 108);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(secondary);

  // Load and embed source image
  try {
    const imageBase64 = await imageToBase64(data.imageUrl);
    doc.text("Original Region-of-Interest", 14, 114);
    doc.addImage(imageBase64, 'JPEG', 14, 116, 58, 58);
  } catch {
    doc.text("Original Region-of-Interest", 14, 114);
    doc.rect(14, 116, 58, 58, 'S');
    doc.text("Image unavailable", 25, 145);
  }

  // Load and embed heatmap
  if (data.heatmapUrl) {
    try {
      const heatmapBase64 = await imageToBase64(data.heatmapUrl);
      doc.text("HiResCAM Saliency Map Overlay", 110, 114);
      doc.addImage(heatmapBase64, 'PNG', 110, 116, 58, 58);
    } catch {
      doc.text("HiResCAM Saliency Map Overlay", 110, 114);
      doc.rect(110, 116, 58, 58, 'S');
      doc.text("Saliency data unavailable", 115, 145);
    }
  } else {
    doc.text("HiResCAM Saliency Map Overlay", 110, 114);
    doc.rect(110, 116, 58, 58, 'S');
    doc.text("Saliency data omitted from pipeline", 115, 145);
  }

  // 4. ABCDE Structural Metrics
  doc.setTextColor(primary);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("3. Computer Vision Structural Metrics (ABCDE Extraction)", 14, 186);
  doc.line(14, 188, 196, 188);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  const m = data.abcdeMetrics || {
    asymmetry: 0, borderIrregularity: 0, colorDivergence: 0, diameterProfile: 0, evolvingTracking: 0
  };

  doc.text(`[A] Asymmetry Metric Index: ${m.asymmetry} / 100`, 14, 195);
  doc.text(`[B] Border Irregularity (Compactness Ratio): ${m.borderIrregularity} / 100`, 14, 201);
  doc.text(`[C] Color Divergence (RGB Variance Vector): ${m.colorDivergence} / 100`, 14, 207);
  doc.text(`[D] Diameter Profile (Relative Frame Scale): ${m.diameterProfile} / 100`, 14, 213);
  doc.text(`[E] Evolving Risk Factor (Baseline Tracking Index): ${m.evolvingTracking} / 100`, 14, 219);

  // 5. Disclaimer
  doc.setFillColor(254, 242, 242);
  doc.rect(14, 238, 182, 34, 'F');
  doc.setDrawColor(239, 68, 68);
  doc.rect(14, 238, 182, 34, 'D');

  doc.setTextColor(153, 27, 27);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("COMPLIANT MEDICAL WARNING & DISCLAIMER NOTE:", 18, 244);

  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  const disclaimerText = "This telemetry report sheet contains automated processing variables compiled via automated digital image calculations and mathematical modeling layers. This automated audit statement does not constitute a formal biopsy confirmation or immediate therapy plan. Provide this documentation directly to a certified professional dermatologist during your incoming scheduled appointment or virtual teledermatology evaluation window.";
  const lines = doc.splitTextToSize(disclaimerText, 174);
  doc.text(lines, 18, 249);

  return doc.output('blob');
}

/**
 * Convenience: generates and triggers a browser download of the PDF.
 */
export async function downloadScanPdf(data: ScanPdfData, filename?: string): Promise<Blob> {
  const blob = await generateScanPdf(data);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `ClinicalReport-${data.classification.replace(/\s+/g, '-')}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return blob;
}
