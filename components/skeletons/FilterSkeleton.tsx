"use client";

export default function FilterSkeleton() {
  return (
    <div className="w-full bg-white border border-gray-200 rounded-xl p-4 shadow-sm animate-pulse">
      <div className="flex flex-wrap gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-10 w-36 bg-gray-100 rounded" />
        ))}
      </div>
    </div>
  );
}
