import "same-runtime";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

if (localStorage.getItem('umunsi_theme') === 'day') {
  document.documentElement.classList.add('day-mode');
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Failed to find root element");
}

createRoot(rootElement).render(<App />);
