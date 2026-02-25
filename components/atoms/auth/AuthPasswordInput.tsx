import type { InputHTMLAttributes } from "react";

interface AuthPasswordInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  visible: boolean;
  onToggleVisible: () => void;
}

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="17" height="14" viewBox="0 0 17 14" fill="none" aria-hidden>
        <path
          d="M8.25 11.25C5.25 11.25 2.75025 9.50025 0.75 6C2.75025 2.49975 5.25 0.75 8.25 0.75C11.25 0.75 13.7497 2.49975 15.75 6C15.435 6.552 15.1065 7.0605 14.7667 7.52475M10.5 11.25L12 12.75L15 9.75M9.75 6C9.75 6.82843 9.07843 7.5 8.25 7.5C7.42157 7.5 6.75 6.82843 6.75 6C6.75 5.17157 7.42157 4.5 8.25 4.5C9.07843 4.5 9.75 5.17157 9.75 6Z"
          stroke="#818181"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="17" height="15" viewBox="0 0 17 15" fill="none" aria-hidden>
      <path
        d="M1.5 0.75L15 14.25M7.188 6.44023C6.90653 6.72149 6.74833 7.10305 6.74819 7.50095C6.74805 7.89886 6.90598 8.28052 7.18725 8.56198C7.46851 8.84344 7.85006 9.00164 8.24797 9.00179C8.64587 9.00193 9.02753 8.84399 9.309 8.56273M6.27225 2.52375C6.91531 2.33979 7.58115 2.24763 8.25 2.25C11.25 2.25 13.7497 3.99975 15.75 7.5C15.1665 8.52075 14.541 9.393 13.8727 10.116M12.2678 11.5117C11.0445 12.3367 9.7065 12.75 8.25 12.75C5.25 12.75 2.75025 11.0002 0.75 7.5C1.77675 5.70375 2.93475 4.36875 4.224 3.49425"
        stroke="#818181"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function AuthPasswordInput({
  label,
  visible,
  onToggleVisible,
  className = "",
  ...props
}: AuthPasswordInputProps) {
  return (
    <label className="block w-full">
      <span className="mb-1 block text-left text-[14px] font-medium text-gray-700">
        {label}
      </span>
      <div className="relative">
        <input
          {...props}
          type={visible ? "text" : "password"}
          className={[
            "w-full rounded-[6px] border border-[#E2E1E1] px-[11px] py-[10px] pr-10 text-[14px] font-normal",
            "hover:border-[#AFD7D2] focus:outline-none focus:ring-1 focus:ring-[#AFD7D2]",
            className,
          ].join(" ")}
        />
        <button
          type="button"
          onClick={onToggleVisible}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          <EyeIcon open={visible} />
        </button>
      </div>
    </label>
  );
}
