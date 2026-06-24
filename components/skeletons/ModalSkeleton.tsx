"use client";

export default function ModalSkeleton() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-[90vw] max-w-3xl bg-white rounded-2xl shadow-xl p-8 animate-pulse">
        <div className="h-6 w-2/3 bg-gray-200 rounded mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-32 bg-gray-100 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
