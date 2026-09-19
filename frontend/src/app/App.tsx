import { useState } from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router';
import { LandingPage } from './components/LandingPage';
import { ScanPage } from './components/ScanPage';
import { ResultsPage } from './components/ResultsPage';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { DashboardLayout } from './components/dashboard/DashboardLayout';
import { DashboardHome } from './components/dashboard/DashboardHome';
import { LesionProfiles } from './components/dashboard/LesionProfiles';
import { LesionDetail } from './components/dashboard/LesionDetail';
import { PdfVault } from './components/dashboard/PdfVault';
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { UserDirectory } from './components/admin/UserDirectory';
import { useAuth } from '../contexts/AuthContext';
import { AccountSettings } from './components/dashboard/AccountSettings';
import { AboutPage } from './components/AboutPage';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './components/ui/alert-dialog';
import { Checkbox } from './components/ui/checkbox';

const DATA_AGREEMENT_KEY = 'skineleven-terms-v1-accepted';

function LandingRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;
  return user ? <Navigate to="/dashboard" replace /> : <LandingPage />;
}

const router = createBrowserRouter([
  { path: "/", element: <LandingRoute /> },
  { path: "/scan", element: <ScanPage /> },
  { path: "/results", element: <ResultsPage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/about", element: <AboutPage /> },
  {
    path: "/settings",
    element: <ProtectedRoute><DashboardLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <AccountSettings /> },
    ],
  },
  {
    path: "/dashboard",
    element: <ProtectedRoute><DashboardLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <DashboardHome /> },
      { path: "scan", element: <ScanPage /> },
      { path: "settings", element: <AccountSettings /> },
      { path: "lesions", element: <LesionProfiles /> },
      { path: "lesions/:id", element: <LesionDetail /> },
      { path: "pdfs", element: <PdfVault /> },
    ]
  },
  {
    path: "/admin",
    element: <ProtectedRoute requireAdmin><AdminLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: "users", element: <UserDirectory /> },
    ]
  }
]);

