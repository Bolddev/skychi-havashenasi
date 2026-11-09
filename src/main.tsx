import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { registerSW } from "./pwa/registerSW";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// ثبت Service Worker پس از بارگذاری اپ
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    registerSW();
  });
}
