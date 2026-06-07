const HomeContentSkeleton = () => (
  <div className="px-3 py-4 space-y-4 animate-pulse" aria-busy="true" aria-label="Loading news">
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      <div className="lg:col-span-8 h-72 bg-[#e8e8e4] rounded-lg" />
      <div className="lg:col-span-4 space-y-3">
        <div className="h-24 bg-[#e8e8e4] rounded-lg" />
        <div className="h-24 bg-[#e8e8e4] rounded-lg" />
        <div className="h-24 bg-[#e8e8e4] rounded-lg" />
      </div>
    </div>
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex gap-3">
          <div className="w-28 h-20 bg-[#e8e8e4] rounded flex-shrink-0" />
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 bg-[#e8e8e4] rounded w-full" />
            <div className="h-4 bg-[#e8e8e4] rounded w-2/3" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default HomeContentSkeleton;
