import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Upload, Camera, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { ImageGalleryModal } from './ImageGalleryModal';
import { Header } from './Header';

const benignImages = [
  'https://images.unsplash.com/photo-1541752857837-f8a0154fd092?w=1080&q=80',
  'https://images.unsplash.com/photo-1605553702283-f9f767e524c7?w=1080&q=80',
  'https://images.unsplash.com/photo-1723540634462-528708cc17aa?w=1080&q=80',
  'https://images.unsplash.com/photo-1710580889701-9fa8f2cd5927?w=1080&q=80',
];

const malignantImages = [
  'https://images.unsplash.com/photo-1541752857837-f8a0154fd092?w=1080&q=80',
  'https://images.unsplash.com/photo-1710580889701-9fa8f2cd5927?w=1080&q=80',
  'https://images.unsplash.com/photo-1605553702283-f9f767e524c7?w=1080&q=80',
  'https://images.unsplash.com/photo-1723540634462-528708cc17aa?w=1080&q=80',
];

export function LandingPage() {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState<'benign' | 'malignant' | null>(null);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="relative overflow-hidden">
      {/* Organic background shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.4, scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="absolute -top-40 -right-40 w-96 h-96 bg-accent/20 rounded-full blur-3xl"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.3, scale: 1 }}
          transition={{ duration: 1.4, ease: "easeOut", delay: 0.2 }}
          className="absolute top-1/3 -left-32 w-80 h-80 bg-primary/10 rounded-full blur-3xl"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.35, scale: 1 }}
          transition={{ duration: 1.3, ease: "easeOut", delay: 0.4 }}
          className="absolute -bottom-32 right-1/4 w-72 h-72 bg-secondary/15 rounded-full blur-3xl"
        />
      </div>

      {/* Hero Section */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 pt-12 pb-8"
      >
        <div className="text-center max-w-4xl mx-auto">
         
          <motion.h1
            variants={itemVariants}
            className="text-6xl md:text-7xl lg:text-8xl text-foreground mb-2 tracking-tight"
          >
            Skin Lesion Detection & Awareness
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-6"
          >
            Early identification of skin lesions can be critical for successful treatment.
            Our educational tool helps you understand different types of skin conditions
            and the importance of regular skin health monitoring.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-8"
          >
            <motion.button
              onClick={() => navigate('/scan')}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="group relative px-10 py-5 bg-primary text-primary-foreground rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 min-w-[240px] overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative flex items-center justify-center gap-3 text-lg">
                <Upload className="w-5 h-5" />
                Upload Photo
              </span>
            </motion.button>

            <motion.button
              onClick={() => navigate('/scan')}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="group relative px-10 py-5 bg-white text-primary border-2 border-primary rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 min-w-[240px] overflow-hidden"
            >
              <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
              <span className="relative flex items-center justify-center gap-3 text-lg">
                <Camera className="w-5 h-5" />
                Take a Photo
              </span>
            </motion.button>
          </motion.div>
        </div>
      </motion.section>

      {/* Information Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-2">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl text-foreground mb-4">
            Understanding Skin Lesions
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Knowledge is the first step toward proactive skin health
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <InfoCard
            icon={<CheckCircle className="w-8 h-8" />}
            title="Benign Lesions"
            description="Most skin lesions are benign (non-cancerous) and pose no serious health risks. These include moles, freckles, age spots, and seborrheic keratoses. While typically harmless, monitoring changes in appearance is important."
            iconColor="bg-green-100 text-green-700"
            delay={0.2}
            onClick={() => setModalOpen('benign')}
          />

          <InfoCard
            icon={<AlertCircle className="w-8 h-8" />}
            title="Malignant Lesions"
            description="Malignant lesions require immediate medical attention. These include melanoma, basal cell carcinoma, and squamous cell carcinoma. Early detection dramatically improves treatment outcomes and survival rates."
            iconColor="bg-amber-100 text-amber-700"
            delay={0.3}
            onClick={() => setModalOpen('malignant')}
          />
        </div>

        {/* Image Gallery Modals */}
        <ImageGalleryModal
          isOpen={modalOpen === 'benign'}
          onClose={() => setModalOpen(null)}
          title="Benign Lesions - Sample Images"
          images={benignImages}
        />
        <ImageGalleryModal
          isOpen={modalOpen === 'malignant'}
          onClose={() => setModalOpen(null)}
          title="Malignant Lesions - Sample Images"
          images={malignantImages}
        />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="bg-card rounded-3xl shadow-xl p-8 md:p-12 border border-border"
        >
          <div className="flex items-center gap-6">
            <div className="flex-shrink-0 w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-amber-700" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl md:text-3xl mb-6">Warning Signs to Watch For</h3>
              <div>
                <h4 className="text-foreground mb-4 text-lg">The ABCDE Rule:</h4>
                <ul className="space-y-3 text-muted-foreground mb-6">
                  <li><strong className="text-foreground">A</strong>symmetry – One half doesn't match the other</li>
                  <li><strong className="text-foreground">B</strong>order – Edges are irregular or blurred</li>
                  <li><strong className="text-foreground">C</strong>olor – Multiple colors or uneven distribution</li>
                  <li><strong className="text-foreground">D</strong>iameter – Larger than 6mm (pencil eraser)</li>
                  <li><strong className="text-foreground">E</strong>volving – Changes in size, shape, or color</li>
                </ul>
                <div className="text-center pt-4 border-t border-border">
                  <p className="text-foreground"><strong>Note:</strong> Always consult a dermatologist for proper evaluation</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer Disclaimer */}
      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-12 text-center"
      >
        <div className="bg-muted/50 rounded-2xl p-6 border border-border/50">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Medical Disclaimer:</strong> This tool is for educational and informational purposes only.
            It is not intended to diagnose, treat, or replace professional medical advice.
            Always consult with a qualified healthcare provider for proper evaluation and diagnosis.
          </p>
        </div>
      </motion.footer>
      </div>
    </div>
  );
}

interface InfoCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  iconColor: string;
  delay: number;
  onClick: () => void;
}

function InfoCard({ icon, title, description, iconColor, delay, onClick }: InfoCardProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, delay }}
      whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-card rounded-2xl p-8 shadow-lg border border-border hover:shadow-2xl transition-all duration-300 text-left w-full cursor-pointer group relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative">
        <div className={`w-16 h-16 ${iconColor} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
        <h3 className="text-2xl mb-4">{title}</h3>
        <p className="text-muted-foreground leading-relaxed mb-4">{description}</p>
        <div className="text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          Click to view sample images →
        </div>
      </div>
    </motion.button>
  );
}
