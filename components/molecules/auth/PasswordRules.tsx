import type { PasswordChecks } from "@/app/login/types";

interface PasswordRulesProps {
  checks: PasswordChecks;
}

type SecurityLevel = "low" | "medium" | "high";

const SECURITY_STYLES = {
  low: {
    label: "Low Security",
    text: "text-[#EB382B]",
    segment: "bg-[#EB382B]",
  },
  medium: {
    label: "Medium Security",
    text: "text-[#E6A817]",
    segment: "bg-[#E6A817]",
  },
  high: {
    label: "High Security",
    text: "text-[#22C55E]",
    segment: "bg-[#22C55E]",
  },
} as const;

const RULE_ITEMS = [
  { key: "hasMinLength", label: "Minimum 8 characters" },
  { key: "hasUpper", label: "Minimum 1 uppercase letter" },
  { key: "hasLower", label: "Minimum 1 lowercase letter" },
  { key: "hasNumber", label: "Minimum 1 number" },
  { key: "hasSpecial", label: "Minimum 1 special character" },
] as const;

function getSecurityLevel(checks: PasswordChecks): SecurityLevel {
  const passedCount = [
    checks.hasMinLength,
    checks.hasUpper,
    checks.hasLower,
    checks.hasNumber,
    checks.hasSpecial,
  ].filter(Boolean).length;

  if (passedCount >= 4) {
    return "high";
  }

  if (passedCount >= 2) {
    return "medium";
  }

  return "low";
}

function RuleStatusIcon({ met }: { met: boolean }) {
  if (met) {
    return (
      <span className="flex h-[14px] w-[14px] shrink-0 items-center justify-center text-[12px] font-[500] text-[#22C55E]" aria-hidden>
        ✓
      </span>
    );
  }

  return (
    <span className="flex h-[14px] w-[14px] shrink-0 items-center justify-center text-[12px] font-[400] text-[#818181]" aria-hidden>
      ✕
    </span>
  );
}

function RuleItem({ met, label }: { met: boolean; label: string }) {
  return (
    <p
      className={[
        "flex items-center gap-2 text-[12px] font-[300] lg:text-[14px]",
        met ? "text-[#22C55E]" : "text-[#818181]",
      ].join(" ")}
    >
      <RuleStatusIcon met={met} />
      <span>{label}</span>
    </p>
  );
}

function SecurityMeter({
  level,
  filledSegments,
}: {
  level: SecurityLevel;
  filledSegments: number;
}) {
  const security = SECURITY_STYLES[level];

  return (
    <div className="flex items-center justify-between gap-3 py-[2px]">
      <span className={`text-[12px] font-[500] lg:text-[14px] ${security.text}`}>{security.label}</span>
      <div className="flex items-center gap-[4px]">
        {Array.from({ length: 10 }).map((_, index) => {
          const filled = index < filledSegments;

          return (
            <span
              key={index}
              className={[
                "w-[11px] rounded-full",
                filled ? `h-[4px] ${security.segment}` : "h-[2px] bg-[#E5E7EB]",
              ].join(" ")}
            />
          );
        })}
      </div>
    </div>
  );
}

export function allPasswordRulesMet(checks: PasswordChecks): boolean {
  return (
    checks.hasMinLength &&
    checks.hasUpper &&
    checks.hasLower &&
    checks.hasNumber &&
    checks.hasSpecial
  );
}

export default function PasswordRules({ checks }: PasswordRulesProps) {
  const securityLevel = getSecurityLevel(checks);
  const filledSegments =
    [
      checks.hasMinLength,
      checks.hasUpper,
      checks.hasLower,
      checks.hasNumber,
      checks.hasSpecial,
    ].filter(Boolean).length * 2;

  const [firstRule, ...remainingRules] = RULE_ITEMS;

  return (
    <div className="mt-3 space-y-1">
      <RuleItem met={checks[firstRule.key]} label={firstRule.label} />

      <SecurityMeter level={securityLevel} filledSegments={filledSegments} />

      {remainingRules.map((rule) => (
        <RuleItem key={rule.key} met={checks[rule.key]} label={rule.label} />
      ))}
    </div>
  );
}
