"use client";

import React, { useEffect, useMemo, useState } from "react";
import DropDown from "./DropDown";
import { countryDialCodes } from "@/utils/countryDialCodes";
import { toFlagEmoji } from "@/utils/phoneUtils";

type PhoneCodeSelectProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  customWidth?: string;
  customHeight?: string;
  menuWidth?: string;
  className?: string;
  buttonClassName?: string;
};

const preferredIso2ByDialCode: Record<string, string> = {
  "+1": "US",
  "+44": "GB",
  "+7": "RU",
  "+61": "AU",
  "+590": "GP",
  "+599": "CW",
  "+262": "RE",
  "+358": "FI",
};

const PhoneCodeSelect: React.FC<PhoneCodeSelectProps> = ({
  value,
  onChange,
  disabled = false,
  customWidth,
  customHeight,
  menuWidth = "w-[18rem]",
  className,
  buttonClassName,
}) => {
  const options = useMemo(
    () =>
      countryDialCodes.map((c) => {
        const flag = toFlagEmoji(c.iso2);
        const id = `${c.dialCode}__${c.iso2}`;
        return {
          value: id,
          dialCode: c.dialCode,
          label: (
            <div className="flex items-center gap-2">
              <span className="text-base leading-none">{flag}</span>
              <span className="truncate">{c.name}</span>
              <span className="ml-auto text-gray-500">{c.dialCode}</span>
            </div>
          ),
          buttonLabel: (
            <div className="flex items-center gap-1">
              <span className="text-base leading-none">{flag}</span>
              <span>{c.dialCode}</span>
            </div>
          ),
          searchLabel: `${c.name} ${c.dialCode} ${c.iso2}`,
        };
      }),
    []
  );

  const [selectedId, setSelectedId] = useState<string>(() => {
    const preferredIso2 = preferredIso2ByDialCode[value];
    const preferred = preferredIso2
      ? options.find(
          (o) =>
            o.dialCode === value && o.value.endsWith(`__${preferredIso2}`)
        )
      : undefined;
    const match = preferred || options.find((o) => o.dialCode === value);
    return match?.value || options[0]?.value || "";
  });

  useEffect(() => {
    const preferredIso2 = preferredIso2ByDialCode[value];
    const preferred = preferredIso2
      ? options.find(
          (o) =>
            o.dialCode === value && o.value.endsWith(`__${preferredIso2}`)
        )
      : undefined;
    const match = preferred || options.find((o) => o.dialCode === value);
    if (match && match.value !== selectedId) {
      setSelectedId(match.value);
    }
  }, [options, selectedId, value]);

  return (
    <DropDown
      options={options}
      value={selectedId}
      onChange={(id) => {
        const match = options.find((o) => o.value === id);
        if (!match) return;
        setSelectedId(id);
        onChange(match.dialCode);
      }}
      disabled={disabled}
      customWidth={customWidth}
      customHeight={customHeight}
      menuWidth={menuWidth}
      className={className}
      buttonClassName={buttonClassName}
      searchable
      searchPlaceholder="Search country or code..."
      getOptionSearchValue={(opt) => opt.searchLabel || ""}
    />
  );
};

export default PhoneCodeSelect;
