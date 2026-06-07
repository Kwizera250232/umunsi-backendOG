import { useLayoutEffect, useRef } from 'react';
import { ADSENSE_CLIENT } from '../../constants/adsense';
import { pushAdSenseSlots } from '../../lib/adsense';

type AdSenseUnitProps = {
  slot: string;
  className?: string;
  wrapperClassName?: string;
  label?: string;
  minHeight?: number;
  format?: 'auto' | 'fluid' | 'rectangle';
};

const AdSenseUnit = ({
  slot,
  className = '',
  wrapperClassName = '',
  label = 'Advertisement',
  minHeight = 90,
  format = 'auto',
}: AdSenseUnitProps) => {
  const insRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const run = () => {
      const root = insRef.current?.parentElement;
      if (root) pushAdSenseSlots(root);
    };

    run();
    const retryTimers = [0, 50, 150, 400].map((delay) => window.setTimeout(run, delay));
    return () => retryTimers.forEach((timer) => window.clearTimeout(timer));
  }, [slot]);

  return (
    <div
      className={`umunsi-ad-slot not-prose ${wrapperClassName}`.trim()}
      style={{ textAlign: 'center', overflow: 'visible', minHeight: `${minHeight}px` }}
      aria-label={label}
    >
      {label ? (
        <p className="text-gray-500 text-[0.65rem] uppercase tracking-wider mb-1">{label}</p>
      ) : null}
      <ins
        ref={insRef as React.RefObject<HTMLModElement>}
        className={`adsbygoogle ${className}`.trim()}
        style={{ display: 'block', minHeight: `${minHeight}px`, width: '100%' }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
};

export default AdSenseUnit;
