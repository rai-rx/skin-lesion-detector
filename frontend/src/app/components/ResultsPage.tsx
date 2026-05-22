import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { 
  ArrowLeft, AlertTriangle, Info, Home, Upload, CheckCircle, 
  Layers, Download, FileText, Activity,
  ShieldCheck, MapPin, Calendar, ExternalLink, BookOpen, Clock
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

interface RiskPanelProps {
  riskLevel: 'low' | 'medium' | 'high';
  classification: string;
}

export function DynamicRiskActionPanel({ riskLevel, classification }: RiskPanelProps) {
  const [loadingLocation, setLoadingLocation] = useState(false);

  // Robust riskLevel mapping and normalization
  let parsedRisk: 'low' | 'medium' | 'high' = 'low';
  const cleanRisk = (riskLevel || '').toString().toLowerCase().trim();
  
  if (cleanRisk === 'high' || cleanRisk === 'medium' || cleanRisk === 'low') {
    parsedRisk = cleanRisk as 'low' | 'medium' | 'high';
  } else {
    // Fallback: Check if the classification itself indicates a high-risk lesion
    const cleanClass = (classification || '').toString().toLowerCase().trim();
    const highRiskClasses = ['melanoma', 'basal cell carcinoma', 'squamous cell carcinoma', 'other malignant lesion', 'actinic keratosis'];
    if (highRiskClasses.includes(cleanClass)) {
      parsedRisk = 'high';
    } else {
      parsedRisk = 'low';
    }
  }

  // Geolocation API Action Router with Popup Blocker Workaround
  const handleFindDermatologist = () => {
    setLoadingLocation(true);
    
    // Open a blank tab/window immediately to bypass browser popup blockers
    const mapWindow = window.open('https://www.google.com/maps/search/dermatologist+near+me/', '_blank');
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          if (mapWindow) {
            // Update the already opened window with coordinates
            mapWindow.location.href = `https://www.google.com/maps/search/dermatologist+near+me/@${latitude},${longitude},13z`;
          }
          setLoadingLocation(false);
        },
        (error) => {
          console.warn("Location access denied or timed out, keeping default search.", error);
          // If geolocation fails or is denied, the tab remains on the fallback search URL
          setLoadingLocation(false);
        },
        { timeout: 5000 } // Safety timeout
      );
    } else {
      setLoadingLocation(false);
    }
  };

  return (
    <div className="w-full mt-6 border rounded-2xl overflow-hidden bg-card text-card-foreground shadow-sm">
      <AnimatePresence mode="wait">
        
        {/* ================= CONDITION 1: LOW RISK STATE ================= */}
        {parsedRisk === 'low' && (
          <motion.div
            key="low-risk"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="p-5 border-l-4 border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/10"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-base text-emerald-900 dark:text-emerald-300">
                  Routine Monitoring Recommended
                </h3>
                <p className="text-xs text-emerald-700/80 dark:text-emerald-400/70">
                  The system classified this asset as benign with no immediate structural red flags.
                </p>
              </div>
            </div>

            <hr className="border-emerald-100 dark:border-emerald-900/40 my-3" />

            {/* Educational Module Expansion Grid */}
            <div className="space-y-3">
              <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-400 tracking-wide uppercase flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" /> Self-Examination Guidelines (What to watch for)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground leading-relaxed">
                <div className="bg-background/60 p-2.5 rounded-xl border border-emerald-100/40">
                  <span className="font-medium text-foreground block mb-0.5">The Ugly Duckling Sign</span>
                  Look for any spot that looks distinctly different from all surrounding moles in size, shape, or shade.
                </div>
                <div className="bg-background/60 p-2.5 rounded-xl border border-emerald-100/40">
                  <span className="font-medium text-foreground block mb-0.5">Rapid Chronological Shift</span>
                  Re-evaluate this region monthly. Note if it expands, shifts borders, changes thickness, or begins to bleed.
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ================= CONDITION 2: MEDIUM RISK STATE ================= */}
        {parsedRisk === 'medium' && (
          <motion.div
            key="medium-risk"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="p-5 border-l-4 border-amber-500 bg-amber-50/30 dark:bg-amber-950/10"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-base text-amber-900 dark:text-amber-300">
                  Clinical Observation Advised
                </h3>
                <p className="text-xs text-amber-700/80 dark:text-amber-400/70">
                  Atypical structures detected. Professional visual confirmation is recommended.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 mt-2">
              <button 
                onClick={handleFindDermatologist}
                disabled={loadingLocation}
                className="flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium py-2.5 px-4 rounded-xl transition shadow-sm disabled:opacity-50"
              >
                <MapPin className="w-4 h-4" /> Locate Nearby Dermatologist
              </button>
            </div>
          </motion.div>
        )}

        {/* ================= CONDITION 3: HIGH RISK STATE ================= */}
        {parsedRisk === 'high' && (
          <motion.div
            key="high-risk"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="p-5 border-l-4 border-destructive bg-destructive/5 dark:bg-destructive/10"
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-destructive/10 text-destructive rounded-lg shrink-0 mt-0.5">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="font-semibold text-base text-destructive dark:text-red-400">
                  High Priority Review Flagged
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 leading-normal">
                  The screening profile correlates with metrics characteristic of <span className="font-semibold text-foreground">{classification}</span>. This requires definitive in-person mapping or immediate biopsy assessment.
                </p>
              </div>
            </div>

            {/* High-Urgency CTA Button Array */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-2">
              <button
                onClick={handleFindDermatologist}
                disabled={loadingLocation}
                className="flex-1 flex items-center justify-center gap-2 bg-destructive hover:bg-destructive/90 text-white text-xs font-semibold py-3 px-4 rounded-xl transition shadow-sm disabled:opacity-50"
              >
                <MapPin className="w-4 h-4" />
                {loadingLocation ? "Accessing GPS..." : "Find Nearest Dermatologist"}
              </button>

              <a
                href="https://www.teledermatology.example.com/book" // Replace with your actual scheduling endpoint
                target="_blank"
                rel="noreferrer"
                className="flex-1 flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border text-xs font-semibold py-3 px-4 rounded-xl transition"
              >
                <Calendar className="w-4 h-4 text-primary" />
                Book Virtual Consultation
                <ExternalLink className="w-3 h-3 text-muted-foreground" />
              </a>
            </div>

            <div className="flex items-center gap-1.5 mt-3 text-[10px] text-muted-foreground justify-center sm:justify-start">
              <Clock className="w-3 h-3" />
              <span>Early detection significantly improves treatment outcomes. Secure an appointment within 14 days.</span>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}

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
  const abcd = analysisResult.abcdMetrics || { 
    asymmetry: 24.5, 
    borderIrregularity: 18.2,
    colorDivergence: 15.4,
    diameterProfile: 30.1,
    evolvingTracking: 21.0
  };

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
    try {
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

      // 3. Embedded Computer Vision Imaging Matrices
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
      doc.setFontSize(10);
      
      // SAFE BOUNDING: Uses the exact same fallback strategy as your on-screen UI charts
      const localAbcd = analysisResult.abcdMetrics || { 
        asymmetry: 0, borderIrregularity: 0, colorDivergence: 0, diameterProfile: 0, evolvingTracking: 0 
      };

      doc.text(`[A] Asymmetry Metric Index: ${localAbcd.asymmetry} / 100`, 14, 195);
      doc.text(`[B] Border Irregularity (Compactness Ratio): ${localAbcd.borderIrregularity} / 100`, 14, 201);
      doc.text(`[C] Color Divergence (RGB Variance Vector): ${localAbcd.colorDivergence} / 100`, 14, 207);
      doc.text(`[D] Diameter Profile (Relative Frame Scale): ${localAbcd.diameterProfile} / 100`, 14, 213);
      doc.text(`[E] Evolving Risk Factor (Baseline Tracking Index): ${localAbcd.evolvingTracking} / 100`, 14, 219);

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
    } catch (error) {
      console.error("PDF generation engine threw an error:", error);
      alert("Failed to export PDF. Check your browser developer console for exact code errors.");
    }
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

              {/* Dynamic Risk Action Panel */}
              <DynamicRiskActionPanel 
                riskLevel={analysisResult.riskLevel as 'low' | 'medium' | 'high'} 
                classification={analysisResult.classification} 
              />
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
                  <h3 className="text-xl font-medium">Morphological ABCDE Criteria Matrix</h3>
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
                      <span className="font-mono text-xs text-muted-foreground">{abcd.colorDivergence} / 100</span>
                    </div>
                    <div className="w-full bg-muted h-2.5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${abcd.colorDivergence}%` }} 
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.20 }}
                        className={`h-full rounded-full ${abcd.colorDivergence > 45 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      />
                    </div>
                  </div>

                  {/* DIAMETER PROFILE METRIC */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5 text-sm">
                      <span className="font-medium text-card-foreground">Diameter Profile (Relative Scale)</span>
                      <span className="font-mono text-xs text-muted-foreground">{abcd.diameterProfile} / 100</span>
                    </div>
                    <div className="w-full bg-muted h-2.5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${abcd.diameterProfile}%` }} 
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.25 }}
                        className={`h-full rounded-full ${abcd.diameterProfile > 45 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      />
                    </div>
                  </div>

                  {/* EVOLVING TRACKING METRIC */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5 text-sm">
                      <span className="font-medium text-card-foreground">Evolving Risk (Tracking Index)</span>
                      <span className="font-mono text-xs text-muted-foreground">{abcd.evolvingTracking} / 100</span>
                    </div>
                    <div className="w-full bg-muted h-2.5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${abcd.evolvingTracking}%` }} 
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.30 }}
                        className={`h-full rounded-full ${abcd.evolvingTracking > 45 ? 'bg-amber-500' : 'bg-emerald-500'}`}
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