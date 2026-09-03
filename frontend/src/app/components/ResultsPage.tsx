import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft, AlertTriangle, Info, Home, CheckCircle,
  Layers, Download, FileText, Activity,
  ShieldCheck, MapPin, Calendar, ExternalLink, BookOpen, Clock
} from 'lucide-react';
import { Header } from './Header';
import type { ModelResult } from '@/services/modelService';
import { generateScanPdf, downloadScanPdf, type ScanPdfData } from '../../services/generatePdf';
import { useAuth } from '../../contexts/AuthContext';
import { getApiUrl, apiFetch } from '../../services/apiUrl';
import { queuePendingScan } from '../../services/pendingScans';


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
    <AnimatePresence mode="wait">

      {/* ================= CONDITION 1: LOW RISK STATE ================= */}
      {parsedRisk === 'low' && (
        <motion.div
          key="low-risk"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4 }}
          className="border-l-4 border-[#2f604e] bg-[#e3ebdf] p-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-full bg-[#c9dcc4] p-2 text-[#2f604e]">
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
          className="border-l-4 border-[#b66f45] bg-[#f2e5d6] p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-full bg-[#ead1b2] p-2 text-[#b66f45]">
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

          <div className="flex flex-col gap-2 mt-2">
            <button
              onClick={handleFindDermatologist}
              disabled={loadingLocation}
              className="flex w-full items-center justify-center gap-2 bg-[#806348] px-4 py-3 text-xs font-semibold text-white transition hover:bg-[#684f3b] disabled:opacity-50"
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
          className="border-l-4 border-[#b34e3d] bg-[#f3dfd8] p-6 md:p-7"
        >
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0 rounded-full bg-[#ebc7bc] p-2.5 text-[#8d3f34]">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-destructive mb-1">Action recommended</p>
                <h3 className="font-semibold text-lg text-destructive dark:text-red-400">
                  High Priority Review
                </h3>
              </div>
            </div>
            <span className="shrink-0 bg-[#ebc7bc] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#8d3f34]">
              High risk
            </span>
          </div>

          <div className="mb-5 border border-[#d8a89d] bg-[#f8eae5] p-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              The screening profile correlates with metrics characteristic of <span className="font-semibold text-foreground">{classification}</span>. This result needs definitive in-person evaluation and may require biopsy assessment.
            </p>
          </div>

          <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-foreground">
            <Clock className="w-4 h-4 text-destructive" />
            Arrange a dermatology appointment within 14 days.
          </div>

          {/* High-Urgency CTA Button Array */}
          <div className="flex flex-col gap-2">
            <button
              onClick={handleFindDermatologist}
              disabled={loadingLocation}
              className="flex w-full items-center justify-center gap-2 bg-[#8d3f34] px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-[#73342c] disabled:opacity-50"
            >
              <MapPin className="w-4 h-4" />
              {loadingLocation ? "Accessing GPS..." : "Find Nearest Dermatologist"}
            </button>
          </div>

          <p className="text-[11px] text-muted-foreground mt-3 text-center">
            This screening result is not a diagnosis. A qualified dermatologist should make the final assessment.
          </p>
        </motion.div>
      )}

    </AnimatePresence>
  );
}

interface PrimaryClassificationCardProps {
  classification: string;
  riskLevel: string;
  confidence: number;
  getRiskColor: (level: string) => string;
}

