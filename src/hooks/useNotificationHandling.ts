import { useState, useCallback } from "react";
import { SupplementData } from "@/schemas/supplement";
import { updateSupplementDosage } from "@/lib/firestore";

interface UseNotificationHandlingProps {
  supplements: SupplementData[];
  setSupplements: React.Dispatch<React.SetStateAction<SupplementData[]>>;
}

interface UseNotificationHandlingReturn {
  showFeedback: boolean;
  feedbackTimingId: string | null;
  animatingIds: string[];
  setShowFeedback: React.Dispatch<React.SetStateAction<boolean>>;
  setFeedbackTimingId: React.Dispatch<React.SetStateAction<string | null>>;
  setAnimatingIds: React.Dispatch<React.SetStateAction<string[]>>;
  handleTakeDose: (supplementId: string, timing: string) => Promise<void>;
  handleFeedbackComplete: () => void;
  handleUpdateSupplementTiming: (
    supplementId: string,
    timing: string,
    isTaking: boolean
  ) => Promise<void>;
}

export const useNotificationHandling = ({
  supplements,
  setSupplements,
}: UseNotificationHandlingProps): UseNotificationHandlingReturn => {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackTimingId, setFeedbackTimingId] = useState<string | null>(null);
  const [animatingIds, setAnimatingIds] = useState<string[]>([]);

  const handleUpdateSupplementTiming = async (
    supplementId: string,
    timing: string,
    isTaking: boolean
  ) => {
    // 食事関連のタイミングは服用記録として処理しない
    if (
      ["before_meal", "after_meal", "empty_stomach", "bedtime"].includes(timing)
    ) {
      console.log("食事関連のタイミングは服用記録として処理しません:", timing);
      return;
    }

    const supplement = supplements.find((s) => s.id === supplementId);
    if (!supplement) return;

    const currentTakenTimings = {
      ...(supplement.takenTimings || {
        morning: false,
        noon: false,
        night: false,
        before_meal: false,
        after_meal: false,
        empty_stomach: false,
        bedtime: false,
      }),
    };

    const timingKey = timing as keyof typeof currentTakenTimings;

    currentTakenTimings[timingKey] = isTaking;

    let newDosage = supplement.dosage_left ?? supplement.dosage;
    if (isTaking) {
      newDosage -= supplement.intake_amount;
    } else {
      newDosage += supplement.intake_amount;
    }

    if (newDosage < 0) newDosage = 0;

    await updateSupplementDosage(supplementId, newDosage, currentTakenTimings);

    setSupplements((prevSupplements) =>
      prevSupplements.map((s) =>
        s.id === supplementId
          ? {
              ...s,
              dosage: newDosage,
              dosage_left: newDosage,
              takenTimings: currentTakenTimings,
            }
          : s
      )
    );
  };

  const handleTakeDose = useCallback(
    async (supplementId: string, timing: string) => {
      const timingId = `${supplementId}-${timing}`;
      const supplement = supplements.find((s) => s.id === supplementId);

      if (
        supplement?.takenTimings?.[
          timing as keyof typeof supplement.takenTimings
        ]
      ) {
        await handleUpdateSupplementTiming(supplementId, timing, false);
        return;
      }

      // カードの中央でアニメーション表示するためにIDを使用
      const cardId = `supplement-card-${supplementId}`;
      setAnimatingIds((prev) => [...prev, timingId]);

      setTimeout(() => {
        setFeedbackTimingId(cardId);
        setShowFeedback(true);
      }, 5);
    },
    [supplements, handleUpdateSupplementTiming]
  );

  const handleFeedbackComplete = useCallback(() => {
    if (!feedbackTimingId) return;

    // アニメーション表示を消す
    setShowFeedback(false);

    // カードIDを使用している場合の処理
    if (feedbackTimingId.startsWith("supplement-card-")) {
      const supplementId = feedbackTimingId.replace("supplement-card-", "");

      // animatingIdsからカウントIDまたはタイミングIDを検索して削除
      const animIdToRemove = animatingIds.find((id) =>
        id.startsWith(`${supplementId}-`)
      );
      if (animIdToRemove) {
        // カウントベースのアニメーションかタイミングベースのアニメーションか判断
        if (animIdToRemove.includes("-count")) {
          // カウントベースの場合は単にフラグをクリア
          setFeedbackTimingId(null);
          setAnimatingIds((prev) => prev.filter((id) => id !== animIdToRemove));
        } else {
          // タイミングベースの場合はサプリメント服用処理も実行
          const [, timing] = animIdToRemove.split("-");
          setFeedbackTimingId(null);

          // サプリメント服用処理の実行
          handleUpdateSupplementTiming(supplementId, timing, true)
            .then(() => {
              // 成功時はフラグをリセット
              setAnimatingIds((prev) =>
                prev.filter((id) => id !== animIdToRemove)
              );
            })
            .catch((error: any) => {
              console.error("服用処理エラー:", error);
              // エラー時もフラグをリセット
              setAnimatingIds((prev) =>
                prev.filter((id) => id !== animIdToRemove)
              );
            });
        }
      }
    } else {
      // 従来の処理（ボタンIDベース）
      // カウントベースのアニメーションとタイミングベースのアニメーションを区別
      if (feedbackTimingId.includes("-count")) {
        // カウントベースの場合は単にフラグをクリア
        const timingIdCopy = feedbackTimingId;
        setFeedbackTimingId(null);

        // 即座にフラグをリセット
        setAnimatingIds((prev) => prev.filter((id) => id !== timingIdCopy));
      } else {
        // タイミングベースの場合はサプリメント服用処理も実行
        const [supplementId, timing] = feedbackTimingId.split("-");
        const timingIdCopy = feedbackTimingId;
        setFeedbackTimingId(null);

        // サプリメント服用処理の実行
        handleUpdateSupplementTiming(supplementId, timing, true)
          .then(() => {
            // 成功時はフラグをリセット
            setAnimatingIds((prev) => prev.filter((id) => id !== timingIdCopy));
          })
          .catch((error: any) => {
            console.error("服用処理エラー:", error);
            // エラー時もフラグをリセット
            setAnimatingIds((prev) => prev.filter((id) => id !== timingIdCopy));
          });
      }
    }
  }, [feedbackTimingId, animatingIds, handleUpdateSupplementTiming]);

  return {
    showFeedback,
    feedbackTimingId,
    animatingIds,
    setShowFeedback,
    setFeedbackTimingId,
    setAnimatingIds,
    handleTakeDose,
    handleFeedbackComplete,
    handleUpdateSupplementTiming,
  };
};
