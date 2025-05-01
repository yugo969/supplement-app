import { motion, AnimatePresence } from "framer-motion";
import React, { useEffect, useState, useRef } from "react";

interface AnimatedFeedbackProps {
  isVisible: boolean;
  timingId: string | null;
  onAnimationComplete?: () => void;
}

// SVGアニメーション用のバリアント
const pathVariants = {
  hidden: {
    pathLength: 0,
    opacity: 0,
  },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      duration: 0.15,
      ease: "easeInOut",
    },
  },
};

const AnimatedFeedback: React.FC<AnimatedFeedbackProps> = ({
  isVisible,
  timingId,
  onAnimationComplete,
}) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [ready, setReady] = useState(false);
  const uniqueKeyRef = useRef<string>(`anim-${Date.now()}`);

  // クリーンアップ用タイマー
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // コンポーネントのクリーンアップ
  useEffect(() => {
    return () => {
      // コンポーネントのアンマウント時にタイマーをクリアする
      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current);
      }
    };
  }, []);

  // 位置を計算する - 完全に初期化されてから
  useEffect(() => {
    if (isVisible && timingId) {
      setReady(false);
      // 新しいアニメーションのためにユニークキーを更新
      uniqueKeyRef.current = `anim-${timingId}-${Date.now()}`;

      // レンダリングサイクルを待ってから処理
      requestAnimationFrame(() => {
        // 要素を取得
        const element = document.getElementById(timingId);
        if (!element) {
          console.error("Element not found:", timingId);
          // 要素が見つからない場合も完了コールバックを呼び出す
          if (onAnimationComplete) {
            onAnimationComplete();
          }
          return;
        }

        // カードの中心を取得（カードIDの場合とタイミングボタンIDの場合を考慮）
        const card = element.classList.contains("animated-card")
          ? element
          : element.closest(".animated-card");

        if (!card) {
          console.error("Card element not found for:", timingId);
          // 要素が見つからない場合も完了コールバックを呼び出す
          if (onAnimationComplete) {
            onAnimationComplete();
          }
          return;
        }

        const cardRect = card.getBoundingClientRect();
        const cardCenterX = cardRect.left + cardRect.width / 2;
        const cardCenterY = cardRect.top + cardRect.height / 2;

        // 位置情報をセット
        setPosition({ x: cardCenterX, y: cardCenterY });

        // すべての準備ができてからアニメーション開始
        requestAnimationFrame(() => {
          setReady(true);
        });
      });
    } else {
      setReady(false);
    }
  }, [isVisible, timingId, onAnimationComplete]);

  // アニメーション完了時のコールバック処理を分離
  useEffect(() => {
    if (isVisible && ready) {
      // アニメーション時間を考慮して遅延させてコールバック実行
      animationTimerRef.current = setTimeout(() => {
        if (onAnimationComplete) {
          onAnimationComplete();
        }
      }, 500); // アニメーション完了を待つ十分な時間
    }

    // 必ず一定時間後にはリセットする（フォールバック処理）
    const fallbackTimer = setTimeout(() => {
      if (isVisible && onAnimationComplete) {
        onAnimationComplete();
      }
    }, 1000);

    return () => {
      // クリーンアップ時に両方のタイマーを解除
      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current);
      }
      clearTimeout(fallbackTimer);
    };
  }, [isVisible, ready, onAnimationComplete]);

  // アニメーションのバリアント
  const containerVariants = {
    initial: {
      opacity: 0,
      scale: 0.5,
      x: position.x,
      y: position.y,
    },
    visible: {
      opacity: 1,
      scale: 2.5,
      x: position.x,
      y: position.y,
      transition: {
        duration: 0.2,
        ease: "easeOut",
      },
    },
    exit: {
      opacity: 0,
      scale: 3,
      x: position.x,
      y: position.y,
      transition: {
        duration: 0.2,
        ease: "easeInOut",
      },
    },
  };

  return (
    <AnimatePresence mode="wait">
      {isVisible && ready && (
        <motion.div
          key={uniqueKeyRef.current}
          initial="initial"
          animate="visible"
          exit="exit"
          variants={containerVariants}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            margin: 0,
            pointerEvents: "none",
            zIndex: 50,
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            className="text-green-600"
            style={{
              filter: "drop-shadow(0px 0px 4px rgba(0, 200, 0, 0.6))",
            }}
          >
            {/* サークル部分 */}
            <motion.circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="2"
              fill="rgba(0, 200, 0, 0.2)"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
            />
            {/* チェックマーク部分 */}
            <motion.path
              d="M8 12l3 3 5-6"
              variants={pathVariants}
              initial="hidden"
              animate="visible"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AnimatedFeedback;
