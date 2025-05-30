import React from "react";
import Image from "next/image";
import { MdAdd, MdRemove } from "react-icons/md";
import { Button } from "@/components/ui/button";
import { AnimatedButton } from "@/components/ui/animated-button";
import {
  AnimatedCard,
  AnimatedCardHeader,
  AnimatedCardContent,
  AnimatedCardFooter,
} from "@/components/ui/animated-card";
import { SupplementData } from "@/schemas/supplement";
import { useNotification } from "@/lib/useNotification";
import RecommendedIntakeInfo from "@/components/RecommendedIntakeInfo";

// カスタムSVGアイコンコンポーネント
const MorningIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    {/* 地平線 */}
    <line
      x1="2"
      y1="15"
      x2="22"
      y2="15"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    {/* 太陽（地平線の上の半円のみ） */}
    <path d="M 5.5 15 A 6.5 6.5 0 0 1 18.5 15" fill="currentColor" />

    {/* 放射状の光線（ダッシュパターン、半円の境界から始まる） */}
    {/* 上方向の光線 */}
    <line
      x1="12"
      y1="8.5"
      x2="12"
      y2="1"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeDasharray="2 1.5"
      strokeLinecap="round"
    />

    {/* 左上斜め30度 */}
    <line
      x1="9.4"
      y1="10.1"
      x2="6"
      y2="3"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeDasharray="2 1.5"
      strokeLinecap="round"
    />

    {/* 左上斜め60度 */}
    <line
      x1="7.4"
      y1="12.3"
      x2="3"
      y2="6"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeDasharray="2 1.5"
      strokeLinecap="round"
    />

    {/* 左横 */}
    <line
      x1="5.5"
      y1="15"
      x2="1"
      y2="15"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeDasharray="2 1.5"
      strokeLinecap="round"
    />

    {/* 右上斜め30度 */}
    <line
      x1="14.6"
      y1="10.1"
      x2="18"
      y2="3"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeDasharray="2 1.5"
      strokeLinecap="round"
    />

    {/* 右上斜め60度 */}
    <line
      x1="16.6"
      y1="12.3"
      x2="21"
      y2="6"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeDasharray="2 1.5"
      strokeLinecap="round"
    />

    {/* 右横 */}
    <line
      x1="18.5"
      y1="15"
      x2="23"
      y2="15"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeDasharray="2 1.5"
      strokeLinecap="round"
    />
  </svg>
);

const NoonIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    {/* 太陽の本体（朝と同じサイズ） */}
    <circle cx="12" cy="12" r="6.5" fill="currentColor" />
    {/* 8方向の均等な光線（短め） */}
    <line
      x1="12"
      y1="1"
      x2="12"
      y2="4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <line
      x1="19.5"
      y1="4.5"
      x2="17.5"
      y2="6.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <line
      x1="23"
      y1="12"
      x2="20"
      y2="12"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <line
      x1="19.5"
      y1="19.5"
      x2="17.5"
      y2="17.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <line
      x1="12"
      y1="23"
      x2="12"
      y2="20"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <line
      x1="4.5"
      y1="19.5"
      x2="6.5"
      y2="17.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <line
      x1="1"
      y1="12"
      x2="4"
      y2="12"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <line
      x1="4.5"
      y1="4.5"
      x2="6.5"
      y2="6.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const NightIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    {/* 三日月（右上に配置） */}
    <path
      d="M17 9.3A7 7 0 1 1 10.7 3 5.6 5.6 0 0 0 17 9.3z"
      fill="currentColor"
    />
    {/* 星（右上エリアに配置） */}
    <circle cx="14" cy="5" r="0.7" fill="currentColor" />
    <circle cx="15.5" cy="6.5" r="0.5" fill="currentColor" />
    <circle cx="13" cy="7" r="0.4" fill="currentColor" />
  </svg>
);

// タイミングアイコン設定
const TIMING_ICONS = {
  morning: <MorningIcon size={24} />,
  noon: <NoonIcon size={24} />,
  night: <NightIcon size={24} />,
};

// タイミングラベル設定
const TIMING_LABELS = {
  morning: "朝",
  noon: "昼",
  night: "夜",
};

interface SupplementCardProps {
  supplement: SupplementData;
  onEdit: (supplement: SupplementData) => void;
  onDelete: (supplementId: string) => void;
  onTakeDose: (supplementId: string, timing: string) => void;
  onIncreaseCount: (supplementId: string) => void;
  onDecreaseCount: (supplementId: string) => void;
  showFeedback: boolean;
  animatingIds: string[];
}

