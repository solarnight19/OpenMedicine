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
    <rect x="3.2" y="2.6" width="17.6" height="18.8" rx="1.6" />
    <circle cx="8" cy="7.4" r="1.7" fill="currentColor" stroke="none" />
    <path d="M12 7.4h6" />
    <circle cx="8" cy="12" r="1.7" />
    <path d="M12 12h6" />
    <circle cx="8" cy="16.6" r="1.7" fill="currentColor" stroke="none" />
    <path d="M12 16.6h6" />
  </Base>
);

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
