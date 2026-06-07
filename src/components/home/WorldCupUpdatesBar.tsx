import { Trophy } from 'lucide-react';

const WorldCupUpdatesBar = () => (
  <div className="bg-gradient-to-r from-[#0b5d2a] via-[#0b3d20] to-[#0b0e11] border-b border-[#fcd535]/35">
    <div className="w-full px-3 md:px-4 py-3 flex items-center justify-center sm:justify-start gap-3">
      <Trophy className="h-5 w-5 text-[#fcd535] shrink-0 hidden sm:block" />
      <p className="text-sm md:text-base font-bold text-white text-center sm:text-left leading-snug">
        Amakuru yose y&apos;igikombe cy&apos;Isi asangwa hano. ⚽🔥
      </p>
    </div>
  </div>
);

export default WorldCupUpdatesBar;
