const AUTH_FOOTER_LINKS = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms of Use", href: "/terms-of-use" },
  { label: "FAQs", href: "/faqs" },
] as const;

const footerLinkClassName =
  "align-middle font-[Poppins,sans-serif] text-[14px] font-[400] not-italic leading-[20px] tracking-[0px] text-[#818181] no-underline transition-colors hover:underline";

export default function AuthFooterLinks() {
  return (
    <footer className="mt-auto flex w-full items-center justify-center gap-8 pt-10">
      {AUTH_FOOTER_LINKS.map((link) => (
        <a key={link.href} href={link.href} className={footerLinkClassName}>
          {link.label}
        </a>
      ))}
    </footer>
  );
}
