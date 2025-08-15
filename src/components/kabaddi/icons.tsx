import type { SVGProps } from "react";

export function KabaddiRaiderIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M14.5 2.5a2.5 2.5 0 0 0-5 0V6a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2V2.5z" />
      <path d="m20 10-2.5 2.5" />
      <path d="m4 10 2.5 2.5" />
      <path d="M12 13V8" />
      <path d="M12 22v-9" />
      <path d="M8.5 16c.8-1 1.5-2.5 1.5-4" />
      <path d="M15.5 16c-.8-1-1.5-2.5-1.5-4" />
    </svg>
  );
}
