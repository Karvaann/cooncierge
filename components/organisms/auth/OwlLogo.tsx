"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

const OWL_SIZE = { width: 66, height: 92 };
const OPEN_EYE = { left: 47, top: 39, size: 14 };
const CLOSED_EYE = { left: 26, top: 33, width: 40, height: 41 };
const EYE_TRAVEL = {
  left: -8,
  right: 2,
  up: -4,
  down: 4,
};

interface OwlLogoProps {
  passwordVisible: boolean;
}

export default function OwlLogo({ passwordVisible }: OwlLogoProps) {
  const owlRef = useRef<HTMLDivElement>(null);
  const eyeRotationRef = useRef(0);
  const [eyeMotion, setEyeMotion] = useState({ x: 0, y: 0, rotation: 0 });

  useEffect(() => {
    if (passwordVisible) {
      eyeRotationRef.current = 0;
      setEyeMotion({ x: 0, y: 0, rotation: 0 });
      return;
    }

    function clamp(value: number, min: number, max: number) {
      return Math.min(Math.max(value, min), max);
    }

    function getContinuousRotation(rotation: number) {
      const previousRotation = eyeRotationRef.current;
      const rotationDelta = ((((rotation - previousRotation) % 360) + 540) % 360) - 180;

      return previousRotation + rotationDelta;
    }

    function handlePointerMove(event: PointerEvent) {
      const owl = owlRef.current;

      if (!owl) {
        return;
      }

      const bounds = owl.getBoundingClientRect();
      const eyeCenterX = bounds.left + OPEN_EYE.left + OPEN_EYE.size / 2;
      const eyeCenterY = bounds.top + OPEN_EYE.top + OPEN_EYE.size / 2;
      const deltaX = event.clientX - eyeCenterX;
      const deltaY = event.clientY - eyeCenterY;
      const rotation = getContinuousRotation(Math.atan2(deltaY, deltaX) * (180 / Math.PI));

      eyeRotationRef.current = rotation;

      setEyeMotion({
        x: clamp(deltaX / 18, EYE_TRAVEL.left, EYE_TRAVEL.right),
        y: clamp(deltaY / 22, EYE_TRAVEL.up, EYE_TRAVEL.down),
        rotation,
      });
    }

    window.addEventListener("pointermove", handlePointerMove);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, [passwordVisible]);

  return (
    <div className="flex flex-col items-center">
      <div ref={owlRef} className="relative h-[92px] w-[66px]" aria-hidden>
        <Image
          src="/login/owl.svg"
          alt=""
          width={OWL_SIZE.width}
          height={OWL_SIZE.height}
          priority
          className="h-[92px] w-[66px]"
        />
        {passwordVisible ? (
          <Image
            src="/login/eye_closed.svg"
            alt=""
            width={CLOSED_EYE.width}
            height={CLOSED_EYE.height}
            className="absolute h-[41px] w-[40px]"
            style={{ left: CLOSED_EYE.left, top: CLOSED_EYE.top }}
          />
        ) : (
          <Image
            src="/login/eye.svg"
            alt=""
            width={OPEN_EYE.size}
            height={OPEN_EYE.size}
            className="absolute h-[15px] w-[15px] transition-transform duration-75 ease-out"
            style={{
              left: OPEN_EYE.left,
              top: OPEN_EYE.top,
              transform: `translate(${eyeMotion.x}px, ${eyeMotion.y}px) rotate(${eyeMotion.rotation}deg)`,
            }}
          />
        )}
      </div>

      <Image
        src="/full_logo.svg"
        alt="Cooncierge Logo"
        width={120}
        height={53}
        priority
        className="-mt-1 h-auto w-[120px]"
      />
    </div>
  );
}
