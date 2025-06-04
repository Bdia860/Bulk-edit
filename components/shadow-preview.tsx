import React, { useRef, useEffect } from "react";

interface ShadowPreviewProps {
  html: string;
  css: string;
  className?: string;
}

function filterGlobalSelectors(css: string): string {
  // Retire toute règle qui cible h1, body, html, etc. (simple mais efficace)
  return css.replace(/(^|\})\s*(h1|body|html|#root|\.topbar)[^{]*\{[^}]*\}/gi, "");
}

export const ShadowPreview: React.FC<ShadowPreviewProps> = ({ html, css, className }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      let shadowRoot = containerRef.current.shadowRoot;
      if (!shadowRoot) {
        shadowRoot = containerRef.current.attachShadow({ mode: "open" });
      }
      shadowRoot.innerHTML = `<style>${filterGlobalSelectors(css)}</style>${html}`;
    }
  }, [html, css]);

  return <div ref={containerRef} className={className} />;
};
