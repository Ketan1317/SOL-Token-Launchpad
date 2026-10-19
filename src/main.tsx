
import { Buffer } from "buffer";

// Solana libraries may require Buffer in the browser.
window.Buffer = Buffer;

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
