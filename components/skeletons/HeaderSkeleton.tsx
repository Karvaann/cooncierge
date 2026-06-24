"use client";

export default function HeaderSkeleton() {
  return (
    <div className="ml-16 sm:ml-56 transition-all duration-500 ease-in-out">
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="h-6 w-40 bg-gray-200 rounded-lg animate-pulse" />
      </div>
      <div className="bg-gray-100 border-b border-gray-200 px-8 py-3">
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  );
}