const SupplementCard: React.FC<SupplementCardProps> = ({
  supplement,
  onEdit,
  onDelete,
  onTakeDose,
  onIncreaseCount,
  onDecreaseCount,
  showFeedback,
  animatingIds,
}) => {
  const { showNotification } = useNotification();
  const [isNameExpanded, setIsNameExpanded] = React.useState(false);
  const [isTextTruncated, setIsTextTruncated] = React.useState(false);
  const nameRef = React.useRef<HTMLDivElement>(null);

  // テキストが省略されているかチェック
  React.useEffect(() => {
    const checkTruncation = () => {
      if (nameRef.current && !isNameExpanded) {
        const isOverflowing =
          nameRef.current.scrollWidth > nameRef.current.clientWidth;
        setIsTextTruncated(isOverflowing);
      }
    };

    checkTruncation();
    window.addEventListener("resize", checkTruncation);
    return () => window.removeEventListener("resize", checkTruncation);
  }, [supplement.supplement_name, isNameExpanded]);

  const isTimingBased = supplement.dosage_method === "timing";
  const isCountBased = supplement.dosage_method === "count";

  // タイミングベースの場合のタイミングボタン - 選択されたタイミングのみ表示
  const renderTimingButtons = () => {
    const selectedTimings = [];

    // 朝・昼・夜の設定されているタイミングのみを表示
    if (supplement.timing_morning) selectedTimings.push("morning");
    if (supplement.timing_noon) selectedTimings.push("noon");
    if (supplement.timing_night) selectedTimings.push("night");

    return selectedTimings.map((timing) => {
      const isTaken =
        supplement.takenTimings?.[
          timing as keyof typeof supplement.takenTimings
        ];

      // 残り容量不足の場合、服用済み→未服用は可能だが、未服用→服用は不可
      const isInsufficientDosage =
        (supplement.dosage_left ?? supplement.dosage) <
        supplement.intake_amount;

      const isDisabled =
        showFeedback ||
        animatingIds.includes(`${supplement.id}-${timing}`) ||
        (!isTaken && isInsufficientDosage); // 未服用で残り容量不足の場合のみ無効

      return (
        <AnimatedButton
          key={timing}
          id={`${supplement.id}-${timing}`}
          onClick={() => !isDisabled && onTakeDose(supplement.id, timing)}
          disabled={isDisabled}
          checked={isTaken}
          label={TIMING_ICONS[timing as keyof typeof TIMING_ICONS]}
          aria-label={`${TIMING_LABELS[timing as keyof typeof TIMING_LABELS]}の服用を${
            isTaken ? "取り消し" : "記録"
          }`}
        />
      );
    });
  };

  // 回数ベースの場合のカウンター
  const renderCountControls = () => {
    const currentCount = supplement.takenCount || 0;

    return (
      <div className="w-full">
        <div className="flex items-center bg-white rounded-full border-2 border-gray-300 shadow-md w-full overflow-hidden h-10">
          <button
            type="button"
            onClick={() => onDecreaseCount(supplement.id)}
            disabled={showFeedback || currentCount <= 0}
            className="flex-none w-10 h-10 p-0 text-gray-600 border-r border-gray-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-l-full shadow-inner hover:shadow-md"
            style={{
              backgroundColor: "#e5e7eb",
              boxShadow: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.backgroundColor = "#d1d5db";
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.backgroundColor = "#e5e7eb";
            }}
            aria-label="服用回数を減らす"
          >
            <MdRemove size={16} />
          </button>

          <div
            className="flex-1 overflow-x-scroll overflow-y-hidden flex items-center px-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden h-full bg-gray-50 touch-pan-x cursor-grab active:cursor-grabbing"
            tabIndex={0}
            role="region"
            aria-label="服用回数履歴"
            style={{
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "none",
            }}
          >
            <div
              className="flex items-center gap-1 w-full justify-end pl-2 pr-1"
              style={{
                minWidth:
                  currentCount === 0
                    ? "100%"
                    : `${Math.max(currentCount * 30, 100)}px`,
              }}
            >
              {currentCount === 0 ? (
                <div className="text-sm text-gray-500 flex items-center mx-auto px-2">
                  未服用
                </div>
              ) : (
                Array.from({ length: currentCount }).map((_, index) => (
                  <div
                    key={index}
                    className="flex-none w-6 h-6 bg-gray-700 text-white rounded-full flex items-center justify-center text-xs font-medium shadow-sm"
                    aria-label={`${index + 1}回目の服用`}
                  >
                    {index + 1}
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onIncreaseCount(supplement.id)}
            disabled={
              showFeedback ||
              (supplement.dosage_left ?? supplement.dosage) <
                supplement.intake_amount
            }
            className="flex-none w-10 h-10 p-0 text-gray-600 border-l border-gray-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-r-full shadow-inner hover:shadow-md"
            style={{
              backgroundColor: "#e5e7eb",
              boxShadow: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.backgroundColor = "#d1d5db";
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.backgroundColor = "#e5e7eb";
            }}
            aria-label="服用回数を増やす"
          >
            <MdAdd size={16} />
          </button>
        </div>

        {supplement.daily_target_count && supplement.daily_target_count > 0 && (
          <div className="text-xs text-gray-500 text-right mt-1">
            目標: {currentCount} / {supplement.daily_target_count} 回
          </div>
        )}
      </div>
    );
  };

  return (
    <AnimatedCard
      id={`supplement-card-${supplement.id}`}
      className="w-full max-w-[356px] overflow-hidden border-2 border-white bg-zinc-50 shadow-slate-300 animated-card"
      tabIndex={0}
    >
      <div className="relative w-full h-auto" style={{ aspectRatio: "3/1.8" }}>
        {supplement.imageUrl ? (
          <Image
            src={supplement.imageUrl}
            alt={`${supplement.supplement_name}の画像`}
            fill
            className="object-cover"
          />
        ) : (
          <div
            className="flex justify-center items-center w-full h-full text-black/50 text-[24px] bg-gray-400"
            aria-label="画像なし"
          >
            no-image
          </div>
        )}

        {/* サプリ名オーバーレイ */}
        <div className="absolute bottom-2 left-0 right-0 flex justify-center">
          <div
            className={`relative bg-gray-700/90 backdrop-blur-sm text-white text-sm font-medium rounded-lg px-2 py-2 transition-all duration-300 ease-out hover:bg-gray-700 max-w-[90%] ${
              isTextTruncated ? "cursor-pointer" : ""
            }`}
            onClick={() =>
              isTextTruncated && setIsNameExpanded(!isNameExpanded)
            }
            onMouseEnter={() => isTextTruncated && setIsNameExpanded(true)}
            onMouseLeave={() => setIsNameExpanded(false)}
            aria-label={supplement.supplement_name}
          >
            <div
              ref={nameRef}
              className={`transition-all duration-300 ease-out text-center ${
                isNameExpanded ? "whitespace-normal break-words" : "truncate"
              }`}
              style={{
                maxHeight: isNameExpanded ? "200px" : "1.5rem",
                overflow: "hidden",
              }}
            >
              {supplement.supplement_name}
            </div>
          </div>
        </div>
      </div>

      <AnimatedCardContent className="flex flex-col gap-3 p-4">
        {/* 容量情報 */}
        <div className="flex justify-center items-center gap-8">
          <span className="flex items-baseline gap-1">
            <span className="text-gray-500 text-sm flex-shrink-0">残り:</span>
            <span className="text-gray-800 text-lg font-medium overflow-x-auto whitespace-nowrap [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {supplement.dosage_left ?? supplement.dosage}
            </span>
            <span className="text-gray-600 text-sm flex-shrink-0">
              {supplement.dosage_unit}
            </span>
          </span>
          <span className="flex items-baseline gap-1">
            <span className="text-gray-500 text-sm flex-shrink-0">1回:</span>
            <span className="text-gray-800 text-lg font-medium overflow-x-auto whitespace-nowrap [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {supplement.intake_amount}
            </span>
            <span className="text-gray-600 text-sm flex-shrink-0">
              {supplement.intake_unit}
            </span>
          </span>
        </div>

        {/* 服用管理エリア */}
        <div className="space-y-2">
          {isTimingBased && (
            <div className="p-1 flex flex-col gap-2">
              <div className="flex flex-wrap gap-2 justify-center">
                {renderTimingButtons()}
              </div>

              {/* 推奨服用方法の表示 - タイミングボタンの下 */}
              <RecommendedIntakeInfo
                timings={{
                  before_meal: supplement.timing_before_meal || false,
                  after_meal: supplement.timing_after_meal || false,
                  empty_stomach: supplement.timing_empty_stomach || false,
                  bedtime: supplement.timing_bedtime || false,
                }}
              />
            </div>
          )}

          {isCountBased && (
            <div className="p-1 flex flex-col gap-2">
              {renderCountControls()}

              {/* 推奨服用方法の表示 - カウンターの下 */}
              <RecommendedIntakeInfo
                timings={{
                  before_meal: supplement.timing_before_meal || false,
                  after_meal: supplement.timing_after_meal || false,
                  empty_stomach: supplement.timing_empty_stomach || false,
                  bedtime: supplement.timing_bedtime || false,
                }}
              />
            </div>
          )}
        </div>
      </AnimatedCardContent>

      <AnimatedCardFooter className="absolute bottom-3 right-3 gap-2">
        <Button
          variant="outline"
          size="sm"
          className="border-gray-500 text-gray-700 py-1 px-2 text-xs h-auto"
          onClick={() => onEdit(supplement)}
          aria-label={`${supplement.supplement_name}を編集`}
        >
          編集
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="border-b border-gray-500 text-gray-700 rounded-none p-1 text-xs h-auto"
          onClick={() => onDelete(supplement.id)}
          aria-label={`${supplement.supplement_name}を削除`}
        >
          削除
        </Button>
      </AnimatedCardFooter>
    </AnimatedCard>
  );
};

export default SupplementCard;
