// src/libs/culqi.ts

export const loadCulqi = () => {
    const script = document.createElement("script");
    script.src = "https://checkout.culqi.com/js/v3";
    script.async = true;
    script.onload = () => {
      console.log("Culqi script loaded");
    };
    script.onerror = () => {
      console.error("Error loading Culqi script");
    };
    document.body.appendChild(script);
  };
  