import React, { useState, useEffect, useRef } from "react";
import {
  MdInfoOutline,
  MdNoFood,
  MdRestaurant,
  MdFreeBreakfast,
  MdBed,
  MdExpandMore,
  MdExpandLess,
  MdClose,
} from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";

// タイミングアイコン設定
const TIMING_ICONS = {
  before_meal: <MdNoFood size={18} />,
  after_meal: <MdRestaurant size={18} />,
  empty_stomach: <MdFreeBreakfast size={18} />,
  bedtime: <MdBed size={18} />,
};

// タイミングラベル設定
const TIMING_LABELS = {
  before_meal: "食前",
  after_meal: "食後",
  empty_stomach: "空腹時",
  bedtime: "就寝前",
};

// 説明文
const TIMING_DESCRIPTIONS = {
  before_meal:
    "食事の前に服用することで、効果的に吸収されます。一般的に食事の30分前が推奨されます。",
  after_meal:
    "食後に服用することで、胃への刺激を軽減します。食事から30分以内の服用が推奨されます。",
  empty_stomach:
    "空腹時（食間）に服用することで、より効率的に吸収されます。食事から2時間以上経過した時間帯が最適です。",
  bedtime:
    "就寝前に服用することで、体内での作用時間を最大化します。就寝30分前の服用が推奨されます。",
};

type RecommendedIntakeInfoProps = {
  timings: {
    before_meal: boolean;
    after_meal: boolean;
    empty_stomach: boolean;
    bedtime: boolean;
  };
};

const RecommendedIntakeInfo: React.FC<RecommendedIntakeInfoProps> = ({
  timings,
}) => {
  const { before_meal, after_meal, empty_stomach, bedtime } = timings;
  const [isExpanded, setIsExpanded] = useState(false);
  const [activePopup, setActivePopup] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const hasActiveTimings =
    before_meal || after_meal || empty_stomach || bedtime;

  const activeTimings = [
    before_meal && "before_meal",
    after_meal && "after_meal",
    empty_stomach && "empty_stomach",
    bedtime && "bedtime",
  ].filter(Boolean) as (keyof typeof TIMING_LABELS)[];

  // カードコンテナの参照を取得
  useEffect(() => {
    if (containerRef.current) {
      // 親要素をたどってanimated-cardクラスを持つ要素を探す
      let parent = containerRef.current.parentElement;
      while (parent) {
        if (parent.classList.contains("animated-card")) {
          cardRef.current = parent as HTMLDivElement;
          break;
        }
        parent = parent.parentElement;
      }
    }
  }, []);

  // 画面のどこかをクリックしたときにポップアップを閉じる
  useEffect(() => {
    if (!hasActiveTimings) return;

    const handleClickOutside = (event: Event) => {
      if (activePopup) {
        const target = event.target as HTMLElement;
        const isPopup = target.closest(`[data-popup-id="${activePopup}"]`);
        const isButton = target.closest(`[data-button-id="${activePopup}"]`);

        if (!isPopup && !isButton) {
          setActivePopup(null);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [activePopup, hasActiveTimings]);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    // 折りたたむ際はポップアップも閉じる
    if (isExpanded) {
      setActivePopup(null);
    }
  };

  const togglePopup = (timing: string) => {
    if (activePopup === timing) {
      setActivePopup(null);
    } else {
      setActivePopup(timing);
    }
  };

  if (!hasActiveTimings) return null;

  return (
    <div className="mt-2 relative" ref={containerRef}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-1 text-xs text-gray-600"
      >
        <button
          onClick={toggleExpand}
          className="flex items-center text-gray-500 hover:text-gray-700 transition-colors"
          aria-expanded={isExpanded}
          aria-controls="recommended-timing-content"
        >
          <MdInfoOutline size={16} className="mr-0.5" />
          <span className="whitespace-nowrap">服用方法</span>
          {isExpanded ? (
            <MdExpandLess size={16} className="ml-0.5" />
          ) : (
            <MdExpandMore size={16} className="ml-0.5" />
          )}
        </button>
      </motion.div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            id="recommended-timing-content"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-visible mt-1 relative"
            ref={contentRef}
          >
            <div className="flex flex-wrap gap-1.5 bg-gray-200 p-2 rounded-md shadow-sm z-10 relative">
              {activeTimings.map((timing) => (
                <div key={timing} className="relative z-10">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center bg-white rounded-full px-2 py-0.5 border border-gray-200 shadow-sm"
                    onClick={() => togglePopup(timing)}
                    aria-expanded={activePopup === timing}
                    aria-controls={`popup-${timing}`}
                    data-button-id={timing}
                  >
                    <span className="text-gray-600 mr-1">
                      {TIMING_ICONS[timing]}
                    </span>
                    <span className="text-xs">{TIMING_LABELS[timing]}</span>
                  </motion.button>
                </div>
              ))}
            </div>

            {/* 共通のポップアップエリア - カード内で固定表示 */}
            <AnimatePresence>
              {activePopup && (
                <motion.div
                  id={`popup-${activePopup}`}
                  data-popup-id={activePopup}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute z-50 pointer-events-none"
                  style={{
                    // top: "-24px",
                    bottom: "-8px",
                    width: "calc(100% + 16px)",
                    maxWidth: "300px",
                  }}
                >
                  <div
                    className="bg-white p-2 rounded-md shadow-xl border border-gray-300 text-xs pointer-events-auto w-full"
                    style={{
                      boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
                    }}
                  >
                    <p className="text-gray-600 whitespace-normal leading-relaxed text-xs">
                      {
                        TIMING_DESCRIPTIONS[
                          activePopup as keyof typeof TIMING_DESCRIPTIONS
                        ]
                      }
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RecommendedIntakeInfo;
