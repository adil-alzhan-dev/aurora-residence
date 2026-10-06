import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function AdminIcon({ size = 20, children, ...props }: IconProps & { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="square"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export function DashboardIcon(props: IconProps) {
  return (
    <AdminIcon {...props}>
      <path d="M9 3H3V9H9V3Z M17 3H11V9H17V3Z M9 11H3V17H9V11Z M17 11H11V17H17V11Z" />
    </AdminIcon>
  );
}

export function ResidencesIcon(props: IconProps) {
  return (
    <AdminIcon {...props}>
      <path d="M4 17V3H12V17 M12 8H16V17 M2 17H18 M7 6H9M7 9H9M7 12H9" />
    </AdminIcon>
  );
}

export function EnquiriesIcon(props: IconProps) {
  return (
    <AdminIcon {...props}>
      <path d="M3 11L5 4H15L17 11V16H3V11Z M3 11H7L8 13H12L13 11H17" />
    </AdminIcon>
  );
}

export function LogOutIcon(props: IconProps) {
  return (
    <AdminIcon {...props}>
      <path d="M8 3H4V17H8 M12 6L16 10L12 14 M16 10H8" />
    </AdminIcon>
  );
}

export function AlertIcon(props: IconProps) {
  return (
    <AdminIcon size={16} {...props}>
      <circle cx="8" cy="8" r="5.6" />
      <path d="M8 5.2V8.8M8 10.8V11.2" />
    </AdminIcon>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <AdminIcon size={16} {...props}>
      <circle cx="7" cy="7" r="4.6" />
      <path d="M10.5 10.5L14 14" />
    </AdminIcon>
  );
}
