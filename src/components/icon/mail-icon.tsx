import type { IconProps } from "@/components/icon/social-icon-shared";

export function MailIcon({ title, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden={title ? undefined : "true"}
      role={title ? "img" : "presentation"}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <path d="m3 7l9 6l9-6" />
      </g>
    </svg>
  );
}

export default MailIcon;
