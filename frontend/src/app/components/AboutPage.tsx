import { BrainCircuit, Database, Eye, FlaskConical, Layers3 } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { apiFetch } from '../../services/apiUrl';
import { Header } from './Header';

const systemSteps = [
  {
    icon: BrainCircuit,
    title: 'Multi-class classification',
    text: 'EfficientNetV2-L analyzes the submitted lesion image and estimates the most likely category from the supported lesion classes.',
  },
  {
    icon: Eye,
    title: 'Visual explainability',
    text: 'HiResCAM generates an attention map to show which regions contributed most to the model output and make the result easier to inspect.',
  },
  {
    icon: Layers3,
    title: 'Structured clinical context',
    text: 'Each result includes confidence, risk stratification, lesion characteristics, risk considerations, and suggested follow-up actions.',
  },
  {
    icon: Database,
    title: 'Longitudinal records',
    text: 'Authenticated users can save scans and compare observations over time, while accounting for differences in lighting, focus, distance, and framing.',
  },
];

const lesionCategories = [
  {
    code: 'bcc',
    title: 'Basal Cell Carcinoma',
    type: 'Malignant',
    description: 'A common skin cancer that usually grows slowly but may damage nearby tissue if untreated.',
    examples: 'The broad category can include nodular, superficial, infiltrative, morpheaform, and pigmented forms.',
  },
  {
    code: 'nv',
    title: 'Melanocytic Nevus',
    type: 'Usually benign',
    description: 'Moles formed by clusters of pigment-producing cells, spanning many appearances and patterns.',
    examples: 'Examples include acquired junctional, compound, and dermal nevi; congenital nevi; dysplastic nevi; blue nevi; and Spitz nevi.',
  },
  {
    code: 'bkl',
    title: 'Benign Keratinocytic Lesion',
    type: 'Benign',
    description: 'Non-melanocytic growths of the epidermis that can sometimes resemble more serious lesions.',
    examples: 'May include common, irritated, or reticulated seborrheic keratoses, lichen planus-like keratosis (LPLK), and solar lentigines.',
  },
  {
    code: 'sccka',
    title: 'Squamous Cell Carcinoma / Keratoacanthoma',
    type: 'Malignant / requires assessment',
    description: 'A category for squamous-cell skin cancer patterns and keratoacanthoma-like lesions.',
    examples: 'Includes invasive squamous cell carcinoma and keratoacanthoma, which can appear as a rapidly growing, crater-shaped lesion.',
  },
  {
    code: 'mel',
    title: 'Melanoma',
    type: 'Malignant',
    description: 'A potentially serious cancer of pigment-producing cells that can spread to other parts of the body.',
    examples: 'Variants include melanoma in situ, superficial spreading, nodular, lentigo maligna, and amelanotic melanoma.',
  },
  {
    code: 'akiec',
    title: 'Actinic Keratosis / Intraepithelial Carcinoma',
    type: 'Precancerous / in situ',
    description: 'Sun-damage-related lesions, including precancerous changes and squamous cell carcinoma in situ.',
    examples: 'Actinic keratoses and intraepithelial lesions warrant clinical review because some can progress or resemble invasive disease.',
  },
  {
    code: 'df',
    title: 'Dermatofibroma',
    type: 'Benign',
    description: 'A usually harmless, firm fibrous nodule, often found on the legs.',
    examples: 'It may follow a minor skin injury and can persist as a small, firm spot.',
  },
  {
    code: 'inf',
    title: 'Infectious Lesion',
    type: 'Non-neoplastic',
    description: 'Skin changes associated with infection rather than a tumor.',
    examples: 'Possible causes include bacterial, viral, and fungal infections; the correct evaluation depends on symptoms and examination.',
  },
  {
    code: 'vasc',
    title: 'Vascular Lesion',
    type: 'Usually benign',
    description: 'A lesion involving blood vessels that may appear red, purple, or blue.',
    examples: 'This broad group includes vascular growths and abnormalities; appearance alone cannot establish the exact cause.',
  },
  {
    code: 'ben_oth',
    title: 'Other Benign Lesion',
    type: 'Benign',
    description: 'A catch-all category for non-cancerous lesions that do not fit one of the model’s more specific classes.',
    examples: 'It represents a varied group rather than one single condition.',
  },
  {
    code: 'mal_oth',
    title: 'Other Malignant Lesion',
    type: 'Malignant',
    description: 'A broad category for suspected malignant lesions outside the model’s named cancer classes.',
    examples: 'It can include uncommon skin malignancies; prompt assessment by a qualified clinician is important.',
  },
];

function ScrollReveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
      whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.55, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

export function AboutPage() {
  const [systemAccuracy, setSystemAccuracy] = useState<number | null>(null);
  const [accuracyFeedbackCount, setAccuracyFeedbackCount] = useState(0);
  const [accuracyLoaded, setAccuracyLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    apiFetch('/system/accuracy')
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data: { accuracyRate: number | null; feedbackCount: number }) => {
        if (isMounted) {
          setSystemAccuracy(data.accuracyRate);
          setAccuracyFeedbackCount(data.feedbackCount);
        }
      })
      .catch(() => {
        if (isMounted) {
          setSystemAccuracy(null);
          setAccuracyFeedbackCount(0);
        }
      })
      .finally(() => {
        if (isMounted) setAccuracyLoaded(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#f4f0e8] text-[#24332d]">
      <Header />

      <main>
        <section className="border-b border-[#d7d2c7] bg-[#e3ebdf]">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
            <ScrollReveal>
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#2f604e]">About the research system</p>
            </ScrollReveal>
            <ScrollReveal delay={0.08}>
              <h1 className="max-w-5xl font-display text-4xl font-bold leading-tight text-[#24332d] md:text-6xl">
                SkinEleven makes skin lesion screening more explainable.
              </h1>
            </ScrollReveal>
            <ScrollReveal delay={0.16}>
              <p className="mt-7 max-w-3xl text-lg leading-8 text-[#607268]">
                SkinEleven is an academic research prototype that brings deep learning classification, visual explanations, and organized scan history into one accessible workflow.
              </p>
            </ScrollReveal>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
            <ScrollReveal>
              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#2f604e]">Thesis project</p>
                <h2 className="font-display text-3xl font-bold leading-tight text-[#24332d] md:text-4xl">Skin11</h2>
                <div className="mt-6 border-l-4 border-[#2f604e] bg-[#e3ebdf] p-6">
                  <p className="font-display text-xl font-semibold leading-snug text-[#33443D]">
                    A Deep Learning Framework for Multi-Class Skin Lesion Classification using EfficientNetV2-L and HiResCAM
                  </p>
                </div>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <div className="space-y-5 text-base leading-8 text-[#607268]">
                <p>
                  The project investigates how modern deep learning can support early skin lesion screening across multiple categories. It combines a high-capacity image classifier with an explainability method so that a prediction is accompanied by visual evidence rather than presented as an unexplained label.
                </p>
                <p>
                  SkinEleven is designed to help users organize observations and prepare more useful conversations with qualified healthcare professionals. Its outputs are analytical estimates and educational context, not a replacement for clinical examination, dermoscopy, biopsy, or professional medical judgment.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>

        <section className="bg-[#33443D] text-[#f8f0e5]">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
            <ScrollReveal className="max-w-2xl">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#d2b17f]">System architecture</p>
              <h2 className="font-display text-3xl font-bold leading-tight md:text-4xl">From image to explainable result.</h2>
              <p className="mt-5 leading-7 text-[#d8e0d9]/80">
                The system combines model inference, computer-vision measurements, explainability, and user-controlled records to create a fuller screening workflow.
              </p>
            </ScrollReveal>
            <div className="mt-12 grid gap-px overflow-hidden border border-[#607268] bg-[#607268] md:grid-cols-2">
              {systemSteps.map((step, index) => (
                <article key={step.title} className="bg-[#33443D] p-7 md:p-9">
                  <ScrollReveal delay={index * 0.07}>
                    <step.icon className="h-7 w-7 text-[#d2b17f]" />
                    <h3 className="mt-7 text-xl font-semibold text-[#f8f0e5]">{step.title}</h3>
                    <p className="mt-3 leading-7 text-[#d8e0d9]/75">{step.text}</p>
                  </ScrollReveal>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-[#d7d2c7] bg-[#f8f5ee]">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
            <ScrollReveal className="max-w-3xl">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#2f604e]">Classification guide</p>
              <h2 className="font-display text-3xl font-bold leading-tight text-[#24332d] md:text-4xl">What the 11 categories cover.</h2>
              <p className="mt-5 leading-7 text-[#607268]">
                These are broad image-classification groups, not a list of subtypes the model can identify separately. The examples describe the wider clinical scope of each group; a clinician must confirm any diagnosis.
              </p>
            </ScrollReveal>
            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {lesionCategories.map((category, index) => (
                <ScrollReveal
                  key={category.code}
                  className={category.code === 'mal_oth' ? 'md:col-span-2' : undefined}
                  delay={(index % 2) * 0.08}
                >
                  <article
                    className={`h-full border border-[#d7d2c7] bg-[#f8f5ee] p-6 md:p-7 ${category.code === 'mal_oth' ? 'md:grid md:grid-cols-[1.4fr_0.8fr] md:items-center md:gap-10' : ''}`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="font-display text-xl font-semibold leading-snug text-[#24332d]">{category.title}</h3>
                        <code className="shrink-0 border border-[#d7d2c7] bg-[#e3ebdf] px-2 py-1 text-xs font-semibold text-[#2f604e]">{category.code}</code>
                      </div>
                      <p className="mt-3 text-xs font-bold uppercase tracking-[0.12em] text-[#8a5a18]">{category.type}</p>
                      <p className="mt-4 leading-7 text-[#607268]">{category.description}</p>
                      <p className="mt-3 border-l-2 border-[#d2b17f] pl-3 text-sm leading-6 text-[#607268]"><span className="font-semibold text-[#33443D]">Examples:</span> {category.examples}</p>
                    </div>
                    <div className={`mt-5 border-t border-[#d7d2c7] pt-4 ${category.code === 'mal_oth' ? 'md:mt-0 md:border-l md:border-t-0 md:pl-7 md:pt-0' : ''}`}>
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="text-sm font-semibold text-[#33443D]">System-wide reported accuracy</p>
                        <p className="font-display text-xl font-bold text-[#2f604e]">
                          {!accuracyLoaded ? 'Loading...' : systemAccuracy === null ? 'N/A' : `${systemAccuracy}%`}
                        </p>
                      </div>
                      <p className="mt-2 text-xs leading-5 text-[#607268]">
                        Based on {accuracyFeedbackCount} user feedback reports; this is not an independent clinical validation.
                      </p>
                    </div>
                  </article>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#33443D] text-[#f8f0e5]">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
              <ScrollReveal>
                <div>
                  <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#d2b17f]">Training foundation</p>
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#f5ebdd] text-[#8a5a18]">
                      <FlaskConical className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="font-display text-3xl font-bold text-[#f8f0e5]">The MILK10K dataset</h2>
                      <p className="mt-5 leading-8 text-[#d8e0d9]/80">
                        The project uses the MILK10K dataset as a foundation for developing and evaluating the multi-class lesion classification pipeline. A curated dataset gives the model examples of different lesion appearances and allows the research team to measure how consistently it distinguishes between categories.
                      </p>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
              <ScrollReveal delay={0.1}>
                <div className="space-y-5 leading-8 text-[#d8e0d9]/80">
                  <p>
                    Dataset performance does not automatically transfer perfectly to everyday uploads. Real-world results can be affected by camera quality, lighting, focus, skin tone, lesion location, image framing, and differences between curated dataset images and user-submitted photographs.
                  </p>
                  <p>
                    For that reason, the system presents its output as a screening estimate with supporting context. A healthcare professional should make the final clinical interpretation.
                  </p>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        <section className="border-t border-[#d7d2c7] bg-[#f8f5ee]">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
            <ScrollReveal className="max-w-3xl">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#2f604e]">Why we built it</p>
              <h2 className="font-display text-3xl font-bold leading-tight text-[#24332d] md:text-4xl">Making observation easier to organize.</h2>
              <p className="mt-6 text-lg leading-8 text-[#607268]">
                Skin lesions can look similar to one another, and changes can be difficult to document consistently. We created SkinEleven to explore how deep learning can make image-based screening more accessible while making model outputs easier to inspect, record, and discuss.
              </p>
              <p className="mt-5 leading-8 text-[#607268]">
                By combining classification, visual explanations, structured lesion information, and personal scan history, the system helps users bring more organized observations to professional care. Its purpose is research, education, and decision support.
              </p>
            </ScrollReveal>
          </div>
        </section>

        <footer className="border-t border-[#607268] bg-[#33443D] text-[#d8e0d9]/80">
          <div className="mx-auto max-w-7xl px-6 py-5 lg:px-8">
            <ScrollReveal>
              <p className="max-w-5xl text-xs leading-5">
                SkinEleven does not provide a formal diagnosis or treatment plan. If a lesion is new, changing, bleeding, painful, persistent, or concerning, seek assessment from a qualified dermatologist.
              </p>
            </ScrollReveal>
          </div>
        </footer>
      </main>
    </div>
  );
}
