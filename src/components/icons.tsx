import type { SVGProps } from "react";

function base(props: SVGProps<SVGSVGElement>, children: React.ReactNode) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const IconCalculator = (p: SVGProps<SVGSVGElement>) =>
  base(p, (
    <>
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M8 6h8" />
      <path d="M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h.01M12 19h.01M16 19h.01" />
    </>
  ));

export const IconChart = (p: SVGProps<SVGSVGElement>) =>
  base(p, (
    <>
      <path d="M3 3v16a2 2 0 0 0 2 2h16" />
      <path d="M8 15v-4" />
      <path d="M8 11v-2" />
      <rect x="6.4" y="9" width="3.2" height="5" rx="0.5" fill="currentColor" stroke="none" />
      <path d="M16 13V7" />
      <path d="M16 8V4" />
      <rect x="14.4" y="6" width="3.2" height="9" rx="0.5" fill="currentColor" stroke="none" />
    </>
  ));

export const IconTarget = (p: SVGProps<SVGSVGElement>) =>
  base(p, (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </>
  ));

export const IconTrendUp = (p: SVGProps<SVGSVGElement>) =>
  base(p, (
    <>
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M15 7h6v6" />
    </>
  ));

export const IconCalendar = (p: SVGProps<SVGSVGElement>) =>
  base(p, (
    <>
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M16 2v4M8 2v4M3 9h18" />
    </>
  ));

export const IconArrows = (p: SVGProps<SVGSVGElement>) =>
  base(p, (
    <>
      <path d="M8 3L4 7l4 4" />
      <path d="M4 7h16" />
      <path d="M16 21l4-4-4-4" />
      <path d="M20 17H4" />
    </>
  ));

export const IconGlobe = (p: SVGProps<SVGSVGElement>) =>
  base(p, (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a13.5 13.5 0 0 1 0 18a13.5 13.5 0 0 1 0-18" />
    </>
  ));

export const IconTable = (p: SVGProps<SVGSVGElement>) =>
  base(p, (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
    </>
  ));

export const IconShield = (p: SVGProps<SVGSVGElement>) =>
  base(p, (
    <>
      <path d="M12 3l7.5 3v5.5c0 4.6-3.2 7.9-7.5 9.5-4.3-1.6-7.5-4.9-7.5-9.5V6z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ));

export const IconSparkles = (p: SVGProps<SVGSVGElement>) =>
  base(p, (
    <>
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
      <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" />
    </>
  ));

export const IconBars = (p: SVGProps<SVGSVGElement>) =>
  base(p, (
    <>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </>
  ));

export const IconSwap = (p: SVGProps<SVGSVGElement>) =>
  base(p, (
    <>
      <path d="M4 7h13M14 3l4 4-4 4" />
      <path d="M20 17H7M10 13l-4 4 4 4" />
    </>
  ));

export const IconClock = (p: SVGProps<SVGSVGElement>) =>
  base(p, (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ));

export const IconDownload = (p: SVGProps<SVGSVGElement>) =>
  base(p, (
    <>
      <path d="M12 3v12M8 11l4 4 4-4" />
      <path d="M4 21h16" />
    </>
  ));

export const IconShare = (p: SVGProps<SVGSVGElement>) =>
  base(p, (
    <>
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="6" r="3" />
      <circle cx="18" cy="18" r="3" />
      <path d="M8.6 10.6l6.8-3.2M8.6 13.4l6.8 3.2" />
    </>
  ));

export const IconReset = (p: SVGProps<SVGSVGElement>) =>
  base(p, (
    <>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
    </>
  ));

export const IconLogOut = (p: SVGProps<SVGSVGElement>) =>
  base(p, (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </>
  ));

export const IconArrowRight = (p: SVGProps<SVGSVGElement>) =>
  base(p, (
    <>
      <path d="M5 12h14M14 6l6 6-6 6" />
    </>
  ));

export const IconChevL = (p: SVGProps<SVGSVGElement>) =>
  base(p, <path d="M15 6l-6 6 6 6" />);

export const IconChevR = (p: SVGProps<SVGSVGElement>) =>
  base(p, <path d="M9 6l6 6-6 6" />);

export const IconGauge = (p: SVGProps<SVGSVGElement>) =>
  base(p, (
    <>
      <path d="M12 13l4-4" />
      <path d="M3.3 18a9 9 0 1 1 17.4 0z" />
    </>
  ));

export const IconUser = (p: SVGProps<SVGSVGElement>) =>
  base(p, (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1.6-3.5 4.6-5.5 8-5.5s6.4 2 8 5.5" />
    </>
  ));

export const IconBook = (p: SVGProps<SVGSVGElement>) =>
  base(p, (
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </>
  ));

export const IconSettings = (p: SVGProps<SVGSVGElement>) =>
  base(p, (
    <>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ));

export const IconSliders = (p: SVGProps<SVGSVGElement>) =>
  base(p, (
    <>
      <path d="M4 21v-7" />
      <path d="M4 10V3" />
      <path d="M12 21v-9" />
      <path d="M12 8V3" />
      <path d="M20 21v-5" />
      <path d="M20 12V3" />
      <path d="M2 14h4" />
      <path d="M10 8h4" />
      <path d="M18 16h4" />
    </>
  ));

export const IconMenu = (p: SVGProps<SVGSVGElement>) =>
  base(p, (
    <>
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </>
  ));

export const IconTrash = (p: SVGProps<SVGSVGElement>) =>
  base(p, (
    <>
      <path d="M3 6h18" />
      <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </>
  ));

export const IconEdit = (p: SVGProps<SVGSVGElement>) =>
  base(p, (
    <>
      <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </>
  ));