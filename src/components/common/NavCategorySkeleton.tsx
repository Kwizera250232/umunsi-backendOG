const NavCategorySkeleton = () => (
  <div className="flex items-center gap-2 px-2" aria-hidden="true">
    {Array.from({ length: 6 }).map((_, index) => (
      <div key={index} className="h-8 w-20 bg-[#1e2329] rounded-lg animate-pulse" />
    ))}
  </div>
);

export default NavCategorySkeleton;
