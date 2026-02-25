interface AlertBannerProps {
  message: string;
  onClose: () => void;
}

export default function AlertBanner({ message, onClose }: AlertBannerProps) {
  return (
    <div className="fixed left-1/2 top-8 z-[100] mt-4 flex w-auto max-w-[90vw] -translate-x-1/2 items-center justify-between whitespace-nowrap rounded-full border border-red-200 bg-red-50 px-4 py-2 text-red-600 shadow-lg">
      <div className="flex items-center gap-2">
        <svg
          className="h-5 w-5 text-red-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 8v4m0 4h.01"
          />
        </svg>
        <span className="font-semibold">Error:</span>
        <span>{message}</span>
      </div>
      <button
        type="button"
        className="ml-2 text-2xl font-bold text-red-400 hover:text-red-600"
        aria-label="Close alert"
        onClick={onClose}
      >
        ×
      </button>
    </div>
  );
}
