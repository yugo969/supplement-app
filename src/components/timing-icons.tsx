import React from "react";

export type TimingIconKey = "morning" | "noon" | "night";

const MorningIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <line
      x1="2"
      y1="15"
      x2="22"
      y2="15"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path d="M 5.5 15 A 6.5 6.5 0 0 1 18.5 15" fill="currentColor" />
    <line
      x1="12"
      y1="8.5"
      x2="12"
      y2="1"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeDasharray="2 1.5"
      strokeLinecap="round"
    />
    <line
      x1="9.4"
      y1="10.1"
      x2="6"
      y2="3"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeDasharray="2 1.5"
      strokeLinecap="round"
    />
    <line
      x1="7.4"
      y1="12.3"
      x2="3"
      y2="6"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeDasharray="2 1.5"
      strokeLinecap="round"
    />
    <line
      x1="5.5"
      y1="15"
      x2="1"
      y2="15"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeDasharray="2 1.5"
      strokeLinecap="round"
    />
    <line
      x1="14.6"
      y1="10.1"
      x2="18"
      y2="3"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeDasharray="2 1.5"
      strokeLinecap="round"
    />
    <line
      x1="16.6"
      y1="12.3"
      x2="21"
      y2="6"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeDasharray="2 1.5"
      strokeLinecap="round"
    />
    <line
      x1="18.5"
      y1="15"
      x2="23"
      y2="15"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeDasharray="2 1.5"
      strokeLinecap="round"
    />
  </svg>
);

const NoonIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="6.5" fill="currentColor" />
    <line
      x1="12"
      y1="1"
      x2="12"
      y2="4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <line
      x1="19.5"
      y1="4.5"
      x2="17.5"
      y2="6.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <line
      x1="23"
      y1="12"
      x2="20"
      y2="12"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <line
      x1="19.5"
      y1="19.5"
      x2="17.5"
      y2="17.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <line
      x1="12"
      y1="23"
      x2="12"
      y2="20"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <line
      x1="4.5"
      y1="19.5"
      x2="6.5"
      y2="17.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <line
      x1="1"
      y1="12"
      x2="4"
      y2="12"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <line
      x1="4.5"
      y1="4.5"
      x2="6.5"
      y2="6.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const NightIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path
      d="M17 9.3A7 7 0 1 1 10.7 3 5.6 5.6 0 0 0 17 9.3z"
      fill="currentColor"
    />
    <circle cx="14" cy="5" r="0.7" fill="currentColor" />
    <circle cx="15.5" cy="6.5" r="0.5" fill="currentColor" />
    <circle cx="13" cy="7" r="0.4" fill="currentColor" />
  </svg>
);

export const TIMING_ICONS: Record<TimingIconKey, JSX.Element> = {
  morning: <MorningIcon size={24} />,
  noon: <NoonIcon size={24} />,
  night: <NightIcon size={24} />,
};

export const TIMING_LABELS: Record<TimingIconKey, string> = {
  morning: "朝",
  noon: "昼",
  night: "夜",
};
