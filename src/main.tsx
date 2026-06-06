import "same-runtime";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { warmSiteData } from "./lib/siteBootstrap";
import { pruneEmptyContentCaches } from "./lib/requestCache";

const applyThemeClass = () => {
  try {
    if (localStorage.getItem("umunsi_theme_initialized_v3") !== "1") {
      localStorage.setItem("umunsi_theme", "day");
      localStorage.setItem("umunsi_theme_initialized_v3", "1");
    }

    if (localStorage.getItem("umunsi_theme") === "day") {
      document.documentElement.classList.add("day-mode");
    } else {
      document.documentElement.classList.remove("day-mode");
    }
  } catch {
    document.documentElement.classList.add("day-mode");
  }
};

applyThemeClass();
pruneEmptyContentCaches();
try {
  const raw = sessionStorage.getItem('umunsi_home_cache_v1');
  if (raw) {
    const parsed = JSON.parse(raw) as { posts?: unknown[] };
    if (!Array.isArray(parsed.posts) || parsed.posts.length === 0) {
      sessionStorage.removeItem('umunsi_home_cache_v1');
    }
  }
} catch {
  sessionStorage.removeItem('umunsi_home_cache_v1');
}
warmSiteData();

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Failed to find root element");
}


createRoot(rootElement).render(<App />);
