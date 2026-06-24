"use client";

export default function TableSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden animate-pulse">
      <div className="h-12 bg-gray-100" />
      <div className="space-y-2 p-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-10 bg-gray-100 rounded" />
        ))}
      </div>
    </div>
  );
}
