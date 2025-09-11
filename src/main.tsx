import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ThemeProvider } from "./contexts/ThemeContext.tsx";
import { UploadProvider } from "./contexts/UploadContext.tsx";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <UploadProvider>
      <App />
    </UploadProvider>
  </ThemeProvider>
);
