import Image from "next/image";

export default function FullScreenLoader() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-6 bg-[#0d4b37] text-white">
      <div className="relative h-16 w-16">
        <div className="absolute inset-0 rounded-full border-4 border-white/15" />
        <div className="absolute inset-1 rounded-full border-4 border-white/70 border-t-transparent animate-loader-spin" />
        <div className="absolute inset-4 rounded-full bg-white/20 blur-lg" />
      </div>
      <Image
        src="/logo/cooncierge-wordmark.svg"
        alt="Cooncierge"
        width={160}
        height={40}
        className="w-40 h-auto drop-shadow-[0_6px_18px_rgba(0,0,0,0.25)]"
        priority
      />
      <p className="text-sm tracking-[0.08em] text-white/80">
        Loading your workspace...
      </p>
    </div>
  );
}
