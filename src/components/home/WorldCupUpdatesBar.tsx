import { Trophy } from 'lucide-react';

const WorldCupUpdatesBar = () => (
  <div className="bg-gradient-to-r from-[#0b5d2a] via-[#0b3d20] to-[#0b0e11] border-b border-[#fcd535]/35">
    <div className="w-full px-3 md:px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
      <div className="inline-flex items-center gap-2 rounded-full bg-[#fcd535] px-3 py-1.5 text-[#0b0e11] shrink-0">
        <Trophy className="h-4 w-4" />
        <span className="text-[11px] md:text-xs font-black uppercase tracking-[0.18em]">World Cup Updates</span>
      </div>
      <p className="text-sm md:text-base font-semibold text-white leading-snug">
        Amakuru yose y&apos;igikombe cy&apos;Isi asangwa hano. ⚽🔥
      </p>
    </div>
  </div>
);

export default WorldCupUpdatesBar;
