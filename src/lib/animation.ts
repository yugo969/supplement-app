import { Variants } from "framer-motion";

// カードのホバーアニメーション設定
export const cardHoverVariants: Variants = {
  initial: {
    scale: 1,
    y: 0,
    boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
    transition: { duration: 0.2, ease: "easeOut" },
  },
  hover: {
    scale: 1.02,
    y: -5,
    boxShadow: "0px 8px 15px rgba(0, 0, 0, 0.15)",
    transition: { duration: 0.2, ease: "easeOut" },
  },
};

// 服用記録フィードバックアニメーション設定
export const feedbackVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: {
      duration: 0.2,
      ease: "easeIn",
    },
  },
};

// ページ遷移アニメーション設定
export const pageTransitionVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 10,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeInOut",
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.3,
      ease: "easeInOut",
    },
  },
};
