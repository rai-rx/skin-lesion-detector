import jsPDF from 'jspdf/dist/jspdf.es.min.js';

export interface ScanPdfData {
  classification: string;
  description?: string;
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

  const colors = {
    ink: '#24332D',
    muted: '#607268',
    green: '#2F604E',
    paleGreen: '#E3EBDF',
    blue: '#36566A',
    paleBlue: '#E4EDF1',
    amber: '#8A5A18',
    paleAmber: '#F5EBDD',
    line: '#D7D2C7',
    white: '#FFFFFF',
  };
  const pageWidth = 210;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  const m = data.abcdeMetrics || {
    asymmetry: 0, borderIrregularity: 0, colorDivergence: 0, diameterProfile: 0, evolvingTracking: 0,
  };

  const setColor = (hex: string, type: 'fill' | 'text' | 'draw') => {
    const value = hex.replace('#', '');
    const rgb = [parseInt(value.slice(0, 2), 16), parseInt(value.slice(2, 4), 16), parseInt(value.slice(4, 6), 16)] as [number, number, number];
    if (type === 'fill') doc.setFillColor(...rgb);
    if (type === 'text') doc.setTextColor(...rgb);
    if (type === 'draw') doc.setDrawColor(...rgb);
  };
  const sectionTitle = (title: string, subtitle: string, y: number) => {
    setColor(colors.green, 'text');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(title, margin, y);
    setColor(colors.muted, 'text');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(subtitle, margin, y + 5);
    setColor(colors.line, 'draw');
    doc.line(margin, y + 9, pageWidth - margin, y + 9);
  };
  const wrappedText = (text: string, x: number, y: number, width: number, size = 9, color = colors.muted) => {
    setColor(color, 'text');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text, width);
    doc.text(lines, x, y, { lineHeightFactor: 1.45 });
    return y + lines.length * size * 0.42 * 1.45;
  };
  const metricBar = (label: string, value: number, y: number) => {
    setColor(colors.ink, 'text');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(label, margin, y);
    doc.text(`${Math.round(value)} / 100`, pageWidth - margin, y, { align: 'right' });
    setColor(colors.line, 'fill');
    doc.roundedRect(margin, y + 3, contentWidth, 3, 1.5, 1.5, 'F');
    setColor(colors.green, 'fill');
    doc.roundedRect(margin, y + 3, Math.max(1, Math.min(100, value)) * contentWidth / 100, 3, 1.5, 1.5, 'F');
  };

  // Cover and primary finding.
  setColor(colors.ink, 'fill');
  doc.rect(0, 0, pageWidth, 43, 'F');
  setColor(colors.paleGreen, 'fill');
  doc.rect(0, 39, pageWidth, 4, 'F');
  setColor(colors.white, 'text');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('SKINELEVEN', margin, 17);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Skin lesion screening report', margin, 24);
  setColor('#C8D8CA', 'text');
  doc.setFontSize(8);
  doc.text(`Generated ${new Date().toLocaleString()}`, pageWidth - margin, 18, { align: 'right' });
  doc.text('Automated image analysis record', pageWidth - margin, 24, { align: 'right' });

  setColor(colors.paleGreen, 'fill');
  doc.roundedRect(margin, 55, contentWidth, 47, 3, 3, 'F');
  setColor(colors.green, 'text');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('PRIMARY FINDING', margin + 7, 64);
  setColor(colors.ink, 'text');
  doc.setFontSize(19);
  doc.text(data.classification, margin + 7, 74);
  setColor(colors.muted, 'text');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Model confidence', margin + 7, 84);
  doc.text(`${data.confidence}%`, margin + 50, 84);
  doc.text('Risk level', margin + 7, 92);
  doc.text(data.riskLevel.toUpperCase(), margin + 50, 92);
  setColor(colors.green, 'fill');
  doc.roundedRect(112, 67, 70, 7, 3.5, 3.5, 'F');
  setColor(colors.white, 'text');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`${data.confidence}% confidence`, 147, 72, { align: 'center' });

  let y = 115;
  sectionTitle('Clinical analysis', 'Plain-language context for the primary image classification', y);
  y = wrappedText(data.description || 'No classification description was provided for this scan.', margin, y + 18, contentWidth, 10, colors.ink) + 8;

  sectionTitle('Prediction profile', 'The model\'s leading alternatives for this image', y);
  y += 18;
  const predictions = [
    { label: 'Primary', name: data.classification, confidence: data.confidence },
    ...(data.secondaryPredictions || []).slice(0, 3).map((prediction, index) => ({ label: `Alternative ${index + 1}`, name: prediction.name, confidence: prediction.confidence })),
  ];
  predictions.forEach((prediction, index) => {
    const rowY = y + index * 10;
    setColor(index === 0 ? colors.green : colors.line, 'fill');
    doc.roundedRect(margin, rowY - 4, 3, 7, 1.5, 1.5, 'F');
    setColor(colors.ink, 'text');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(prediction.name, margin + 7, rowY);
    setColor(colors.muted, 'text');
    doc.setFont('helvetica', 'normal');
    doc.text(`${prediction.label}  |  ${prediction.confidence}%`, pageWidth - margin, rowY, { align: 'right' });
  });

  doc.addPage();
  setColor(colors.ink, 'fill');
  doc.rect(0, 0, pageWidth, 24, 'F');
  setColor(colors.white, 'text');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Visual evidence and structural analysis', margin, 15);

  sectionTitle('Image review', 'Source image and model attention map', 38);
  const imageTop = 57;
  const imageWidth = 82;
  const imageHeight = 82;
  const imageX = margin;
  const heatmapX = pageWidth - margin - imageWidth;
  setColor(colors.paleBlue, 'fill');
  doc.roundedRect(imageX, imageTop, imageWidth, imageHeight + 12, 2, 2, 'F');
  doc.roundedRect(heatmapX, imageTop, imageWidth, imageHeight + 12, 2, 2, 'F');
  setColor(colors.blue, 'text');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('REGION OF INTEREST', imageX + 5, imageTop + 8);
  doc.text('HIRESCAM ATTENTION MAP', heatmapX + 5, imageTop + 8);
  try {
    const imageBase64 = await imageToBase64(data.imageUrl);
    doc.addImage(imageBase64, 'JPEG', imageX + 5, imageTop + 13, imageWidth - 10, imageHeight - 5);
  } catch {
    setColor(colors.muted, 'text');
    doc.setFont('helvetica', 'normal');
    doc.text('Image unavailable', imageX + imageWidth / 2, imageTop + 52, { align: 'center' });
  }
  if (data.heatmapUrl) {
    try {
      const heatmapBase64 = await imageToBase64(data.heatmapUrl);
      doc.addImage(heatmapBase64, 'PNG', heatmapX + 5, imageTop + 13, imageWidth - 10, imageHeight - 5);
    } catch {
      setColor(colors.muted, 'text');
      doc.setFont('helvetica', 'normal');
      doc.text('Attention map unavailable', heatmapX + imageWidth / 2, imageTop + 52, { align: 'center' });
    }
  } else {
    setColor(colors.muted, 'text');
    doc.setFont('helvetica', 'normal');
    doc.text('Not available', heatmapX + imageWidth / 2, imageTop + 52, { align: 'center' });
  }

  sectionTitle('ABCDE structural metrics', 'Computer vision measurements used to describe visible lesion structure', 168);
  metricBar('A  Asymmetry', m.asymmetry, 190);
  metricBar('B  Border irregularity', m.borderIrregularity, 204);
  metricBar('C  Color divergence', m.colorDivergence, 218);
  metricBar('D  Diameter profile', m.diameterProfile, 232);
  metricBar('E  Evolving tracking index', m.evolvingTracking, 246);

  setColor(colors.paleAmber, 'fill');
  doc.roundedRect(margin, 265, contentWidth, 35, 3, 3, 'F');
  setColor(colors.amber, 'text');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('HOW TO READ THESE METRICS', margin + 6, 273);
  wrappedText('These values describe visual patterns detected in the submitted image. They are not independent diagnoses, biopsy results, or measurements of cancer probability. Changes over time are meaningful only when photographs are taken with comparable framing, lighting, focus, and distance.', margin + 6, 280, contentWidth - 12, 8, colors.amber);

  // Final page for the report limitation and sharing guidance.
  doc.addPage();
  setColor(colors.ink, 'fill');
  doc.rect(0, 0, pageWidth, 28, 'F');
  setColor(colors.white, 'text');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Report notes', margin, 17);
  sectionTitle('For your healthcare discussion', 'Questions and observations to bring to a qualified professional', 47);
  const discussion = [
    'When did you first notice the lesion, and has its size, shape, color, surface, or sensation changed?',
    'Has it bled, crusted, become painful or itchy, or failed to heal?',
    'Has the area experienced repeated sun exposure, friction, injury, or a previous treatment?',
    'Are there other lesions that look different from this one or are changing at the same time?',
  ];
  discussion.forEach((item, index) => {
    setColor(colors.green, 'fill');
    doc.circle(margin + 3, 68 + index * 14, 2, 'F');
    wrappedText(item, margin + 10, 70 + index * 14, contentWidth - 10, 9, colors.ink);
  });
  setColor('#F9E4E1', 'fill');
  doc.roundedRect(margin, 135, contentWidth, 55, 3, 3, 'F');
  setColor('#8D3F34', 'text');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('IMPORTANT LIMITATION', margin + 7, 145);
  wrappedText('SkinEleven is an academic decision-support and screening prototype. This report summarizes automated image analysis and does not establish a medical diagnosis, confirm malignancy, or prescribe treatment. A qualified dermatologist or other licensed healthcare professional should make clinical decisions, particularly for lesions that are new, changing, bleeding, painful, persistent, or concerning.', margin + 7, 153, contentWidth - 14, 9, '#68403B');
  setColor(colors.muted, 'text');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Keep this report with the original image and share it securely with your healthcare provider.', margin, 215);

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
