interface AvatarTooltipProps {
  short: string;
  full: string;
  color: string;
}

const AvatarTooltip: React.FC<AvatarTooltipProps> = ({
  short,
  full,
  color,
}) => {
  return (
    <div className="relative group -ml-2 first:ml-0">
      <div
        className={`w-7 h-7 rounded-full shadow-md bg-white flex items-center justify-center text-[0.65rem] font-semibold border ${color} cursor-pointer`}
      >
        {short}
      </div>

      {/* Tooltip */}
      <div
        className="
        absolute -top-8 left-1/2 -translate-x-1/2
        px-2 py-1 text-[0.65rem] text-white bg-gray-800 rounded-md shadow
        opacity-0 group-hover:opacity-100 transition-all duration-150
        pointer-events-none whitespace-nowrap
      "
      >
        {full}
      </div>
    </div>
  );
};

export default AvatarTooltip;
