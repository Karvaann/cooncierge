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
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M2.25 2.25L15.75 15.75M7.938 7.94023C7.65653 8.22149 7.49833 8.60305 7.49819 9.00095C7.49805 9.39886 7.65598 9.78052 7.93725 10.062C8.21851 10.3434 8.60006 10.5016 8.99797 10.5018C9.39587 10.5019 9.77753 10.344 10.059 10.0627M7.02225 4.02375C7.66531 3.83979 8.33115 3.74763 9 3.75C12 3.75 14.4997 5.49975 16.5 9C15.9165 10.0207 15.291 10.893 14.6227 11.616M13.0178 13.0117C11.7945 13.8367 10.4565 14.25 9 14.25C6 14.25 3.50025 12.5002 1.5 9C2.52675 7.20375 3.68475 5.86875 4.974 4.99425" stroke="#818181" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
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
      <span className="mb-1 block text-left text-[12px] font-[500] text-[#414141]">
          {label}
      </span>
      <div className="relative">
        <input
          {...props}
          type={visible ? "text" : "password"}
          className={[
            "h-9 w-full rounded-[13px] border border-[#E2E1E1] px-[12px] text-[12px] font-normal",
            "placeholder:text-[#A5ADB8] hover:border-[#AFD7D2] focus:outline-none focus:ring-1 focus:ring-[#AFD7D2]",
            className,
          ].join(" ")}
        />
        <button
          type="button"
          onClick={onToggleVisible}
          className="absolute right-3 top-1/2 h-[10px] -translate-y-1/2 text-gray-500 hover:text-gray-700"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          <EyeIcon open={visible} />
        </button>
      </div>
    </label>
  );
}
