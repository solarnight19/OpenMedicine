import type { ReactNode, SVGProps } from "react";

function Base({ children, ...props }: SVGProps<SVGSVGElement> & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      width="1em"
      height="1em"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

type P = SVGProps<SVGSVGElement>;

export const IconLogo = (p: P) => (
  <Base {...p} strokeWidth="1.6">
    <path d="M9.4 3.2h5.2a1.4 1.4 0 0 1 1.4 1.4v3.4h3.4a1.4 1.4 0 0 1 1.4 1.4v5.2a1.4 1.4 0 0 1-1.4 1.4H16v3.4a1.4 1.4 0 0 1-1.4 1.4H9.4A1.4 1.4 0 0 1 8 19.4V16H4.6A1.4 1.4 0 0 1 3.2 14.6V9.4A1.4 1.4 0 0 1 4.6 8H8V4.6a1.4 1.4 0 0 1 1.4-1.4Z" />
    <path d="M5.8 12h2.4l1-2 1.6 4 1.2-2h6.2" strokeWidth="1.5" />
  </Base>
);

/** Animated ECG trace — the signature living element. */
export function EcgTrace({ className = "" }: { className?: string }) {
  const d = "M0 24 H34 L42 24 48 10 56 36 62 24 H96 L104 24 110 6 120 40 127 24 H160 L168 24 174 13 182 33 188 24 H222 L230 24 236 8 244 38 251 24 H300";
  return (
    <svg viewBox="0 0 300 48" className={className} preserveAspectRatio="none" aria-hidden="true">
      <path d={d} fill="none" stroke="currentColor" strokeOpacity="0.18" strokeWidth="1.5" />
      <path
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        className="ecg-run"
        pathLength={300}
        strokeDasharray="70 230"
      />
    </svg>
  );
}

export const IconGrid = (p: P) => (
  <Base {...p}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1" />
  </Base>
);

export const IconBank = (p: P) => (
  <Base {...p}>
    <path d="M3.5 6.5a2 2 0 0 1 2-2h4l2 2.4h7a2 2 0 0 1 2 2v8.6a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" />
    <path d="M3.5 10.5h17" />
  </Base>
);

export const IconUpload = (p: P) => (
  <Base {...p}>
    <path d="M12 15V4.5" />
    <path d="M7.8 8.5 12 4.3l4.2 4.2" />
    <path d="M4.5 15.5v2.6a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-2.6" />
  </Base>
);

export const IconDoc = (p: P) => (
  <Base {...p}>
    <path d="M6 3.5h8l4 4v13H6z" />
    <path d="M14 3.5v4h4" />
    <path d="M9 12h6M9 15.5h6" />
  </Base>
);

export const IconClock = (p: P) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3.2 2" />
  </Base>
);

export const IconPlus = (p: P) => (
  <Base {...p}>
    <path d="M12 5.5v13M5.5 12h13" />
  </Base>
);

export const IconTrash = (p: P) => (
  <Base {...p}>
    <path d="M4.5 6.5h15" />
    <path d="M9 6.5V4.8a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1.7" />
    <path d="M6.5 6.5 7.4 19a1.6 1.6 0 0 0 1.6 1.5h6A1.6 1.6 0 0 0 16.6 19l.9-12.5" />
    <path d="M10 10.5v6M14 10.5v6" />
  </Base>
);

export const IconPencil = (p: P) => (
  <Base {...p}>
    <path d="m14.5 5.5 4 4L8 20H4v-4z" />
    <path d="m12.5 7.5 4 4" />
  </Base>
);

export const IconSearch = (p: P) => (
  <Base {...p}>
    <circle cx="10.5" cy="10.5" r="6" />
    <path d="m15.3 15.3 4.7 4.7" />
  </Base>
);

export const IconFlag = (p: P) => (
  <Base {...p}>
    <path d="M6 21V4.5" />
    <path d="M6 5h11l-2.6 3.5L17 12H6" />
  </Base>
);

export const IconCheck = (p: P) => (
  <Base {...p}>
    <path d="m5 12.8 4.5 4.5L19 7.5" />
  </Base>
);

export const IconX = (p: P) => (
  <Base {...p}>
    <path d="m6 6 12 12M18 6 6 18" />
  </Base>
);

export const IconChevronL = (p: P) => (
  <Base {...p}>
    <path d="M14.5 5.5 8 12l6.5 6.5" />
  </Base>
);

export const IconChevronR = (p: P) => (
  <Base {...p}>
    <path d="m9.5 5.5 6.5 6.5-6.5 6.5" />
  </Base>
);

export const IconTimer = (p: P) => (
  <Base {...p}>
    <circle cx="12" cy="13.5" r="7" />
    <path d="M12 10v3.8l2.4 1.5" />
    <path d="M9.5 3.5h5" />
    <path d="M12 3.5v3" />
  </Base>
);

export const IconDownload = (p: P) => (
  <Base {...p}>
    <path d="M12 4.5V15" />
    <path d="M7.8 10.8 12 15l4.2-4.2" />
    <path d="M4.5 15.5v2.6a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-2.6" />
  </Base>
);

