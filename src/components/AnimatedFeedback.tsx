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
      duration: 0.3,
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

  // 位置を計算する - 完全に初期化されてから
  useEffect(() => {
    if (isVisible && timingId) {
      setReady(false);
      // 新しいアニメーションのためにユニークキーを更新
      uniqueKeyRef.current = `anim-${timingId}-${Date.now()}`;

      // レンダリングサイクルを待ってから処理
      requestAnimationFrame(() => {
        // ボタン要素を取得
        const button = document.getElementById(timingId);
        if (!button) {
          console.error("Button element not found:", timingId);
          return;
        }

        // カードの中心を取得
        const card = button.closest(".animated-card");
        if (!card) {
          console.error("Card element not found for button:", timingId);
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
  }, [isVisible, timingId]);

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
        duration: 0.4,
        ease: "easeOut",
      },
    },
    exit: {
      opacity: 0,
      scale: 3,
      x: position.x,
      y: position.y,
      transition: {
        duration: 0.5,
        ease: "easeInOut",
      },
    },
  };

  // アニメーションの流れを管理
  const handleAnimationComplete = (definition: string) => {
    if (definition === "visible") {
      // 表示アニメーション完了時に一定時間後に終了アニメーションを開始
      setTimeout(() => {
        onAnimationComplete && onAnimationComplete();
      }, 600);
    }
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
          onAnimationComplete={handleAnimationComplete}
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
              filter: "drop-shadow(0px 0px 3px rgba(0, 255, 0, 0.5))",
            }}
          >
            <motion.path
              d="M20 6L9 17l-5-5"
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
