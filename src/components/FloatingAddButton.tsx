import { MdOutlineAddBox } from "react-icons/md";
import { Button } from "@/components/ui/button";

interface FloatingAddButtonProps {
  onClick: () => void;
  hidden?: boolean;
}

const FloatingAddButton: React.FC<FloatingAddButtonProps> = ({
  onClick,
  hidden = false,
}) => {
  if (hidden) return null;

  return (
    <Button
      className="fixed bottom-6 right-4 z-10 md:hidden rounded-full bg-gray-700 hover:bg-gray-800 p-0 w-16 h-16 shadow-lg shadow-slate-500"
      onClick={onClick}
      size="icon"
      aria-label="サプリを追加"
    >
      <MdOutlineAddBox size={32} />
    </Button>
  );
};

export default FloatingAddButton;
