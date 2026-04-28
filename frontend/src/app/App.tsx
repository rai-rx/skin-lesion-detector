import { createBrowserRouter, RouterProvider } from 'react-router';
import { LandingPage } from './components/LandingPage';
import { ScanPage } from './components/ScanPage';
import { ResultsPage } from './components/ResultsPage';

const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/scan",
    element: <ScanPage />,
  },
  {
    path: "/results",
    element: <ResultsPage />,
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