function PrimaryClassificationCard({
  classification,
  riskLevel,
  confidence,
  getRiskColor
}: PrimaryClassificationCardProps) {
  return (
    <div className="border-y border-[#d7d2c7] bg-[#e3ebdf]/55 p-6 md:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-7">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#2f604e]">Primary finding</p>
          <h2 className="font-display text-2xl font-bold text-[#24332d] md:text-3xl">{classification}</h2>
        </div>
        <div className={`px-3 py-1.5 rounded-lg text-xs font-bold ${getRiskColor(riskLevel)}`}>
          {riskLevel.toUpperCase()} RISK
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Model confidence</span>
          <span className="text-2xl font-mono font-semibold text-foreground">{confidence}%</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-[#b9c7a9]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${confidence}%` }}
            className="h-full rounded-full bg-[#2f604e]"
          />
        </div>
      </div>
    </div>
  );
}

interface InteractiveAnalysisCardProps {
  image: string;
  heatmap?: string;
  showOverlay: boolean;
  setShowOverlay: (show: boolean) => void;
  opacity: number;
  setOpacity: (opacity: number) => void;
}

function InteractiveAnalysisCard({
  image,
  heatmap,
  showOverlay,
  setShowOverlay,
  opacity,
  setOpacity
}: InteractiveAnalysisCardProps) {
  return (
    <div className="border-y border-[#d7d2c7] bg-[#f8f5ee] p-5 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#2f604e]">Visual review</p>
          <h3 className="font-display text-2xl font-bold text-[#24332d]">Interactive analysis</h3>
        </div>
        <button
          onClick={() => setShowOverlay(!showOverlay)}
          aria-label={showOverlay ? 'Hide heatmap' : 'Show heatmap'}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
            showOverlay
              ? 'bg-[#2f604e] text-[#f4f0e8] shadow-lg shadow-[#2f604e]/20'
              : 'bg-[#e3ebdf] text-[#607268] hover:bg-[#c9dcc4]'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span className="hidden sm:inline text-sm font-bold">{showOverlay ? 'Hide Heatmap' : 'Overlay Heatmap'}</span>
        </button>
      </div>

      <div className="group relative aspect-square overflow-hidden border border-[#9fb39e] bg-[#dce4d4]">
        {/* Base Image Layer */}
        <img
          src={image}
          alt="Original Lesion"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* HiResCAM Heatmap Layer */}
        {heatmap && (
          <img
            src={heatmap}
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
          <div className="border border-white/10 bg-black/40 p-3 backdrop-blur-md">
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
                <span className="rounded bg-[#e3ebdf] px-2 py-0.5 font-mono text-xs text-[#2f604e]">
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

            <div className="flex items-center gap-4 border-l-2 border-[#2f604e] bg-[#e3ebdf] p-3 text-[11px] text-[#607268]">
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
  );
}

interface OtherPossibleFindingsCardProps {
  secondaryPredictions: Array<{ name: string; confidence: number }>;
}

function OtherPossibleFindingsCard({ secondaryPredictions }: OtherPossibleFindingsCardProps) {
  return (
    <div className="border-y border-[#d7d2c7] p-8">
      <h3 className="mb-6 font-display text-2xl font-bold text-[#24332d]">Other possible findings</h3>
      <div className="space-y-5">
        {secondaryPredictions.map((prediction) => (
          <div key={prediction.name} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{prediction.name}</span>
              <span className="font-medium">{prediction.confidence}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[#b9c7a9]">
              <div className="h-full rounded-full bg-[#806348]" style={{ width: `${prediction.confidence}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface AbcdeMatrixCardProps {
  abcd: {
    asymmetry: number;
    borderIrregularity: number;
    colorDivergence: number;
    diameterProfile: number;
    evolvingTracking: number;
  };
}

function AbcdeMatrixCard({ abcd }: AbcdeMatrixCardProps) {
  return (
    <div className="border-y border-[#d7d2c7] p-8">
      <div className="mb-2 flex items-center gap-2">
      <Activity className="h-5 w-5 text-[#2f604e]" />
      <h3 className="font-display text-2xl font-bold text-[#24332d]">Morphological ABCDE criteria</h3>
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
  );
}

export function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const state = (location.state as LocationState) || {};
  const [activeTab, setActiveTab] = useState<'overview' | 'explainability' | 'clinical' | 'education'>('overview');
  const [isExporting, setIsExporting] = useState(false);
  const autoSaveStarted = useRef(false);

  const uploadPdfReport = async (scanId: string, blob: Blob) => {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const form = new FormData();
      form.append('scan_id', scanId);
      form.append('file', new File([blob], `report-${scanId}-${timestamp}.pdf`, { type: 'application/pdf' }));

      const res = await apiFetch('/reports', {
        method: 'POST',
        body: form,
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });

      if (!res.ok) throw new Error('Failed to upload PDF');
      return (await res.json()).pdf_report_url;
    } catch (err) {
      console.error('PDF upload failed', err);
      return null;
    }
  };
  useEffect(() => {
    if (!user && state?.image && state?.result) {
      queuePendingScan({ image: state.image, result: state.result as Record<string, unknown> });
    }
  }, [user, state?.image, state?.result]);

  useEffect(() => {
    if (!state?.image) {
      navigate('/');
    }
  }, [state?.image, navigate]);

  if (!state?.image) return null;

  if (state?.error || !state?.result) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="relative overflow-hidden max-w-3xl mx-auto px-6 pt-8 pb-24">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate('/scan')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Scanner</span>
          </motion.button>

          <div className="bg-card rounded-3xl shadow-xl p-8 border border-destructive/30 text-center space-y-6">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto text-destructive">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Analysis Could Not Complete</h2>
            <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
              {state?.error || 'Unable to connect to the backend analysis service. Please ensure the backend server and its public API endpoint are running and accessible.'}
            </p>
            {state.image && (
              <div className="w-32 h-32 mx-auto rounded-xl overflow-hidden border border-border shadow-inner">
                <img src={state.image} alt="Uploaded lesion" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
              <button
                onClick={() => navigate('/scan')}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium shadow hover:opacity-90 transition"
              >
                Retry Analysis
              </button>
              <button
                onClick={() => navigate('/')}
                className="px-6 py-3 bg-muted text-muted-foreground rounded-xl font-medium hover:bg-muted/80 transition"
              >
                Return to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const analysisResult = state.result;
  const currentInfo = classificationInfo[analysisResult.classification];
  const abcd = analysisResult.abcdMetrics || {
    asymmetry: 0,
    borderIrregularity: 0,
    colorDivergence: 0,
    diameterProfile: 0,
    evolvingTracking: 0
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-700 bg-green-100 dark:bg-green-950/30 dark:text-green-400';
      case 'medium': return 'text-amber-700 bg-amber-100 dark:bg-amber-950/30 dark:text-amber-400';
      case 'high': return 'text-red-700 bg-red-100 dark:bg-red-950/30 dark:text-red-400';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  async function handleExportPDF(autoDownload = true) {
    try {
      const pdfData: ScanPdfData = {
        classification: analysisResult.classification,
        confidence: analysisResult.confidence,
        riskLevel: analysisResult.riskLevel,
        secondaryPredictions: analysisResult.secondaryPredictions,
        abcdeMetrics: analysisResult.abcdMetrics || {
          asymmetry: 0, borderIrregularity: 0, colorDivergence: 0, diameterProfile: 0, evolvingTracking: 0
        },
        imageUrl: state.image,
        heatmapUrl: analysisResult.heatmap,
      };

      let blob: Blob;
      if (autoDownload) {
        blob = await downloadScanPdf(pdfData);
      } else {
        blob = await generateScanPdf(pdfData);
      }

      // If user is authenticated and scan was persisted, upload report to server
      if (user && state?.result?.id && session?.access_token) {
        const uploadedUrl = await uploadPdfReport(state.result.id, blob);
        if (uploadedUrl) {
          console.log('Uploaded PDF report to:', uploadedUrl);
        }
      }
    } catch (error) {
      console.error("PDF generation engine threw an error:", error);
      alert("Failed to export PDF. Check your browser developer console for exact code errors.");
    }
  };

  useEffect(() => {
    if (
      !autoSaveStarted.current &&
      user &&
      session?.access_token &&
      state?.result?.id
    ) {
      autoSaveStarted.current = true;
      void handleExportPDF(false);
    }
  }, [user, session?.access_token, state?.result?.id]);

  return (
    <div className="min-h-screen bg-[#f4f0e8] text-[#24332d] bg-[radial-gradient(circle_at_top_right,rgba(89,137,94,0.18),transparent_34rem)]">
      <Header />

      <div className="relative overflow-hidden">
        {/* Header Title Section */}
        <div className="relative z-10 mx-auto max-w-6xl px-6 pt-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10 border-b border-[#d7d2c7] pb-10 text-left md:mb-12"
          >
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#2f604e]">02 / Review the observation</p>
            <h1 className="font-display text-5xl font-bold leading-[0.95] tracking-tight text-[#24332d] md:text-7xl">Analysis Results</h1>
          </motion.div>
        </div>

        {/* Main Content Grid & Stack */}
          <div className="relative z-10 max-w-6xl mx-auto px-6 pb-24 space-y-10 md:space-y-12">
          {!user && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card/80 border border-accent/25 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm"
            >
              <div className="flex items-center gap-3 text-accent">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <p className="text-sm font-medium">This is an anonymous scan. It has not been saved.</p>
              </div>
              <button
                onClick={() => {
                  navigate('/register');
                }}
                className="px-4 py-2 bg-accent text-accent-foreground text-sm font-semibold rounded-xl hover:opacity-90 whitespace-nowrap"
              >
                Sign up to save scan
              </button>
            </motion.div>
          )}

          {/* MOBILE VIEW LAYOUT (lg:hidden) */}
          <div className="flex flex-col gap-6 lg:hidden mb-8">
            {/* 1. Primary Classification */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <PrimaryClassificationCard
                classification={analysisResult.classification}
                riskLevel={analysisResult.riskLevel}
                confidence={analysisResult.confidence}
                getRiskColor={getRiskColor}
              />
            </motion.div>

            {/* 2. Interactive Analysis */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <InteractiveAnalysisCard
                image={state.image}
                heatmap={analysisResult.heatmap}
                showOverlay={showOverlay}
                setShowOverlay={setShowOverlay}
                opacity={opacity}
                setOpacity={setOpacity}
              />
            </motion.div>

            {/* 3. Review Flag */}
            <DynamicRiskActionPanel
              riskLevel={analysisResult.riskLevel as 'low' | 'medium' | 'high'}
              classification={analysisResult.classification}
            />

            {/* 4. Other Possible Findings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <OtherPossibleFindingsCard
                secondaryPredictions={analysisResult.secondaryPredictions}
              />
            </motion.div>

            {/* 5. Morphological ABCDE Criteria Matrix */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <AbcdeMatrixCard abcd={abcd} />
            </motion.div>
          </div>

          {/* DESKTOP VIEW LAYOUT (hidden lg:grid) */}
          <div className="hidden lg:grid lg:grid-cols-[1.08fr_0.92fr] gap-8 mb-8 items-start">
            {/* Visual Column: Image, Heatmap & Risk Panel */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6 min-w-0"
            >
              <InteractiveAnalysisCard
                image={state.image}
                heatmap={analysisResult.heatmap}
                showOverlay={showOverlay}
                setShowOverlay={setShowOverlay}
                opacity={opacity}
                setOpacity={setOpacity}
              />

              <DynamicRiskActionPanel
                riskLevel={analysisResult.riskLevel as 'low' | 'medium' | 'high'}
                classification={analysisResult.classification}
              />
            </motion.div>

            {/* Analysis Column: Confidence, Secondary Predictions & ABCD Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6 min-w-0"
            >
              <PrimaryClassificationCard
                classification={analysisResult.classification}
                riskLevel={analysisResult.riskLevel}
                confidence={analysisResult.confidence}
                getRiskColor={getRiskColor}
              />

              <OtherPossibleFindingsCard
                secondaryPredictions={analysisResult.secondaryPredictions}
              />

              <AbcdeMatrixCard abcd={abcd} />
            </motion.div>
          </div>


          {/* Classification Info Section */}
          {currentInfo && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
              <div className="border-y border-[#d7d2c7] bg-[#f8f5ee] p-6 md:p-8">
                <div className="max-w-3xl mb-7">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#2f604e]">Clinical context</p>
                  <h2 className="mb-3 font-display text-2xl text-[#24332d] md:text-3xl">About {analysisResult.classification}</h2>
                  <p className="leading-relaxed text-[#607268]">{currentInfo.description}</p>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="border-l-2 border-[#607f9a] bg-[#e4edf1] p-5">
                    <h3 className="text-xl text-blue-900 dark:text-blue-400 mb-4 flex items-center gap-2"><Info className="w-5 h-5" /> Characteristics</h3>
                    <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-2">
                      {currentInfo.characteristics.map((c, i) => <li key={i} className="flex items-start gap-2"><span className="shrink-0" aria-hidden="true">•</span><span>{c}</span></li>)}
                    </ul>
                  </div>
                  <div className="border-l-2 border-[#b66f45] bg-[#f2e5d6] p-5">
                    <h3 className="text-xl text-amber-900 dark:text-amber-400 mb-4 flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Risks</h3>
                    <ul className="text-sm text-amber-800 dark:text-amber-300 space-y-2">
                      {currentInfo.dangers.map((d, i) => <li key={i} className="flex items-start gap-2"><span className="shrink-0" aria-hidden="true">•</span><span>{d}</span></li>)}
                    </ul>
                  </div>
                  <div className="border-l-2 border-[#2f604e] bg-[#e3ebdf] p-5">
                    <h3 className="text-xl text-green-900 dark:text-green-400 mb-4 flex items-center gap-2"><CheckCircle className="w-5 h-5" /> Actions</h3>
                    <ul className="text-sm text-green-800 dark:text-green-300 space-y-2">
                      {currentInfo.recommendations.map((r, i) => <li key={i} className="flex items-start gap-2"><span className="shrink-0" aria-hidden="true">•</span><span>{r}</span></li>)}
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Disclaimer */}
          <div className="mb-8 border-l-4 border-[#b66f45] bg-[#f2e5d6] p-8 text-[#684f3b]">
            <h3 className="text-2xl mb-3 flex items-center gap-2"><AlertTriangle /> Medical Disclaimer</h3>
            <p className="mb-4">This tool is for <strong>educational purposes only</strong>. It is not a formal diagnostic statement.</p>
            <p className="font-bold">Always consult a qualified dermatologist for definitive clinical skin concerns.</p>
          </div>

          {/* System Control Interaction Row Block */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button
              onClick={() => void handleExportPDF()}
              className="flex items-center justify-center gap-3 bg-[#2f604e] px-7 py-3.5 font-medium text-white shadow-lg transition-all hover:bg-[#244c3e]"
            >
              <FileText className="w-5 h-5" /> Export Clinical PDF Report
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex items-center justify-center gap-3 border border-[#b9c7a9] bg-transparent px-7 py-3.5 font-medium text-[#2f604e] transition-colors hover:bg-[#e3ebdf]"
            >
              <Home className="w-5 h-5" /> Return to Home
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}