import { useEffect, useRef, useCallback } from "react";
import { SupplementData } from "@/schemas/supplement";

interface UseScrollManagementProps {
  supplements: SupplementData[];
}

export const useScrollManagement = ({
  supplements,
}: UseScrollManagementProps) => {
  // スクロールコンテナへの参照を保持
  const scrollContainerRefs = useRef<{ [key: string]: HTMLDivElement | null }>(
    {}
  );

  // スクロールコンテナの参照を設定するコールバック
  const setScrollContainerRef = useCallback(
    (element: HTMLDivElement | null, supplementId: string) => {
      if (element) {
        scrollContainerRefs.current[supplementId] = element;
        // 初期表示時に右端へスクロール
        element.scrollLeft = element.scrollWidth;
      }
    },
    []
  );

  // 服用回数が変更されたらスクロール位置を更新する
  useEffect(() => {
    // 少し遅延させてDOMの更新後に実行
    const timer = setTimeout(() => {
      const scrollContainers = document.querySelectorAll(
        '[aria-label="服用回数履歴"]'
      );
      scrollContainers.forEach((container) => {
        if (container instanceof HTMLElement) {
          container.scrollLeft = container.scrollWidth;
        }
      });
    }, 50);

    return () => clearTimeout(timer);
  }, [supplements]);

  return {
    scrollContainerRefs,
    setScrollContainerRef,
  };
};
