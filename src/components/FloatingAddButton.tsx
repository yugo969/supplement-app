import { FiPlusSquare } from "react-icons/fi";
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
      className="fixed bottom-6 right-4 z-10 md:hidden rounded-full bg-transparent hover:bg-transparent p-0 w-16 h-16 shadow-none"
      onClick={onClick}
      size="icon"
      aria-label="サプリを追加"
    >
      <FiPlusSquare
        size={38}
        className="text-gray-700 drop-shadow-[0_4px_8px_rgba(15,23,42,0.35)]"
      />
    </Button>
  );
};

export default FloatingAddButton;
