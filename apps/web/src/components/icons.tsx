import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function LineIcon({ size, children, ...props }: IconProps & { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.2}
      strokeLinecap="square"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <LineIcon size={16} {...props}>
      <path d="M2 8H14M10 12L14 8L10 4" />
    </LineIcon>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <LineIcon size={16} {...props}>
      <path d="M4 6L8 10L12 6" />
    </LineIcon>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <LineIcon size={24} {...props}>
      <path d="M3 9H21M3 15H21" />
    </LineIcon>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <LineIcon size={24} {...props}>
      <path d="M5 5L19 19M19 5L5 19" />
    </LineIcon>
  );
}

export function TreeIcon(props: IconProps) {
  return (
    <LineIcon size={32} {...props}>
      <g transform="translate(6.9 2.4)">
        <path pathLength={1} d="M9.1 26.6V14.6" />
        <path pathLength={1} d="M9.1 18.6L5.1 15.6" />
        <path pathLength={1} d="M9.1 16.6L13.1 13.6" />
        <path
          pathLength={1}
          d="M9.1 0.6C4.1 0.6 0.6 4.6 0.6 9.1C0.6 13.6 4.1 17.6 9.1 17.6C14.1 17.6 17.6 13.6 17.6 9.1C17.6 4.6 14.1 0.6 9.1 0.6Z"
        />
        <path pathLength={1} d="M3.1 26.6H15.1" />
      </g>
    </LineIcon>
  );
}

export function WindowIcon(props: IconProps) {
  return (
    <LineIcon size={32} {...props}>
      <g transform="translate(3.4 2.4)">
        <path pathLength={1} d="M3.6 0.6H21.6V26.6H3.6V0.6Z" />
        <path pathLength={1} d="M12.6 0.6V26.6" />
        <path pathLength={1} d="M3.6 18.6H21.6" />
        <path pathLength={1} d="M0.6 26.6H24.6" />
      </g>
    </LineIcon>
  );
}

export function CourtyardIcon(props: IconProps) {
  return (
    <LineIcon size={32} {...props}>
      <g transform="translate(3.4 5.4)">
        <path
          pathLength={1}
          d="M0.6 19.6C3.6 19.6 3.6 21.6 6.6 21.6C9.6 21.6 9.6 19.6 12.6 19.6C15.6 19.6 15.6 21.6 18.6 21.6C21.6 21.6 21.6 19.6 24.6 19.6"
        />
        <path pathLength={1} d="M12.6 15.6V3.6" />
        <path pathLength={1} d="M12.6 7.6C9.6 6.6 7.6 4.1 7.6 0.6C10.6 0.6 12.6 3.1 12.6 7.6Z" />
        <path pathLength={1} d="M12.6 7.6C15.6 6.6 17.6 4.1 17.6 0.6C14.6 0.6 12.6 3.1 12.6 7.6Z" />
        <path pathLength={1} d="M5.6 15.6H19.6" />
      </g>
    </LineIcon>
  );
}

export function KeyIcon(props: IconProps) {
  return (
    <LineIcon size={32} {...props}>
      <g transform="translate(4.4 9.4)">
        <path
          pathLength={1}
          d="M6.6 12.6C9.91371 12.6 12.6 9.91371 12.6 6.6C12.6 3.28629 9.91371 0.6 6.6 0.6C3.28629 0.6 0.6 3.28629 0.6 6.6C0.6 9.91371 3.28629 12.6 6.6 12.6Z"
        />
        <path
          pathLength={1}
          d="M6.6 8.6C7.70457 8.6 8.6 7.70457 8.6 6.6C8.6 5.49543 7.70457 4.6 6.6 4.6C5.49543 4.6 4.6 5.49543 4.6 6.6C4.6 7.70457 5.49543 8.6 6.6 8.6Z"
        />
        <path pathLength={1} d="M12.6 6.6H24.6" />
        <path pathLength={1} d="M20.6 6.6V10.6" />
        <path pathLength={1} d="M24.6 6.6V11.6" />
      </g>
    </LineIcon>
  );
}
