import { MdOutlineMedication, MdOutlineAddBox } from "react-icons/md";
import { Button } from "@/components/ui/button";

interface HeaderSectionProps {
  onAddSupplement: () => void;
  onLogout: () => void;
}

const HeaderSection: React.FC<HeaderSectionProps> = ({
  onAddSupplement,
  onLogout,
}) => {
  return (
    <header className="flex md:sticky md:top-2 bg-white/40 z-10 justify-between items-center rounded-md shadow-sm shadow-gray-200 md:p-6 p-3">
      <h1 className="flex items-center sm:gap-2 text-gray-600 md:text-xl text-lg">
        <MdOutlineMedication size={40} aria-hidden="true" />
        <span className="font-bold leading-6">サプリ KEEPER</span>
      </h1>
      <div className="flex gap-3">
        <Button
          variant="outline"
          className="text-gray-700 border-gray-500 font-semibold hover:bg-gray-100 shadow-sm max-md:hidden"
          onClick={onAddSupplement}
          aria-label="サプリを追加"
        >
          <span>サプリ追加</span>
          <MdOutlineAddBox size={24} aria-hidden="true" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-gray-500 border-gray-400 hover:bg-gray-100"
          onClick={onLogout}
          aria-label="ログアウト"
        >
          ログアウト
        </Button>
      </div>
    </header>
  );
};

export default HeaderSection;
