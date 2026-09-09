"use client";

import { useEffect } from "react";

export default function PwaRegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.log("Ascend PWA Service Worker registered:", reg.scope);
          })
          .catch((err) => {
            console.warn("Ascend PWA Service Worker registration failed:", err);
          });
      });
    }
  }, []);

  return null;
}
