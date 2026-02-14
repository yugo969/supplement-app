import React from "react";

// アイコンコンポーネント
const MenuIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
  </svg>
);

const MailIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.89 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
  </svg>
);

const ChatIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z" />
  </svg>
);

const SpacesIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A3.003 3.003 0 0 0 16 6.5c-.8 0-1.5.31-2.04.81l-8.7 8.69c-.63.63-.63 1.65 0 2.28l4.24 4.24.71-.71-4.24-4.24c-.19-.19-.19-.51 0-.7l8.7-8.69c.19-.19.44-.31.71-.31.82 0 1.5.68 1.5 1.5z" />
  </svg>
);

const MeetIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4zM14 13h-3v3H9v-3H6v-2h3V8h2v3h3v2z" />
  </svg>
);

const EditIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
  </svg>
);

// ナビゲーションアイテムコンポーネント
interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({
  icon,
  label,
  isActive = false,
  onClick,
}) => (
  <div
    className={`flex flex-col items-center gap-1 p-2 rounded-2xl cursor-pointer transition-colors ${
      isActive
        ? "bg-purple-100 text-purple-700"
        : "text-gray-600 hover:bg-gray-100"
    }`}
    onClick={onClick}
  >
    <div className="p-2">{icon}</div>
    <span className="text-xs font-medium">{label}</span>
  </div>
);

// FABコンポーネント
const FloatingActionButton: React.FC<{ onClick?: () => void }> = ({
  onClick,
}) => (
  <div
    className="w-14 h-14 bg-pink-200 rounded-2xl flex items-center justify-center cursor-pointer hover:bg-pink-300 transition-colors"
    onClick={onClick}
  >
    <EditIcon />
  </div>
);

// メインナビゲーションレールコンポーネント
export const XrXrNavigationRail: React.FC = () => {
  return (
    <div className="w-24 bg-purple-50 rounded-[96px] flex flex-col items-center py-5 gap-10">
      {/* メニューとFAB */}
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 flex items-center justify-center">
          <MenuIcon />
        </div>
        <FloatingActionButton />
      </div>

      {/* ナビゲーションアイテム */}
      <div className="flex flex-col gap-2">
        <NavItem icon={<MailIcon />} label="Mail" isActive={true} />
        <NavItem icon={<ChatIcon />} label="Chat" />
        <NavItem icon={<SpacesIcon />} label="Spaces" />
        <NavItem icon={<MeetIcon />} label="Meet" />
      </div>
    </div>
  );
};
