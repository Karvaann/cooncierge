const AUTH_FOOTER_LINKS = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms of Use", href: "/terms-of-use" },
  { label: "FAQs", href: "/faqs" },
] as const;

const footerLinkClassName =
  "font-[Poppins,sans-serif] text-[14px] font-[400] leading-[20px] text-[#414141] no-underline transition-colors hover:underline";

export default function AuthFooterLinks() {
  return (
    <footer className="mt-auto flex w-full justify-center gap-8 pt-10">
      {AUTH_FOOTER_LINKS.map((link) => (
        <a key={link.href} href={link.href} className={footerLinkClassName}>
          {link.label}
        </a>
      ))}
    </footer>
  );
}
