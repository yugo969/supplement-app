import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { pageTransitionVariants } from "@/lib/animation";
import { useRouter } from "next/router";

interface PageTransitionProps {
  children: React.ReactNode;
}

const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  const router = useRouter();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={router.route}
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={pageTransitionVariants}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default PageTransition;
