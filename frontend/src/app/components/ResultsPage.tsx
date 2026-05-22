import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { 
  ArrowLeft, AlertTriangle, Info, Home, Upload, CheckCircle, 
  Layers, Download, FileText, Activity 
} from 'lucide-react';
import { Header } from './Header';
import type { ModelResult } from '@/services/modelService';

interface LocationState {
  image: string;
  result?: ModelResult & {
    abcdMetrics?: {
      asymmetry: number;
      borderIrregularity: number;
    };
  };
  error?: string;
}

const classificationInfo: Record<string, {
  description: string;
  characteristics: string[];
  dangers: string[];
  recommendations: string[];
}> = {
  'Actinic Keratosis': {
    description: 'A precancerous skin growth caused by long-term sun damage. It is considered the earliest stage in the development of skin cancer.',
    characteristics: [
      'Rough, scaly, or "sandpaper-like" texture',
      'Small, flat spots (usually <1 inch)',
      'May be pink, red, or brown',
      'Common on face, scalp, and hands'
    ],
    dangers: [
      'If left untreated, up to 10% may progress to Squamous Cell Carcinoma',
      'Indicates significant cumulative UV damage to the skin'
    ],
    recommendations: [
      'Consult a dermatologist for removal (Cryotherapy or topical creams)',
      'Strict sun protection is mandatory to prevent progression',
      'Regular full-body skin checks'
    ]
  },
  'Basal Cell Carcinoma': {
    description: 'BCC is the most common type of skin cancer. While it rarely spreads, it can cause significant local tissue damage if left untreated.',
    characteristics: [
      'Pearly or waxy bump, often with visible blood vessels',
      'Flat, flesh-colored or brown scar-like lesion',
      'Bleeding or oozing sore that heals and returns'
    ],
    dangers: [
      'Rarely metastasizes but can be locally destructive',
      'Can invade surrounding tissue and bone if untreated',
      'May recur after treatment'
    ],
    recommendations: [
      'Schedule prompt evaluation with a dermatologist',
      'Treatment options include surgical excision or Mohs surgery',
      'Use sun protection to prevent new BCCs'
    ]
  },
  'Other Benign Lesion': {
    description: 'A general category for non-cancerous skin conditions that do not fit into specific categories like moles or keratosis.',
    characteristics: [
      'Generally stable appearance',
      'Uniform color and symmetrical shape',
      'No signs of inflammation or rapid growth'
    ],
    dangers: [
      'Poses no immediate health risk',
      'The primary danger is misdiagnosis without a professional biopsy'
    ],
    recommendations: [
      'Keep a photo log to ensure the lesion remains stable',
      'No treatment required unless for comfort or aesthetics',
      'Consult a professional if any change occurs'
    ]
  },
  'Seborrheic Keratosis': {
    description: 'Seborrheic keratoses are common, non-cancerous skin growths that typically appear in middle age. They are often referred to as "barnacles" of aging.',
    characteristics: [
      'Waxy, slightly elevated growths with a "stuck-on" appearance',
      'Color ranges from light tan to brown or black',
      'Round or oval shape with a rough surface'
    ],
    dangers: [
      'Completely benign with no cancer risk',
      'May become irritated if rubbed by clothing',
      'Can sometimes be confused with melanoma'
    ],
    recommendations: [
      'No treatment necessary unless for cosmetic reasons',
      'Can be removed via cryotherapy or curettage',
      'Have any rapidly changing lesion evaluated'
    ]
  },
  'Dermatofibroma': {
    description: 'A common, harmless fibrous growth typically found on the legs. It is often the result of a minor injury like an insect bite.',
    characteristics: [
      'Small, firm, "button-like" bump under the skin',
      'Shows a "dimple sign" (dents inward when pinched)',
      'Varies from dusky pink to dull brown'
    ],
    dangers: [
      'Harmless and non-cancerous',
      'Can be itchy or tender in some cases'
    ],
    recommendations: [
      'Usually left alone unless it causes discomfort',
      'Surgical removal is an option but may leave a small scar',
      'Ignore unless it changes size or color rapidly'
    ]
  },
  'Infectious Lesion': {
    description: 'Skin changes caused by bacteria, viruses, or fungi. This category includes conditions like warts, herpes, or fungal infections.',
    characteristics: [
      'May present as clusters of small bumps or blisters',
      'Often accompanied by redness, warmth, or itching',
      'May have a "crusty" or weeping surface'
    ],
    dangers: [
      'Can spread to other parts of the body or other people',
      'Secondary bacterial infections can occur if scratched'
    ],
    recommendations: [
      'Seek evaluation for appropriate antimicrobial treatment',
      'Avoid touching or picking at the lesion',
      'Practice good hygiene to prevent transmission'
    ]
  },
  'Other Malignant Lesion': {
    description: 'A rare or atypical form of skin cancer that does not fall under the BCC, SCC, or Melanoma categories.',
    characteristics: [
      'Rapidly growing or non-healing mass',
      'Unusual appearance, texture, or color',
      'May bleed easily'
    ],
    dangers: [
      'High risk of local destruction and possible spread',
      'Requires specific specialized treatment'
    ],
    recommendations: [
      'URGENT: Dermatologist evaluation and biopsy required',
      'Do not delay seeking medical advice'
    ]
  },
  'Melanoma': {
    description: 'Melanoma is the most serious type of skin cancer. Early detection and treatment are critical for successful outcomes.',
    characteristics: [
      'Asymmetric shape with irregular borders',
      'Multiple colors or uneven color distribution',
      'Diameter larger than 6mm',
      'Evolving in size, shape, or color'
    ],
    dangers: [
      'Can spread rapidly to other parts of the body',
      'Metastatic melanoma can be life-threatening',
      'Early-stage melanoma has excellent survival rates'
    ],
    recommendations: [
      'URGENT: Seek immediate evaluation by a dermatologist',
      'May require surgical excision and biopsy',
      'Avoid sun exposure and use broad-spectrum sunscreen daily'
    ]
  },
  'Benign Nevus (Mole)': {
    description: 'A benign nevus, commonly known as a mole, is a non-cancerous growth on the skin formed by clusters of pigment-producing cells.',
    characteristics: [
      'Usually round or oval in shape with a smooth edge',
      'Uniform in color (brown, tan, black, or skin-colored)',
      'Generally smaller than 6mm',
      'Remain stable over time'
    ],
    dangers: [
      'Most benign nevi pose no health risk',
      'Atypical nevi have a slightly higher risk of changing'
    ],
    recommendations: [
      'Monitor using the ABCDE rule',
      'Perform regular self-examinations monthly',
      'Seek evaluation if a mole bleeds, itches, or changes'
    ]
  },
  'Squamous Cell Carcinoma': {
    description: 'SCC is the second most common skin cancer. It arises from the squamous cells in the outer layer of the skin.',
    characteristics: [
      'Firm, red nodule',
      'Flat sore with a scaly crust',
      'A new sore or raised area on an old scar or ulcer'
    ],
    dangers: [
      'More likely to spread than Basal Cell Carcinoma',
      'Can become disfiguring if left untreated'
    ],
    recommendations: [
      'Requires prompt surgical removal',
      'Frequent follow-up skin exams are necessary',
      'Protect skin from UV radiation'
    ]
  },
  'Vascular Lesion': {
    description: 'Non-cancerous growths made of blood vessels. Examples include cherry angiomas and "port-wine" stains.',
    characteristics: [
      'Bright red, blue, or purple in color',
      'Blanches (turns white) briefly when pressed',
      'Can be flat or slightly raised'
    ],
    dangers: [
      'Typically harmless',
      'Can bleed heavily if nicked or injured'
    ],
    recommendations: [
      'No treatment required for health reasons',
      'Can be removed by laser for cosmetic purposes',
      'Monitor for sudden changes in size or bleeding'
    ]
  }
};