export default function App() {
  const [agreementAccepted, setAgreementAccepted] = useState(() => (
    window.localStorage.getItem(DATA_AGREEMENT_KEY) === 'true'
  ));
  const [termsChecked, setTermsChecked] = useState(false);
  const [agreementDeclined, setAgreementDeclined] = useState(false);

  const acceptAgreement = () => {
    window.localStorage.setItem(DATA_AGREEMENT_KEY, 'true');
    setAgreementAccepted(true);
  };

  const declineAgreement = () => {
    setAgreementDeclined(true);
  };

  return (
    <div style={{
      backgroundColor: '#FAF7F2',
      color: '#3E2723',
      minHeight: '100vh',
      width: '100%'
    }}>
      <RouterProvider router={router} />

      <AlertDialog open={!agreementAccepted}>
        <AlertDialogContent className="!flex h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)] max-w-2xl flex-col overflow-hidden border-[#D3C2B0] bg-[#FAF7F2]">
          <AlertDialogHeader className="shrink-0">
            <AlertDialogTitle className="text-2xl text-[#33443D]">
              Terms of Service and Confidentiality Agreement
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left text-base leading-relaxed text-[#5F514B]">
              Welcome to <strong>SkinEleven!</strong> By creating an account or using this web application, you acknowledge that you have read, understood, and agreed to be bound by the following Terms of Service and Confidentiality Agreement.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto pr-2 text-sm leading-relaxed text-[#5F514B]">
            <section>
              <h3 className="mb-2 text-base font-semibold text-[#33443D]">1. Medical Disclaimer &amp; Intended Use</h3>
              <ul className="list-disc space-y-2 pl-5">
                <li><strong>Decision-Support Tool Only:</strong> This application is an academic research prototype utilizing deep learning (EfficientNetV2-L) and visual explainability (HiResCAM) to assist in early skin lesion screening.</li>
                <li><strong>Not a Medical Diagnosis:</strong> System outputs, including predicted diagnostic classes, probability scores, visual heatmaps, and longitudinal trend indicators, do <strong>not</strong> constitute a formal medical diagnosis or treatment plan.</li>
                <li><strong>Longitudinal Tracking Limitation:</strong> The lesion growth and tracking feature calculates changes based purely on user-uploaded photos over time. It is <strong>not</strong> an automated clinical assessment of malignancy or disease progression. Always consult a certified dermatologist for evolving lesions.</li>
              </ul>
            </section>

            <section>
              <h3 className="mb-2 text-base font-semibold text-[#33443D]">2. User Accounts &amp; Confidentiality</h3>
              <ul className="list-disc space-y-2 pl-5">
                <li><strong>Account Registration:</strong> Users must register an account to access features such as saved scan histories, PDF Vault exports, and lesion tracking profiles. You are responsible for maintaining the confidentiality of your login credentials.</li>
                <li><strong>Data Storage &amp; Privacy:</strong> Unlike stateless tools, this system stores account information, user-uploaded lesion photos, generated HiResCAM heatmaps, and associated metadata in a secure database to enable scan history and growth tracking.</li>
                <li><strong>Confidentiality Commitment:</strong> Your personal information and uploaded medical images are kept confidential. The research team will <strong>never</strong> sell, publicly display, or share your raw images or personally identifiable information (PII) with third parties without explicit consent.</li>
                <li><strong>Data Security &amp; Encrypted PDF Vault:</strong> PDF reports generated and stored within your account vault are secured for personal record-keeping. However, users are advised not to share exported PDFs over unsecured public networks.</li>
              </ul>
            </section>

            <section>
              <h3 className="mb-2 text-base font-semibold text-[#33443D]">3. User Data Rights &amp; Retention</h3>
              <ul className="list-disc space-y-2 pl-5">
                <li><strong>Data Ownership:</strong> You retain ownership of all images and records stored under your profile.</li>
                <li><strong>Account Deletion &amp; Data Purging:</strong> You reserve the right to delete your account or specific lesion profiles at any time. Upon deletion, your stored images, scan histories, and PDF records will be permanently purged from our active database.</li>
              </ul>
            </section>

            <section>
              <h3 className="mb-2 text-base font-semibold text-[#33443D]">4. Image Upload Guidelines</h3>
              <ul className="list-disc space-y-2 pl-5">
                <li>Users are responsible for uploading clear, well-lit, and focused images.</li>
                <li>Variations in camera quality, lighting, angle, and distance during longitudinal tracking can impact the consistency of growth comparison. The system is not liable for inaccuracies caused by inconsistent photo quality.</li>
              </ul>
            </section>

            <section>
              <h3 className="mb-2 text-base font-semibold text-[#33443D]">5. Limitation of Liability</h3>
              <p>Under no circumstances shall the research team, developers, or <strong>Our Lady of Fatima University</strong> be held liable for any decisions, actions, or medical outcomes resulting from reliance upon stored scan histories, PDF exports, or lesion tracking data provided by this application.</p>
            </section>

            <section>
              <h3 className="mb-2 text-base font-semibold text-[#33443D]">6. Contact Information</h3>
              <p className="mb-2">For privacy inquiries, data deletion requests, or technical support:</p>
              <ul className="list-disc space-y-1 pl-5">
                <li><a className="text-[#2f604e] underline" href="mailto:dpcastillo1013qc@student.fatima.edu.ph">dpcastillo1013qc@student.fatima.edu.ph</a></li>
                <li><a className="text-[#2f604e] underline" href="mailto:cssantos2988qc@student.fatima.edu.ph">cssantos2988qc@student.fatima.edu.ph</a></li>
              </ul>
            </section>
          </div>

          <label className="flex shrink-0 cursor-pointer items-start gap-3 text-sm leading-relaxed text-[#5F514B]">
            <Checkbox
              checked={termsChecked}
              onCheckedChange={(checked) => setTermsChecked(checked === true)}
              className="mt-1 border-[#607268] data-[state=checked]:bg-[#33443D] data-[state=checked]:text-[#FAF7F2]"
            />
            <span>I have read, understood, and agree to the Terms of Service and Confidentiality Agreement.</span>
          </label>

          {agreementDeclined && (
            <p role="alert" className="shrink-0 border-l-2 border-[#b66f45] bg-[#f2e5d6] px-4 py-3 text-sm leading-relaxed text-[#684f3b]">
              You can only proceed to SkinEleven if you agree to the Terms of Service and Confidentiality Agreement. Please review the terms, check the box, and select Agree to continue.
            </p>
          )}

          <AlertDialogFooter className="shrink-0">
            <AlertDialogCancel onClick={declineAgreement} className="w-full sm:w-auto">
              Disagree
            </AlertDialogCancel>
            <AlertDialogAction onClick={acceptAgreement} disabled={!termsChecked} className="w-full sm:w-auto">
              Agree
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
