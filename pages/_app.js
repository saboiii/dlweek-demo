import "@/styles/globals.css";
import { useEffect } from "react";

export default function App({ Component, pageProps }) {
  useEffect(() => {
    const loadRecaptcha = () => {
      if (typeof window !== "undefined" && window.grecaptcha) {
        console.log("reCAPTCHA v3 loaded successfully");
      } else {
        console.error("Failed to load reCAPTCHA script.");
      }
    };

    if (!window.grecaptcha) {
      const script = document.createElement("script");
      script.src = `https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}&badge=inline`;
      script.async = true;
      script.onload = loadRecaptcha;
      script.onerror = () => console.error("Failed to load reCAPTCHA script.");
      document.head.appendChild(script);
    } else {
      loadRecaptcha();
    }
  }, []);

  return <Component {...pageProps} />;
}