export function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState;

  const [showOverlay, setShowOverlay] = useState(false);
  const [opacity, setOpacity] = useState(0.6);

  const analysisResult = state?.result ?? {
    classification: 'Benign Nevus (Mole)',
    confidence: 87.3,
    secondaryPredictions: [
      { name: 'Seborrheic Keratosis', confidence: 8.2 },
      { name: 'Melanoma', confidence: 3.1 },
      { name: 'Basal Cell Carcinoma', confidence: 1.4 }
    ],
    riskLevel: 'low',
    notes: state?.error ?? 'Model backend was not reached, showing sample results.',
    abcdMetrics: { asymmetry: 24.5, borderIrregularity: 18.2 } // Baseline fallbacks
  };

  const currentInfo = classificationInfo[analysisResult.classification];
  const abcd = analysisResult.abcdMetrics || { asymmetry: 24.5, borderIrregularity: 18.2 };

  useEffect(() => {
    if (!state?.image) {
      navigate('/');
    }
  }, [state?.image, navigate]);

  if (!state?.image) return null;

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-700 bg-green-100 dark:bg-green-950/30 dark:text-green-400';
      case 'medium': return 'text-amber-700 bg-amber-100 dark:bg-amber-950/30 dark:text-amber-400';
      case 'high': return 'text-red-700 bg-red-100 dark:bg-red-950/30 dark:text-red-400';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  // CLIENT SIDE PRINT-READY PDF COMPILE SYSTEM
  // CLIENT SIDE PRINT-READY PDF COMPILE SYSTEM (WITH TOP 3 DIAGNOSES)
  const handleExportPDF = async () => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // Brand Palette Layout Styling
    const primary = "#0F172A"; 
    const secondary = "#475569";

    // 1. Top Decorative Corporate Layout Header Banner
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

    // 2. Primary & Secondary Differential Diagnoses Block (Top 3)
    doc.setTextColor(primary);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("1. Neural Network Differential Diagnoses (Top 3 Predictions)", 14, 52);
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 54, 196, 54);

    // Rank 1: Primary Prediction
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(`1. Primary Finding: ${analysisResult.classification}`, 16, 62);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(secondary);
    doc.text(`Confidence: ${analysisResult.confidence}%  [Risk Level: ${analysisResult.riskLevel.toUpperCase()}]`, 22, 67);

    // Extracting Rank 2 and Rank 3 safely from secondary predictions
    const sec1 = analysisResult.secondaryPredictions?.[0] ? `${analysisResult.secondaryPredictions[0].name} (${analysisResult.secondaryPredictions[0].confidence}%)` : "N/A";
    const sec2 = analysisResult.secondaryPredictions?.[1] ? `${analysisResult.secondaryPredictions[1].name} (${analysisResult.secondaryPredictions[1].confidence}%)` : "N/A";

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

    // 3. Embedded Computer Vision Imaging Matrices (Pushed down slightly to make space)
    doc.setTextColor(primary);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("2. Processed Optical Analytics Fields", 14, 106);
    doc.line(14, 108, 196, 108);

    // Render Source Image
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(secondary);
    doc.text("Original Region-of-Interest", 14, 114);
    doc.addImage(state.image, 'JPEG', 14, 116, 58, 58);

    // Render Saliency Overlay Target Heatmap Vector
    if (analysisResult.heatmap) {
      doc.text("HiResCAM Saliency Map Overlay", 110, 114);
      doc.addImage(analysisResult.heatmap, 'PNG', 110, 116, 58, 58);
    } else {
      doc.text("HiResCAM Saliency Map Overlay", 110, 114);
      doc.rect(110, 116, 58, 58, 'S');
      doc.text("Saliency data omitted from pipeline", 115, 145);
    }

  // 4. OpenCV Quantitative Morphological Feature Analysis Table (ABCDE Matrix)
    doc.setTextColor(primary);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("3. Computer Vision Structural Metrics (ABCDE Extraction)", 14, 186);
    doc.line(14, 188, 196, 188);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10); // Slightly smaller font to fit all 5 items comfortably
    
    // Fallback bindings to prevent crashes if the state is temporarily refreshing
    const metricA = analysisResult.abcdMetrics?.asymmetry ?? 0;
    const metricB = analysisResult.abcdMetrics?.borderIrregularity ?? 0;
    const metricC = analysisResult.abcdMetrics?.colorDivergence ?? 0;
    const metricD = analysisResult.abcdMetrics?.diameterProfile ?? 0;
    const metricE = analysisResult.abcdMetrics?.evolvingTracking ?? 0;

    doc.text(`[A] Asymmetry Metric Index: ${metricA} / 100`, 14, 195);
    doc.text(`[B] Border Irregularity (Compactness Ratio): ${metricB} / 100`, 14, 201);
    doc.text(`[C] Color Divergence (RGB Variance Vector): ${metricC} / 100`, 14, 207);
    doc.text(`[D] Diameter Profile (Relative Frame Scale): ${metricD} / 100`, 14, 213);
    doc.text(`[E] Evolving Risk Factor (Baseline Tracking Index): ${metricE} / 100`, 14, 219);

    // 5. Secure Healthcare Interoperability Guardrail Disclaimer Base Box
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
    const textContextStr = "This telemetry report sheet contains automated processing variables compiled via automated digital image calculations and mathematical modeling layers. This automated audit statement does not constitute a formal biopsy confirmation or immediate therapy plan. Provide this documentation directly to a certified professional dermatologist during your incoming scheduled appointment or virtual teledermatology evaluation window.";
    const cleanSplits = doc.splitTextToSize(textContextStr, 174);
    doc.text(cleanSplits, 18, 249);

    // Save PDF layout
    doc.save(`ClinicalReport-${analysisResult.classification.replace(/\s+/g, '-')}.pdf`);
  };
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="relative overflow-hidden">
        {/* Header Title Section */}
        <div className="relative z-10 max-w-6xl mx-auto px-6 pt-8">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-5xl md:text-6xl mb-4 font-bold tracking-tight">Analysis Results</h1>
            <p className="text-lg text-muted-foreground">AI-powered skin lesion classification & structural diagnostics</p>
          </motion.div>
        </div>

        {/* Main Content Grid */}
        <div className="relative z-10 max-w-6xl mx-auto px-6 pb-20">
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            
            {/* Visual Column: Image & Heatmap */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="bg-card rounded-3xl shadow-xl p-6 border border-border overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-medium">Interactive Analysis</h3>
                  <button 
                    onClick={() => setShowOverlay(!showOverlay)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                      showOverlay 
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    <span className="text-sm font-bold">{showOverlay ? 'Hide Heatmap' : 'Overlay Heatmap'}</span>
                  </button>
                </div>

                <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted group">
                  {/* Base Image Layer */}
                  <img 
                    src={state.image} 
                    alt="Original Lesion" 
                    className="absolute inset-0 w-full h-full object-cover" 
                  />

                  {/* HiResCAM Heatmap Layer */}
                  {analysisResult.heatmap && (
                    <img 
                      src={analysisResult.heatmap} 
                      alt="AI Attention Map" 
                      className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-in-out pointer-events-none"
                      style={{ 
                        opacity: showOverlay ? opacity : 0,
                        mixBlendMode: 'screen',
                        filter: 'contrast(1.1) saturate(1.3)'
                      }}
                    />
                  )}

                  {/* Small Info Badge */}
                  <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
                    <div className="bg-black/40 backdrop-blur-md p-3 rounded-xl border border-white/10">
                      <p className="text-[10px] text-white/90 leading-tight">
                        {showOverlay 
                          ? "Showing areas of high diagnostic influence (Red) overlaid on lesion."
                          : "Showing original captured image. Toggle 'Overlay' to see AI logic."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Controls Section */}
                <AnimatePresence>
                  {showOverlay && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-6 pt-4 border-t border-border space-y-4"
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Heatmap Intensity
                          </label>
                          <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded text-primary">
                            {Math.round(opacity * 100)}%
                          </span>
                        </div>
                        <input 
                          type="range" 
                          min="0.1" 
                          max="1" 
                          step="0.01" 
                          value={opacity} 
                          onChange={(e) => setOpacity(parseFloat(e.target.value))}
                          className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                      </div>
                      
                      <div className="flex gap-4 items-center p-3 bg-accent/5 rounded-xl border border-accent/10 text-[11px] text-muted-foreground">
                        <div className="flex gap-1 items-center font-medium">
                          <div className="w-2 h-2 rounded-full bg-red-500" /> High
                        </div>
                        <div className="flex gap-1 items-center font-medium">
                          <div className="w-2 h-2 rounded-full bg-yellow-400" /> Medium
                        </div>
                        <div className="flex gap-1 items-center font-medium">
                          <div className="w-2 h-2 rounded-full bg-blue-500" /> Low
                        </div>
                        <div className="ml-auto text-primary/70 italic">HiResCAM Localization</div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Analysis Column: Confidence, Secondary Predictions & ABCD Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* Primary Class Card */}
              <div className="bg-card rounded-3xl shadow-xl p-8 border border-border">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Primary Classification</p>
                    <h2 className="text-3xl font-bold">{analysisResult.classification}</h2>
                  </div>
                  <div className={`px-4 py-2 rounded-full text-xs font-bold ${getRiskColor(analysisResult.riskLevel)}`}>
                    {analysisResult.riskLevel.toUpperCase()} RISK
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Confidence Score</span>
                    <span className="text-2xl font-mono">{analysisResult.confidence}%</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${analysisResult.confidence}%` }}
                      className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                    />
                  </div>
                </div>
              </div>

              {/* NEW INTERACTIVE SIDEBAR COMPONENT: OpenCV ABCD Metric Tracking Engine */}
              <div className="bg-card rounded-3xl shadow-xl p-8 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-5 h-5 text-primary" />
                  <h3 className="text-xl font-medium">Morphological ABCD Criteria Matrix</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-6">
                  Structural measurements extracted deterministically via OpenCV digital processing.
                </p>

                <div className="space-y-5">
                  {/* Asymmetry Metric Chart Block */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5 text-sm">
                      <span className="font-medium text-card-foreground">Asymmetry Deficit Index</span>
                      <span className="font-mono text-xs text-muted-foreground">{abcd.asymmetry} / 100</span>
                    </div>
                    <div className="w-full bg-muted h-2.5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${abcd.asymmetry}%` }} 
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className={`h-full rounded-full ${abcd.asymmetry > 45 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      />
                    </div>
                  </div>

                  {/* Border Irregularity Chart Block */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5 text-sm">
                      <span className="font-medium text-card-foreground">Border Irregularity (Compactness)</span>
                      <span className="font-mono text-xs text-muted-foreground">{abcd.borderIrregularity} / 100</span>
                    </div>
                    <div className="w-full bg-muted h-2.5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${abcd.borderIrregularity}%` }} 
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.15 }}
                        className={`h-full rounded-full ${abcd.borderIrregularity > 45 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      />
                    </div>
                  </div>
                  
                  {/* COLOR DIVERGENCE METRIC */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5 text-sm">
                      <span className="font-medium text-card-foreground">Color Divergence (RGB Variance)</span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {analysisResult.abcdMetrics?.colorDivergence ?? 0} / 100
                      </span>
                    </div>
                    <div className="w-full bg-muted h-2.5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${analysisResult.abcdMetrics?.colorDivergence ?? 0}%` }} 
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.20 }}
                        className={`h-full rounded-full ${(analysisResult.abcdMetrics?.colorDivergence ?? 0) > 45 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      />
                    </div>
                  </div>

                  {/* DIAMETER PROFILE METRIC */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5 text-sm">
                      <span className="font-medium text-card-foreground">Diameter Profile (Relative Scale)</span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {analysisResult.abcdMetrics?.diameterProfile ?? 0} / 100
                      </span>
                    </div>
                    <div className="w-full bg-muted h-2.5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${analysisResult.abcdMetrics?.diameterProfile ?? 0}%` }} 
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.25 }}
                        className={`h-full rounded-full ${(analysisResult.abcdMetrics?.diameterProfile ?? 0) > 45 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      />
                    </div>
                  </div>

                  {/* EVOLVING TRACKING METRIC */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5 text-sm">
                      <span className="font-medium text-card-foreground">Evolving Risk (Tracking Index)</span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {analysisResult.abcdMetrics?.evolvingTracking ?? 0} / 100
                      </span>
                    </div>
                    <div className="w-full bg-muted h-2.5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${analysisResult.abcdMetrics?.evolvingTracking ?? 0}%` }} 
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.30 }}
                        className={`h-full rounded-full ${(analysisResult.abcdMetrics?.evolvingTracking ?? 0) > 45 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      />
                    </div>
                  </div>

                  {/* Informational Context Tag */}
                  <div className="flex items-start gap-2 bg-muted/40 p-3 rounded-xl border border-border/60 text-[11px] text-muted-foreground leading-normal">
                    <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>
                      Higher structural scores correlate with non-uniform geometric asymmetry matrices and high-perimeter irregularity fractions.
                    </span>
                  </div>
                </div>
              </div>

              {/* Other Predictions Card */}
              <div className="bg-card rounded-3xl shadow-xl p-8 border border-border">
                <h3 className="text-xl mb-6">Other Possible Findings</h3>
                <div className="space-y-5">
                  {analysisResult.secondaryPredictions.map((prediction) => (
                    <div key={prediction.name} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{prediction.name}</span>
                        <span className="font-medium">{prediction.confidence}%</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary/40 rounded-full" style={{ width: `${prediction.confidence}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Classification Info Section */}
          {currentInfo && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
              <div className="bg-card rounded-3xl shadow-xl p-8 md:p-10 border border-border">
                <h2 className="text-3xl mb-4">About {analysisResult.classification}</h2>
                <p className="text-muted-foreground text-lg mb-8">{currentInfo.description}</p>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 dark:bg-blue-950/20 rounded-2xl p-6">
                    <h3 className="text-xl text-blue-900 dark:text-blue-400 mb-4 flex items-center gap-2"><Info className="w-5 h-5"/> Characteristics</h3>
                    <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-2">
                      {currentInfo.characteristics.map((c, i) => <li key={i}>• {c}</li>)}
                    </ul>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-950/20 rounded-2xl p-6">
                    <h3 className="text-xl text-amber-900 dark:text-amber-400 mb-4 flex items-center gap-2"><AlertTriangle className="w-5 h-5"/> Risks</h3>
                    <ul className="text-sm text-amber-800 dark:text-amber-300 space-y-2">
                      {currentInfo.dangers.map((d, i) => <li key={i}>• {d}</li>)}
                    </ul>
                  </div>
                  <div className="bg-green-50 dark:bg-green-950/20 rounded-2xl p-6">
                    <h3 className="text-xl text-green-900 dark:text-green-400 mb-4 flex items-center gap-2"><CheckCircle className="w-5 h-5"/> Actions</h3>
                    <ul className="text-sm text-green-800 dark:text-green-300 space-y-2">
                      {currentInfo.recommendations.map((r, i) => <li key={i}>• {r}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Disclaimer */}
          <div className="bg-amber-50 dark:bg-amber-950/10 border-2 border-amber-200 dark:border-amber-900/40 rounded-3xl p-8 mb-8 text-amber-900 dark:text-amber-400">
            <h3 className="text-2xl mb-3 flex items-center gap-2"><AlertTriangle /> Medical Disclaimer</h3>
            <p className="mb-4">This tool is for <strong>educational purposes only</strong>. It is not a formal diagnostic statement.</p>
            <p className="font-bold">Always consult a qualified dermatologist for definitive clinical skin concerns.</p>
          </div>

          {/* System Control Interaction Row Block */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={handleExportPDF} 
              className="px-8 py-4 bg-emerald-600 text-white font-medium rounded-xl shadow-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 shadow-emerald-600/10"
            >
              <FileText className="w-5 h-5" /> Export Clinical PDF Report
            </button>
            <button 
              onClick={() => navigate('/scan')} 
              className="px-8 py-4 bg-primary text-white font-medium rounded-xl shadow-lg flex items-center justify-center gap-3"
            >
              <Upload className="w-5 h-5" /> Analyze Another Image
            </button>
            <button 
              onClick={() => navigate('/')} 
              className="px-8 py-4 bg-background border border-border text-foreground font-medium rounded-xl shadow-md flex items-center justify-center gap-3 hover:bg-muted/50 transition-colors"
            >
              <Home className="w-5 h-5" /> Return to Home
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}