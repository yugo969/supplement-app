import React from "react";
import Image from "next/image";
import { MdAdd, MdCheck, MdRemove } from "react-icons/md";
import { BsSunriseFill, BsSunFill, BsMoonStarsFill } from "react-icons/bs";
import { Button } from "@/components/ui/button";
import { AnimatedButton } from "@/components/ui/animated-button";
import {
  AnimatedCard,
  AnimatedCardContent,
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

const VARIANT_A_TIMING_ICONS = {
  morning: <BsSunriseFill size={20} />,
  noon: <BsSunFill size={20} />,
  night: <BsMoonStarsFill size={17} />,
};

interface SupplementCardProps {
  supplement: SupplementData;
  onEdit: (supplement: SupplementData) => void;
  onDelete: (supplementId: string) => void;
  onTakeDose: (supplementId: string, timing: string) => void;
  onIncreaseCount: (supplementId: string) => void;
  onDecreaseCount: (supplementId: string) => void;
  groupBadges?: { id: string; name: string }[];
  onGroupBadgeClick?: (groupId: string) => void;
  isGroupEditMode?: boolean;
  isAssignedToTargetGroup?: boolean;
  cardVariant?: "default" | "a";
  onToggleGroupMembership?: (supplementId: string) => void;
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
  groupBadges = [],
  onGroupBadgeClick = () => {},
  isGroupEditMode = false,
  isAssignedToTargetGroup = false,
  cardVariant = "default",
  onToggleGroupMembership = () => {},
  showFeedback,
  animatingIds,
}) => {
  const { showNotification } = useNotification();
  const isVariantA = cardVariant === "a";
  const recommendedTimings = {
    before_meal: supplement.timing_before_meal || false,
    after_meal: supplement.timing_after_meal || false,
    empty_stomach: supplement.timing_empty_stomach || false,
    bedtime: supplement.timing_bedtime || false,
    as_needed: supplement.timing_as_needed || false,
  };

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
        isGroupEditMode ||
        showFeedback ||
        animatingIds.includes(`${supplement.id}-${timing}`) ||
        (!isTaken && isInsufficientDosage); // 未服用で残り容量不足の場合のみ無効

      return (
        <AnimatedButton
          key={timing}
          id={`${supplement.id}-${timing}`}
          type="button"
          onClick={() => !isDisabled && onTakeDose(supplement.id, timing)}
          disabled={isDisabled}
          checked={Boolean(isTaken)}
          className="px-3"
          label={
            <span className={isVariantA ? "" : "scale-[0.82]"}>
              {isVariantA
                ? VARIANT_A_TIMING_ICONS[
                    timing as keyof typeof VARIANT_A_TIMING_ICONS
                  ]
                : TIMING_ICONS[timing as keyof typeof TIMING_ICONS]}
            </span>
          }
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
    const targetCount = supplement.daily_target_count || 0;
    const completionRate =
      targetCount > 0 ? Math.round((currentCount / targetCount) * 100) : 0;
    const isCompleted = targetCount > 0 && currentCount >= targetCount;

    return (
      <div className="w-full">
        <div
          className={`flex items-center rounded-full border border-gray-300 w-full overflow-hidden h-9 ${
            isVariantA
              ? "bg-white shadow-[0_4px_10px_rgba(15,23,42,0.12)]"
              : "bg-white shadow-sm"
          }`}
        >
          <button
            type="button"
            onClick={() => onDecreaseCount(supplement.id)}
            disabled={isGroupEditMode || showFeedback || currentCount <= 0}
            className="flex-none w-9 h-9 p-0 text-gray-600 border-r border-gray-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-l-full"
            style={{
              backgroundColor: isVariantA ? "#ffffff" : "#e5e7eb",
              boxShadow: isVariantA
                ? "none"
                : "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
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
            className={`flex-1 overflow-x-scroll overflow-y-hidden flex items-center px-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden h-full touch-pan-x cursor-grab active:cursor-grabbing ${
              isVariantA ? "bg-white" : "bg-gray-50"
            }`}
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
              isGroupEditMode ||
              showFeedback ||
              (supplement.dosage_left ?? supplement.dosage) <
                supplement.intake_amount
            }
            className="flex-none w-9 h-9 p-0 text-gray-600 border-l border-gray-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-r-full"
            style={{
              backgroundColor: isVariantA ? "#ffffff" : "#e5e7eb",
              boxShadow: isVariantA
                ? "none"
                : "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
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
          <div className="mt-1 flex items-center justify-end gap-3 pr-2 text-xs text-gray-500">
            <div className="text-gray-600">
              {currentCount} / {supplement.daily_target_count} 回
            </div>
            <div
              className={`font-medium ${isCompleted ? "text-green-600" : "text-gray-600"}`}
            >
              {completionRate}%
            </div>
          </div>
        )}
      </div>
    );
  };

  // 回数ベースで100%達成しているかチェック
  const isCountCompleted =
    isCountBased &&
    supplement.daily_target_count &&
    supplement.daily_target_count > 0 &&
    (supplement.takenCount || 0) >= supplement.daily_target_count;

  return (
    <AnimatedCard
      id={`supplement-card-${supplement.id}`}
      className={`relative h-full w-full max-w-[390px] mx-auto border bg-zinc-50 shadow-sm shadow-slate-300 animated-card transition-all duration-300 ${
        isGroupEditMode
          ? isAssignedToTargetGroup
            ? "border-emerald-500 shadow-emerald-200"
            : "border-gray-300 grayscale-[0.45] opacity-80"
          : isCountCompleted
            ? "border-green-400 shadow-green-200"
            : "border-white"
      } ${isGroupEditMode ? "cursor-pointer" : ""}`}
      tabIndex={0}
      onClick={() => {
        if (isGroupEditMode) {
          onToggleGroupMembership(supplement.id);
        }
      }}
      onKeyDown={(event: React.KeyboardEvent<HTMLElement>) => {
        if (!isGroupEditMode) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onToggleGroupMembership(supplement.id);
        }
      }}
    >
      <div className="relative flex h-full min-h-[176px] items-stretch">
        {isGroupEditMode && (
          <div className="absolute inset-0 z-10 pointer-events-none bg-gray-200/55" />
        )}

        <div className="relative w-28 sm:w-32 shrink-0">
          {supplement.imageUrl ? (
            <Image
              src={supplement.imageUrl}
              alt={`${supplement.supplement_name}の画像`}
              fill
              sizes="(max-width: 768px) 112px, 128px"
              className="object-cover"
            />
          ) : (
            <div
              className="flex justify-center items-center w-full h-full text-black/50 text-base bg-gray-400"
              aria-label="画像なし"
            >
              no-image
            </div>
          )}
        </div>

        <AnimatedCardContent className="relative flex h-full min-w-0 flex-1 flex-col gap-2 p-3 sm:p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="relative max-w-full">
                <div className="overflow-x-auto whitespace-nowrap pr-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  <h3 className="inline-block text-sm sm:text-base font-semibold text-gray-800 leading-5">
                    {supplement.supplement_name}
                  </h3>
                </div>
                <div
                  className="pointer-events-none absolute inset-y-0 right-0 w-4 bg-gradient-to-l from-zinc-50 to-transparent"
                  aria-hidden="true"
                />
              </div>

              {groupBadges.length > 0 && (
                <div className="mt-1 flex gap-1.5 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  {groupBadges.map((group) => (
                    <button
                      key={`${supplement.id}-${group.id}`}
                      type="button"
                      className={`flex-none inline-flex h-5 items-center whitespace-nowrap text-[11px] leading-none px-2 py-0.5 rounded-full border ${
                        isGroupEditMode
                          ? "border-gray-300 text-gray-600 bg-gray-100 cursor-default"
                          : "border-gray-300 text-gray-700 bg-white hover:bg-gray-100"
                      }`}
                      onClick={(event) => {
                        event.stopPropagation();
                        if (!isGroupEditMode) {
                          onGroupBadgeClick(group.id);
                        }
                      }}
                      disabled={isGroupEditMode}
                      aria-label={`${group.name}グループ`}
                    >
                      {group.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {isVariantA ? (
              <div className="shrink-0 text-right text-xs">
                <div className="flex items-baseline justify-end gap-1.5 whitespace-nowrap">
                  <span className="text-[9px] leading-none text-gray-500">
                    用量
                  </span>
                  <span className="text-[13px] font-semibold leading-none text-gray-800">
                    {supplement.intake_amount}
                    <span className="ml-0.5 text-[10px] font-normal text-gray-500">
                      {supplement.intake_unit}
                    </span>
                  </span>
                </div>
                <div className="my-1 h-px bg-gray-300" aria-hidden="true" />
                <div className="flex items-baseline justify-end gap-1.5 whitespace-nowrap">
                  <span className="text-[9px] leading-none text-gray-500">
                    在庫
                  </span>
                  <span className="text-[13px] font-semibold leading-none text-gray-800">
                    {supplement.dosage_left ?? supplement.dosage}
                    <span className="ml-0.5 text-[10px] font-normal text-gray-500">
                      {supplement.dosage_unit}
                    </span>
                  </span>
                </div>
              </div>
            ) : (
              <div className="inline-grid shrink-0 grid-cols-2 gap-1 rounded-md bg-white px-1.5 py-1 text-center">
                <div className="min-w-[42px]">
                  <p className="text-[9px] leading-none text-gray-500">1回量</p>
                  <p className="mt-0.5 text-[13px] font-semibold leading-none text-gray-800">
                    {supplement.intake_amount}
                    <span className="ml-0.5 text-[10px] font-normal text-gray-500">
                      {supplement.intake_unit}
                    </span>
                  </p>
                </div>
                <div className="min-w-[42px]">
                  <p className="text-[9px] leading-none text-gray-500">残数</p>
                  <p className="mt-0.5 text-[13px] font-semibold leading-none text-gray-800">
                    {supplement.dosage_left ?? supplement.dosage}
                    <span className="ml-0.5 text-[10px] font-normal text-gray-500">
                      {supplement.dosage_unit}
                    </span>
                  </p>
                </div>
              </div>
            )}
          </div>

          {isTimingBased && (
            <div className="flex min-h-0 flex-1 items-center">
              <div className="flex w-full flex-col gap-1.5">
                <div className="flex items-center justify-center gap-3">
                  {renderTimingButtons()}
                </div>
              </div>
            </div>
          )}

          {isCountBased && (
            <div className="flex min-h-0 flex-1 items-center">
              <div className="w-full">{renderCountControls()}</div>
            </div>
          )}

          {!isGroupEditMode && (
            <div className="grid w-full min-h-7 grid-cols-[1fr_auto] items-center gap-1 pt-2 z-20">
              <div className="justify-self-center">
                <RecommendedIntakeInfo timings={recommendedTimings} compact />
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 rounded border-gray-300 px-2 py-0.5 text-xs leading-none text-gray-700"
                  onClick={() => onEdit(supplement)}
                  aria-label={`${supplement.supplement_name}を編集`}
                >
                  編集
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 rounded px-2 py-0.5 text-xs leading-none text-gray-700"
                  onClick={() => onDelete(supplement.id)}
                  aria-label={`${supplement.supplement_name}を削除`}
                >
                  削除
                </Button>
              </div>
            </div>
          )}
        </AnimatedCardContent>
      </div>

      {isGroupEditMode && (
        <button
          type="button"
          className={`absolute bottom-3 right-3 z-30 w-9 h-9 rounded-full border-2 flex items-center justify-center transition-colors ${
            isAssignedToTargetGroup
              ? "bg-emerald-600 border-emerald-600 text-white"
              : "bg-white/90 border-gray-500 text-gray-600"
          }`}
          onClick={(event) => {
            event.stopPropagation();
            onToggleGroupMembership(supplement.id);
          }}
          aria-label={`${supplement.supplement_name}のグループ所属を切り替える`}
        >
          <MdCheck size={20} aria-hidden="true" />
        </button>
      )}
    </AnimatedCard>
  );
};

export default SupplementCard;
