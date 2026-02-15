import { MdOutlineMedication } from "react-icons/md";
import { FiLogOut, FiPlusSquare } from "react-icons/fi";
import { Button } from "@/components/ui/button";

interface HeaderSectionProps {
  onAddSupplement: () => void;
  onLogout: () => void;
  isGroupEditMode?: boolean;
}

const HeaderSection: React.FC<HeaderSectionProps> = ({
  onAddSupplement,
  onLogout,
  isGroupEditMode = false,
}) => {
  return (
    <header className="flex md:sticky md:top-2 bg-white/40 z-10 justify-between items-center rounded-md shadow-sm shadow-gray-200 md:p-6 p-3">
      <h1 className="flex items-center sm:gap-2 text-gray-600 md:text-xl text-lg">
        <MdOutlineMedication size={40} aria-hidden="true" />
        <span className="font-bold leading-6">サプリ KEEPER</span>
      </h1>
      <div className="flex gap-3">
        <Button
          variant="ghost"
          className={`font-semibold shadow-sm max-md:hidden ${
            isGroupEditMode
              ? "text-gray-400 bg-gray-100 cursor-not-allowed opacity-70"
              : "text-gray-700 hover:bg-white/60"
          }`}
          onClick={onAddSupplement}
          disabled={isGroupEditMode}
          aria-disabled={isGroupEditMode}
          aria-label="サプリを追加"
        >
          <span>サプリ追加</span>
          <FiPlusSquare size={20} aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-600 hover:bg-white/60 inline-flex items-center gap-1.5"
          onClick={onLogout}
          aria-label="ログアウト"
        >
          <FiLogOut size={16} aria-hidden="true" />
          ログアウト
        </Button>
      </div>
    </header>
  );
};

export default HeaderSection;
