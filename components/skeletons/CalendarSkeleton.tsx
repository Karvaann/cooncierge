"use client";

export default function CalendarSkeleton() {
  return (
    <div className="w-full min-h-[70vh] bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 w-48 bg-gray-200 rounded" />
        <div className="flex gap-3">
          <div className="h-10 w-10 bg-gray-200 rounded-lg" />
          <div className="h-10 w-32 bg-gray-200 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }).map((_, index) => (
          <div key={index} className="h-24 bg-gray-100 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
