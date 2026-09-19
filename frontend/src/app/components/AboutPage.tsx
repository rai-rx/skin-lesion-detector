import { BrainCircuit, Database, Eye, FlaskConical, Layers3 } from 'lucide-react';
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

export function AboutPage() {
  return (
    <div className="min-h-screen bg-[#f4f0e8] text-[#24332d]">
      <Header />

      <main>
        <section className="border-b border-[#d7d2c7] bg-[#e3ebdf]">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#2f604e]">About the research system</p>
            <h1 className="max-w-5xl font-display text-4xl font-bold leading-tight text-[#24332d] md:text-6xl">
              SkinEleven makes skin lesion screening more explainable.
            </h1>
            <p className="mt-7 max-w-3xl text-lg leading-8 text-[#607268]">
              SkinEleven is an academic research prototype that brings deep learning classification, visual explanations, and organized scan history into one accessible workflow.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#2f604e]">Thesis project</p>
              <h2 className="font-display text-3xl font-bold leading-tight text-[#24332d] md:text-4xl">Skin11</h2>
              <div className="mt-6 border-l-4 border-[#2f604e] bg-[#e3ebdf] p-6">
                <p className="font-display text-xl font-semibold leading-snug text-[#33443D]">
                  A Deep Learning Framework for Multi-Class Skin Lesion Classification using EfficientNetV2-L and HiResCAM
                </p>
              </div>
            </div>
            <div className="space-y-5 text-base leading-8 text-[#607268]">
              <p>
                The project investigates how modern deep learning can support early skin lesion screening across multiple categories. It combines a high-capacity image classifier with an explainability method so that a prediction is accompanied by visual evidence rather than presented as an unexplained label.
              </p>
              <p>
                SkinEleven is designed to help users organize observations and prepare more useful conversations with qualified healthcare professionals. Its outputs are analytical estimates and educational context, not a replacement for clinical examination, dermoscopy, biopsy, or professional medical judgment.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-[#33443D] text-[#f8f0e5]">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
            <div className="max-w-2xl">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#d2b17f]">System architecture</p>
              <h2 className="font-display text-3xl font-bold leading-tight md:text-4xl">From image to explainable result.</h2>
              <p className="mt-5 leading-7 text-[#d8e0d9]/80">
                The system combines model inference, computer-vision measurements, explainability, and user-controlled records to create a fuller screening workflow.
              </p>
            </div>
            <div className="mt-12 grid gap-px overflow-hidden border border-[#607268] bg-[#607268] md:grid-cols-2">
              {systemSteps.map((step) => (
                <article key={step.title} className="bg-[#33443D] p-7 md:p-9">
                  <step.icon className="h-7 w-7 text-[#d2b17f]" />
                  <h3 className="mt-7 text-xl font-semibold text-[#f8f0e5]">{step.title}</h3>
                  <p className="mt-3 leading-7 text-[#d8e0d9]/75">{step.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#2f604e]">Training foundation</p>
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#f5ebdd] text-[#8a5a18]">
                  <FlaskConical className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="font-display text-3xl font-bold text-[#24332d]">The MILK10K dataset</h2>
                  <p className="mt-5 leading-8 text-[#607268]">
                    The project uses the MILK10K dataset as a foundation for developing and evaluating the multi-class lesion classification pipeline. A curated dataset gives the model examples of different lesion appearances and allows the research team to measure how consistently it distinguishes between categories.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-5 leading-8 text-[#607268]">
              <p>
                Dataset performance does not automatically transfer perfectly to everyday uploads. Real-world results can be affected by camera quality, lighting, focus, skin tone, lesion location, image framing, and differences between curated dataset images and user-submitted photographs.
              </p>
              <p>
                For that reason, the system presents its output as a screening estimate with supporting context. A healthcare professional should make the final clinical interpretation.
              </p>
            </div>
          </div>
        </section>

        <section className="border-t border-[#d7d2c7] bg-[#f8f5ee]">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
            <div className="max-w-3xl">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#2f604e]">Why we built it</p>
              <h2 className="font-display text-3xl font-bold leading-tight text-[#24332d] md:text-4xl">Making observation easier to organize.</h2>
              <p className="mt-6 text-lg leading-8 text-[#607268]">
                Skin lesions can look similar to one another, and changes can be difficult to document consistently. We created SkinEleven to explore how deep learning can make image-based screening more accessible while making model outputs easier to inspect, record, and discuss.
              </p>
              <p className="mt-5 leading-8 text-[#607268]">
                By combining classification, visual explanations, structured lesion information, and personal scan history, the system helps users bring more organized observations to professional care. Its purpose is research, education, and decision support.
              </p>
            </div>
          </div>
        </section>

        <section className="border-t border-[#d7d2c7] bg-[#f4f0e8]">
          <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
            <p className="max-w-4xl text-sm leading-7 text-[#607268]">
              SkinEleven does not provide a formal diagnosis or treatment plan. If a lesion is new, changing, bleeding, painful, persistent, or concerning, seek assessment from a qualified dermatologist.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
