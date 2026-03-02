import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  /** message shown below the spinner */
  message?: string;
  /** Render as a full-area overlay */
  overlay?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { spinner: "h-5 w-5", border: "border-2" },
  md: { spinner: "h-8 w-8", border: "border-[3px]" },
  lg: { spinner: "h-12 w-12", border: "border-4" },
} as const;

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  message,
  overlay = false,
  className = "",
}) => {
  const { spinner, border } = sizeMap[size] ?? sizeMap.md;

  const content = (
    <div
      className={`flex flex-col items-center justify-center gap-2 ${className}`}
    >
      <div
        className={`${spinner} ${border} rounded-full border-[#0D4B37]/20 border-t-[#0D4B37] animate-spin`}
      />
      {message && (
        <p className="text-xs text-gray-500 font-medium select-none">
          {message}
        </p>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70 backdrop-blur-[1px] rounded-[12px]">
        <div className="transform -translate-y-8">{content}</div>
      </div>
    );
  }

  return content;
};

export default LoadingSpinner;
