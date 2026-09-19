import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ArrowRight, Camera, ScanLine, BookOpen } from 'lucide-react';
import { ImageGalleryModal } from './ImageGalleryModal';
import { Header } from './Header';

const benignImages = [
  'https://www.dermatologyadvisor.com/wp-content/uploads/sites/20/2019/03/ch851.fig1_.jpg',
  'https://tse1.explicit.bing.net/th/id/OIP.Q2wHP02-iJlTY2paGnEjdQHaF2?r=0&rs=1&pid=ImgDetMain&o=7&rm=3',
  'https://tse4.mm.bing.net/th/id/OIP.pmuyGwpvlZQHzoUFh74hKAHaHa?r=0&w=1000&h=1000&rs=1&pid=ImgDetMain&o=7&rm=3',
  'https://www.beyondskinderm.com/wp-content/uploads/2025/05/benign-lesion-removal-banner-2.jpg',
];

const malignantImages = [
  'https://tse1.explicit.bing.net/th/id/OIP._Jpih-fxAbmyjVYE8PKn3QHaGD?r=0&rs=1&pid=ImgDetMain&o=7&rm=3',
  'https://images.everydayhealth.com/images/cancer/skin-cancer/what-is-basal-cell-carcinoma-skin-cancer-1440x810.jpg?sfvrsn=f0aac5ff_5',
  'https://torontodermatologycentre.com/wp-content/uploads/2020/06/malignant-melanoma.jpg',
  'https://citydermatologyclinic.com/wp-content/uploads/2025/09/Squamous-Cell-Carcinoma-1024x1024.jpg',
];

const steps = [
  { number: '01', icon: Camera, title: 'Capture a clear image', description: 'Use your camera or upload a photo of the area you want to review.' },
  { number: '02', icon: ScanLine, title: 'Review the analysis', description: 'Our model compares visual patterns across several lesion categories.' },
  { number: '03', icon: BookOpen, title: 'Keep context over time', description: 'Save scans to a profile so changes are easier to discuss with a clinician.' },
];

