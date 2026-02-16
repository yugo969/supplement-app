import React from "react";
import { MdAddCircleOutline } from "react-icons/md";
import { Button } from "@/components/ui/button";

interface EmptyStateCardProps {
  onAddSupplement: () => void;
}

const EmptyStateCard: React.FC<EmptyStateCardProps> = ({ onAddSupplement }) => {
  return (
    <section
      className="w-full min-h-[48vh] flex items-center justify-center"
      aria-label="サプリ未登録状態"
    >
      <div className="w-full max-w-xl rounded-xl border border-gray-300 bg-white/80 p-8 md:p-10 shadow-sm text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-700">
          <MdAddCircleOutline size={30} aria-hidden="true" />
        </div>
        <h2 className="text-lg md:text-xl font-semibold text-gray-800">
          まだサプリが登録されていません。最初の1件を追加しましょう。
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          まずは飲んでいるサプリを1つ登録して、記録を始めましょう。
        </p>
        <Button
          type="button"
          className="mt-6 bg-gray-800 hover:bg-gray-700 text-white"
          onClick={onAddSupplement}
          aria-label="最初のサプリを追加"
        >
          サプリを追加
        </Button>
      </div>
    </section>
  );
};

export default EmptyStateCard;