export const IconShuffle = (p: P) => (
  <Base {...p}>
    <path d="M3.5 6.5h3.2c5.8 0 6.3 11 12 11h1.8" />
    <path d="M3.5 17.5h3.2c2.3 0 3.6-1.7 4.7-3.5M20.5 6.5h-1.8c-2.3 0-3.6 1.7-4.7 3.5" />
    <path d="m18 4 2.8 2.5L18 9M18 15l2.8 2.5L18 20" />
  </Base>
);

export const IconArrowR = (p: P) => (
  <Base {...p}>
    <path d="M4.5 12h15" />
    <path d="m13.5 6 6 6-6 6" />
  </Base>
);

export const IconPlay = (p: P) => (
  <Base {...p}>
    <path d="M7.5 5v14l11-7z" />
  </Base>
);

export const IconAlert = (p: P) => (
  <Base {...p}>
    <path d="M12 4 2.8 19.5h18.4z" />
    <path d="M12 10v4" />
    <path d="M12 16.8v.2" />
  </Base>
);

export const IconInfo = (p: P) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5" />
    <path d="M12 7.8v.2" />
  </Base>
);

export const IconFile = (p: P) => (
  <Base {...p}>
    <path d="M6 3.5h8l4 4v13H6z" />
    <path d="M14 3.5v4h4" />
  </Base>
);

export const IconInbox = (p: P) => (
  <Base {...p}>
    <path d="M4 13.5 6.2 5a1.5 1.5 0 0 1 1.5-1.1h8.6A1.5 1.5 0 0 1 17.8 5L20 13.5v5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5z" />
    <path d="M4 13.5h4.5l1.2 2.3h4.6l1.2-2.3H20" />
  </Base>
);

export const IconTarget = (p: P) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="4.5" />
    <circle cx="12" cy="12" r="0.8" fill="currentColor" stroke="none" />
  </Base>
);

export const IconSpark = (p: P) => (
  <Base {...p}>
    <path d="M12 3.5 13.8 9l5.7 1.8-5.7 1.8L12 18.2l-1.8-5.6-5.7-1.8L10.2 9z" />
  </Base>
);

export const IconCopy = (p: P) => (
  <Base {...p}>
    <rect x="8.5" y="8.5" width="11" height="11" rx="1.5" />
    <path d="M5.5 14.5h-.4a1.6 1.6 0 0 1-1.6-1.6V5.6a1.6 1.6 0 0 1 1.6-1.6h7.3a1.6 1.6 0 0 1 1.6 1.6v.4" />
  </Base>
);

export const IconStar = ({ filled, ...p }: P & { filled?: boolean }) => (
  <Base {...p} fill={filled ? "currentColor" : "none"}>
    <path d="m12 4 2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4L4.2 9.7l5.4-.8z" />
  </Base>
);

export const IconHeart = ({ filled, ...p }: P & { filled?: boolean }) => (
  <Base {...p} fill={filled ? "currentColor" : "none"}>
    <path d="M12 20s-7.2-4.6-7.2-9.6A4.1 4.1 0 0 1 8.9 6.2c1.3 0 2.5.7 3.1 1.7.6-1 1.8-1.7 3.1-1.7a4.1 4.1 0 0 1 4.1 4.2c0 5-7.2 9.6-7.2 9.6Z" />
  </Base>
);

export const IconGlobe = (p: P) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.5 12h17" />
    <path d="M12 3.5c2.6 2.4 3.9 5.2 3.9 8.5s-1.3 6.1-3.9 8.5c-2.6-2.4-3.9-5.2-3.9-8.5s1.3-6.1 3.9-8.5Z" />
  </Base>
);

export const IconUser = (p: P) => (
  <Base {...p}>
    <circle cx="12" cy="8.2" r="3.6" />
    <path d="M5 20c.8-3.4 3.6-5.2 7-5.2s6.2 1.8 7 5.2" />
  </Base>
);

export const IconLogout = (p: P) => (
  <Base {...p}>
    <path d="M13.5 4.5H6.6a1.6 1.6 0 0 0-1.6 1.6v11.8a1.6 1.6 0 0 0 1.6 1.6h6.9" />
    <path d="M16 8.5 19.5 12 16 15.5" />
    <path d="M19.5 12H9.8" />
  </Base>
);

export const IconBookOpen = (p: P) => (
  <Base {...p}>
    <path d="M12 6.3C10.4 5 8.2 4.4 5.5 4.4c-1 0-1.9.1-2.5.2v13.2c.6-.1 1.5-.2 2.5-.2 2.7 0 4.9.6 6.5 1.9 1.6-1.3 3.8-1.9 6.5-1.9 1 0 1.9.1 2.5.2V4.6c-.6-.1-1.5-.2-2.5-.2-2.7 0-4.9.6-6.5 1.9Z" />
    <path d="M12 6.3v13.2" />
  </Base>
);

export const IconPulse = (p: P) => (
  <Base {...p}>
    <path d="M3.5 12h3.7l1.7-4.5 2.9 9 2-4.5h6.7" />
  </Base>
);