export function LandingPage() {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState<'benign' | 'malignant' | null>(null);

    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header showMenu={false} />

        <main>
          <section className="relative overflow-hidden border-b border-[#D3C2B0] bg-[#E8DED0]">
            <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.42),transparent_48%,rgba(193,123,92,0.16))] pointer-events-none" />
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-12 sm:pt-14 sm:pb-16 md:pt-20 md:pb-24">
              <div className="grid lg:grid-cols-[1.02fr_0.98fr] gap-8 sm:gap-10 lg:gap-20 items-center">
                <motion.div
                  initial={{ opacity: 0, x: -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="inline-flex items-center gap-2 text-[11px] sm:text-sm font-semibold tracking-[0.16em] uppercase text-accent mb-5 sm:mb-6">
                    <span className="w-8 h-px bg-accent" /> Skin health, made clearer
                  </div>
                  <h1 className="text-4xl sm:text-5xl md:text-7xl leading-[0.98] tracking-tight max-w-xl">
                    A closer look at your skin.
                  </h1>
                  <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl mt-5 sm:mt-7">
                    SkinEleven helps you review lesion images, understand visual risk signals, and build a timeline to bring to your healthcare provider.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3 mt-7 sm:mt-9">
                    <button
                      type="button"
                      onClick={() => navigate('/scan')}
                      className="inline-flex items-center justify-center gap-2 sm:gap-3 px-5 sm:px-6 py-3.5 sm:py-4 rounded-xl bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
                    >
                      <ScanLine className="w-5 h-5" /> Start a scan
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                  className="relative mt-2 sm:mt-0"
                >
                  <div className="absolute -inset-3 rounded-[2rem] bg-accent/10 rotate-2" />
                  <div className="relative mx-auto lg:ml-auto aspect-[4/5] w-full max-w-[320px] sm:max-w-sm overflow-hidden rounded-[1.5rem] bg-muted shadow-2xl">
                    <img
                      src={benignImages[0]}
                      alt="Close-up example of skin texture"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-x-3 sm:inset-x-4 bottom-3 sm:bottom-4 bg-card/95 backdrop-blur-sm border border-white/70 rounded-xl p-3 sm:p-4 shadow-lg">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-green-100 text-green-700 flex items-center justify-center shrink-0">
                          <ScanLine className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">Image review starts here</p>
                          <p className="text-xs text-muted-foreground mt-1">Clear, well-lit photos lead to more useful results.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5 md:gap-6 mt-10 sm:mt-14 pt-6 border-t border-[#D3C2B0] max-w-3xl">
                <Metric value="11" label="lesion categories" />
                <Metric value="1" label="place for your scans" />
                <Metric value="24/7" label="available for review" />
                <Metric value="0" label="diagnoses promised" />
              </div>
            </div>
          </section>

          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-18 md:py-28">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 sm:gap-6 mb-8 sm:mb-10">
              <div>
                <p className="text-sm font-semibold tracking-[0.16em] uppercase text-accent mb-3">From image to insight</p>
                <h2 className="text-3xl sm:text-4xl md:text-5xl max-w-xl leading-tight">A simple routine for paying attention.</h2>
              </div>
              <p className="text-muted-foreground max-w-sm leading-relaxed">Use the result as a conversation starter, alongside regular skin checks and professional care.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-px bg-border border border-border rounded-2xl overflow-hidden">
              {steps.map((step) => (
                <div key={step.number} className="bg-card p-5 sm:p-7 md:p-8 min-h-[230px]">
                  <div className="flex items-center justify-between mb-8 sm:mb-12">
                    <step.icon className="w-6 h-6 text-accent" />
                    <span className="font-display text-3xl text-border">{step.number}</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-[#33443D] text-[#FAF7F2]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16 md:py-20">
              <div className="grid lg:grid-cols-[0.7fr_1.3fr] gap-8 sm:gap-10 lg:gap-12 items-start">
                <div>
                  <p className="text-sm font-semibold tracking-[0.16em] uppercase text-[#E5B393] mb-3">Know the signs</p>
                  <h2 className="text-3xl sm:text-4xl md:text-5xl leading-tight">The ABCDE check.</h2>
                  <p className="text-[#D8E0D9]/75 mt-5 leading-relaxed max-w-sm">A quick visual reminder for changes worth documenting and discussing with a dermatologist.</p>
                </div>
                <div className="grid sm:grid-cols-2 gap-x-6 sm:gap-x-10 gap-y-6 sm:gap-y-7">
                  <SignItem letter="A" title="Asymmetry" text="One half looks different from the other." />
                  <SignItem letter="B" title="Border" text="Edges look uneven, blurred, or notched." />
                  <SignItem letter="C" title="Color" text="Color varies across the same spot." />
                  <SignItem letter="D" title="Diameter" text="The spot is larger than about 6 mm." />
                  <SignItem letter="E" title="Evolving" text="It changes in size, shape, or color." />
                </div>
              </div>
            </div>
          </section>

          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16 md:py-24">
            <div className="flex flex-col md:flex-row gap-6 items-start mb-8 sm:mb-10">
              <div>
                <p className="text-sm font-semibold tracking-[0.16em] uppercase text-accent mb-3">Explore the library</p>
                <h2 className="text-3xl sm:text-4xl leading-tight">Context for the conversation.</h2>
                <p className="text-muted-foreground mt-3 max-w-2xl leading-relaxed">Browse example images to learn the difference between common visual patterns. Samples are educational and are not a substitute for an examination.</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 sm:gap-5">
              <InfoCard title="Common benign patterns" description="Explore examples of spots that are often harmless, while remembering that changes still deserve attention." onClick={() => setModalOpen('benign')} />
              <InfoCard title="Patterns to discuss promptly" description="Review examples associated with higher concern and learn why an in-person evaluation matters." onClick={() => setModalOpen('malignant')} />
            </div>
          </section>

          <footer className="border-t border-border bg-card/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-4 md:gap-8 md:justify-start text-sm text-muted-foreground">
              <p><strong className="text-foreground">Medical disclaimer:</strong> SkinEleven is educational and does not diagnose or replace professional medical advice.</p>
              <p className="shrink-0">When in doubt, contact a qualified healthcare provider.</p>
            </div>
          </footer>
        </main>

        <ImageGalleryModal isOpen={modalOpen === 'benign'} onClose={() => setModalOpen(null)} title="Benign Lesions - Sample Images" images={benignImages} />
        <ImageGalleryModal isOpen={modalOpen === 'malignant'} onClose={() => setModalOpen(null)} title="Lesion Patterns - Sample Images" images={malignantImages} />
      </div>
    );
  }

  function Metric({ value, label }: { value: string; label: string }) {
    return (
      <div>
        <p className="font-display text-4xl md:text-5xl leading-none text-foreground">{value}</p>
        <p className="text-sm md:text-base font-medium text-muted-foreground mt-2">{label}</p>
      </div>
    );
  }

  function SignItem({ letter, title, text }: { letter: string; title: string; text: string }) {
    return (
      <div className="flex gap-4">
        <span className="font-display text-3xl text-[#E5B393] leading-none">{letter}</span>
        <div>
          <h3 className="text-xl">{title}</h3>
          <p className="text-sm text-[#D8E0D9]/70 mt-1 leading-relaxed">{text}</p>
        </div>
      </div>
    );
  }

  interface InfoCardProps {
    title: string;
    description: string;
    onClick: () => void;
  }

  function InfoCard({ title, description, onClick }: InfoCardProps) {
    return (
      <motion.button
        type="button"
        whileHover={{ y: -4 }}
        whileTap={{ scale: 0.99 }}
        onClick={onClick}
        className="group w-full text-left bg-card border border-border rounded-2xl p-5 sm:p-6 hover:border-primary/40 hover:shadow-lg transition-all"
      >
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-xl sm:text-2xl">{title}</h3>
          <ArrowRight className="w-5 h-5 text-primary opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed mt-3">{description}</p>
        <span className="inline-block text-xs font-semibold text-primary mt-5">View sample images</span>
      </motion.button>
    );
  }
