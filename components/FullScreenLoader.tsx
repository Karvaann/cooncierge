"use client";

import Lottie from "lottie-react";
import loaderAnimation from "@/public/loader.json";

export default function FullScreenLoader() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-3 bg-[#FFF] text-white">
      <div className="w-[80vh] h-[80vh}">
        <Lottie
          animationData={loaderAnimation}
          loop
          autoplay
          style={{ width: "100%", height: "100%" }}
        />
      </div>
      <p className="text-sm tracking-[0.08em] text-white/80">
        Loading your workspace...
      </p>
    </div>
  );
}
