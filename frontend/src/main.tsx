
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import { AuthProvider } from "./contexts/AuthContext";
  import "./styles/index.css";

  // Ensure theme is applied immediately
  document.documentElement.style.backgroundColor = "#FAF7F2";
  document.documentElement.style.color = "#3E2723";
  document.body.style.backgroundColor = "#FAF7F2";
  document.body.style.color = "#3E2723";

  createRoot(document.getElementById("root")!).render(
    <AuthProvider>
      <App />
    </AuthProvider>,
  );
  