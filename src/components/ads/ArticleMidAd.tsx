import { useEffect, useRef } from 'react';

const INVOKE_SCRIPT_SRC =
  'https://pl18296531.effectivecpmnetwork.com/5b46e2d36f21bea432152fac20277690/invoke.js';
const CONTAINER_ID = 'container-5b46e2d36f21bea432152fac20277690';

interface ArticleMidAdProps {
  className?: string;
}

const ArticleMidAd = ({ className = '' }: ArticleMidAdProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    const existing = document.querySelector(`script[src="${INVOKE_SCRIPT_SRC}"]`);
    if (!existing) {
      const script = document.createElement('script');
      script.async = true;
      script.setAttribute('data-cfasync', 'false');
      script.src = INVOKE_SCRIPT_SRC;
      document.body.appendChild(script);
    }
  }, []);

  return (
    <div
      className={`my-6 rounded-lg border border-[#2b2f36] bg-[#0b0e11] overflow-hidden ${className}`}
      aria-label="Advertisement"
    >
      <p className="text-center text-[10px] uppercase tracking-widest text-gray-600 py-1.5 border-b border-[#2b2f36]">
        Advertisement
      </p>
      <div ref={containerRef} id={CONTAINER_ID} className="min-h-[90px] flex items-center justify-center" />
    </div>
  );
};

export default ArticleMidAd;
