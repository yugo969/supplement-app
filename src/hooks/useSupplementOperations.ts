import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import {
  addSupplement,
  deleteSupplement,
  getSupplements,
  updateSupplement,
  uploadImage,
  updateSupplementCount,
} from "@/lib/firestore";
import { useNotification } from "@/lib/useNotification";
import resizeImage from "@/lib/resizeImage";
import {
  SupplementData,
  SupplementFormData,
  DosageMethod,
} from "@/schemas/supplement";

const maxWidth = 552;
const maxHeight = 366;

const isTemporaryImageSource = (src: string) =>
  src.startsWith("data:") || src.startsWith("blob:");

const convertImageSourceToFile = async (src: string): Promise<File> => {
  const response = await fetch(src);
  if (!response.ok) {
    throw new Error("画像データの取得に失敗しました");
  }

  const blob = await response.blob();
  const extension = blob.type.split("/")[1] || "jpg";
  return new File([blob], `supplement-${Date.now()}.${extension}`, {
    type: blob.type || "image/jpeg",
  });
};

interface UseSupplementOperationsProps {
  supplements: SupplementData[];
  setSupplements: React.Dispatch<React.SetStateAction<SupplementData[]>>;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  selectedSupplement: SupplementData | null;
  setSelectedSupplement: React.Dispatch<
    React.SetStateAction<SupplementData | null>
  >;
  setUploadedImage: React.Dispatch<React.SetStateAction<string | null>>;
  selectedGroupIds: string[];
  setSelectedGroupIds: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedUnit: React.Dispatch<React.SetStateAction<string>>;
  setSelectedDosageMethod: React.Dispatch<React.SetStateAction<DosageMethod>>;
  setShowInfoDetails: React.Dispatch<React.SetStateAction<boolean>>;
  setShowFeedback: React.Dispatch<React.SetStateAction<boolean>>;
  setFeedbackTimingId: React.Dispatch<React.SetStateAction<string | null>>;
  setAnimatingIds: React.Dispatch<React.SetStateAction<string[]>>;
  showFeedback: boolean;
  animatingIds: string[];
  uploadedImage: string | null;
  methods: UseFormReturn<SupplementFormData>;
}

export const useSupplementOperations = ({
  supplements,
  setSupplements,
  setIsModalOpen,
  selectedSupplement,
  setSelectedSupplement,
  setUploadedImage,
  selectedGroupIds,
  setSelectedGroupIds,
  setSelectedUnit,
  setSelectedDosageMethod,
  setShowInfoDetails,
  setShowFeedback,
  setFeedbackTimingId,
  setAnimatingIds,
  showFeedback,
  animatingIds,
  uploadedImage,
  methods,
}: UseSupplementOperationsProps) => {
  const { showNotification } = useNotification();
  const { setValue, reset } = methods;

  const resetForm = () => {
    reset({
      supplement_name: "",
      dosage: 1,
      dosage_unit: "錠",
      intake_amount: 1,
      intake_unit: "錠",
      dosage_method: "timing",
      timing_morning: false,
      timing_noon: false,
      timing_night: false,
      timing_before_meal: false,
      timing_after_meal: false,
      timing_empty_stomach: false,
      timing_bedtime: false,
      timing_as_needed: false,
      daily_target_count: 1,
      meal_timing: "none",
    });
    setSelectedUnit("錠");
    setSelectedDosageMethod("timing");
    setSelectedGroupIds([]);
    setIsModalOpen(false);
  };

  const handleAddOrUpdateSupplement = async (data: SupplementFormData) => {
    // タイミングベースを選択している場合に少なくとも1つのチェックボックスが選択されているか確認
    if (
      data.dosage_method === "timing" &&
      !data.timing_morning &&
      !data.timing_noon &&
      !data.timing_night
    ) {
      return;
    }

    // 内容量と服用量が正の整数であることを確認
    if (!data.dosage || data.dosage <= 0 || !Number.isInteger(data.dosage)) {
      return;
    }

    if (
      !data.intake_amount ||
      data.intake_amount <= 0 ||
      !Number.isInteger(data.intake_amount)
    ) {
      return;
    }

    const dosage = Number(data.dosage);
    const intake_amount = Number(data.intake_amount);
    let imageUrl = uploadedImage;
    if (uploadedImage && isTemporaryImageSource(uploadedImage)) {
      const imageFile = await convertImageSourceToFile(uploadedImage);
      imageUrl = await uploadImage(imageFile);
    } else if (data.image && data.image[0]) {
      imageUrl = await uploadImage(data.image[0]);
    }

    const isTimingMode = (data.dosage_method || "timing") === "timing";

    // countモードで朝昼夜フラグが残ると意図しないシステムグループ表示になるため保存時に正規化する
    const timingFields = {
      timing_morning: isTimingMode ? !!data.timing_morning : false,
      timing_noon: isTimingMode ? !!data.timing_noon : false,
      timing_night: isTimingMode ? !!data.timing_night : false,
      timing_before_meal: isTimingMode ? !!data.timing_before_meal : false,
      timing_after_meal: isTimingMode ? !!data.timing_after_meal : false,
      timing_empty_stomach: isTimingMode ? !!data.timing_empty_stomach : false,
      timing_bedtime: isTimingMode ? !!data.timing_bedtime : false,
      timing_as_needed: isTimingMode ? !!data.timing_as_needed : false,
    };

    // dosage_methodがundefinedの場合は'timing'をデフォルト値として使用
    const supplementData = {
      ...data,
      ...timingFields,
      dosage,
      intake_amount,
      imageUrl,
      groupIds: selectedGroupIds,
      dosage_method: data.dosage_method || "timing",
    };
    if ("image" in supplementData) {
      delete supplementData.image;
    }

    if (selectedSupplement) {
      await updateSupplement(selectedSupplement.id, supplementData);
      showNotification({ message: "サプリ情報を編集しました" });
    } else {
      await addSupplement({
        ...supplementData,
        takenTimings: {
          morning: false,
          noon: false,
          night: false,
          before_meal: false,
          after_meal: false,
          empty_stomach: false,
          bedtime: false,
        },
      });
      showNotification({ message: "サプリ情報を追加しました" });
    }

    setIsModalOpen(false);
    setSelectedSupplement(null);
    setUploadedImage(null);
    resetForm();

    // データ再取得
    try {
      const data = await getSupplements();
      setSupplements(data);
    } catch (error) {
      console.error("データ取得エラー:", error);
    }
  };

  const handleOpenUpdateModal = (supplement: SupplementData) => {
    setSelectedSupplement(supplement);
    setIsModalOpen(true);
    setSelectedUnit(supplement.dosage_unit);
    setSelectedDosageMethod(supplement.dosage_method || "timing");

    // meal_timingの設定（後方互換性のため）
    let mealTiming = supplement.meal_timing || "none";
    if (!supplement.meal_timing) {
      if (supplement.timing_before_meal) {
        mealTiming = "before_meal";
      } else if (supplement.timing_after_meal) {
        mealTiming = "after_meal";
      } else if (supplement.timing_empty_stomach) {
        mealTiming = "empty_stomach";
      }
    }

    setValue("supplement_name", supplement.supplement_name);
    setValue("dosage", supplement.dosage);
    setValue("dosage_unit", supplement.dosage_unit);
    setValue("intake_amount", supplement.intake_amount);
    setValue("intake_unit", supplement.intake_unit);
    setValue("dosage_method", supplement.dosage_method || "timing");
    setValue("timing_morning", supplement.timing_morning);
    setValue("timing_noon", supplement.timing_noon);
    setValue("timing_night", supplement.timing_night);
    setValue("timing_before_meal", supplement.timing_before_meal);
    setValue("timing_after_meal", supplement.timing_after_meal);
    setValue("timing_empty_stomach", supplement.timing_empty_stomach);
    setValue("timing_bedtime", supplement.timing_bedtime);
    setValue("timing_as_needed", supplement.timing_as_needed || false);
    setValue("meal_timing", mealTiming);

    if (supplement.daily_target_count) {
      setValue("daily_target_count", supplement.daily_target_count);
    }

    setUploadedImage(supplement.imageUrl);
    setSelectedGroupIds(supplement.groupIds || []);
  };

  const handleDeleteSupplement = async (id: string) => {
    showNotification({
      message: "本当に削除しますか？",
      autoHide: false,
      actions: [
        {
          label: "キャンセル",
          callback: () => {
            showNotification({
              message: "削除をキャンセルしました",
              duration: 1,
            });
          },
        },
        {
          label: "削除",
          callback: async () => {
            try {
              await deleteSupplement(id);
              const data = await getSupplements();
              setSupplements(data);
              showNotification({ message: "サプリ情報を削除しました" });
            } catch (error) {
              console.error("削除エラー:", error);
              showNotification({ message: "サプリ情報の削除に失敗しました" });
            }
          },
        },
      ],
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      resizeImage(file, maxWidth, maxHeight)
        .then((resizedImageUrl) => {
          setUploadedImage(resizedImageUrl);
        })
        .catch((error) => {
          console.error("画像のリサイズに失敗しました:", error);
        });
    } else {
      console.error("ファイルが提供されていません");
    }
  };

  const handleImageDelete = () => {
    setUploadedImage(null);
  };

  const handleImageUpdate = (croppedImageUrl: string) => {
    setUploadedImage(croppedImageUrl);
  };

  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newUnit = e.target.value;
    setSelectedUnit(newUnit);

    // 両方の単位を更新
    setValue("dosage_unit", newUnit);
    setValue("intake_unit", newUnit);
  };

  const handleIncreaseDosageCount = async (supplementId: string) => {
    const supplement = supplements.find((s) => s.id === supplementId);
    if (!supplement) return;

    // ボタンが既に処理中かチェック
    if (showFeedback || animatingIds.includes(`${supplementId}-count`)) {
      return;
    }

    // 残り容量チェック
    if (
      (supplement.dosage_left ?? supplement.dosage) < supplement.intake_amount
    ) {
      showNotification({ message: "残り容量が不足しています" });
      return;
    }

    // 処理中フラグを設定
    const countId = `${supplementId}-count`;
    setAnimatingIds((prev) => [...prev, countId]);

    try {
      // データを準備
      const currentCount = supplement.takenCount || 0;
      const newCount = currentCount + 1;
      const newDosage =
        (supplement.dosage_left ?? supplement.dosage) -
        supplement.intake_amount;

      const currentHistory = supplement.dosageHistory || [];
      const newHistory = [
        ...currentHistory,
        { timestamp: new Date().toISOString(), count: 1 },
      ];

      // UI更新を先に行う
      setSupplements((prevSupplements) =>
        prevSupplements.map((s) =>
          s.id === supplementId
            ? {
                ...s,
                dosage: newDosage,
                dosage_left: newDosage,
                takenCount: newCount,
                dosageHistory: newHistory,
              }
            : s
        )
      );

      // カウント表示エリアを右端にスクロール
      setTimeout(() => {
        const scrollContainer = document.querySelector(
          `[aria-label="服用回数履歴"]`
        );
        if (scrollContainer instanceof HTMLElement) {
          scrollContainer.scrollLeft = scrollContainer.scrollWidth;
        }
      }, 10);

      // カードの中央でアニメーション表示
      const card = document.getElementById(`supplement-card-${supplementId}`);
      if (card) {
        setTimeout(() => {
          setFeedbackTimingId(`supplement-card-${supplementId}`);
          setShowFeedback(true);
        }, 5);
      } else {
        // 通常のボタンアニメーション表示（フォールバック）
        setFeedbackTimingId(countId);
        setShowFeedback(true);
      }

      // データベース更新は非同期で行う
      updateSupplementCount(
        supplementId,
        newDosage,
        newCount,
        newHistory
      ).catch((error) => {
        console.error("服用回数更新エラー:", error);
        showNotification({ message: "エラーが発生しました" });

        // エラー時はUIを元に戻す
        setSupplements((prevSupplements) =>
          prevSupplements.map((s) =>
            s.id === supplementId
              ? {
                  ...s,
                  dosage: supplement.dosage_left ?? supplement.dosage,
                  dosage_left: supplement.dosage_left ?? supplement.dosage,
                  takenCount: currentCount,
                  dosageHistory: currentHistory,
                }
              : s
          )
        );
      });
    } catch (error) {
      console.error("服用回数更新エラー:", error);
      showNotification({ message: "エラーが発生しました" });

      // エラー時は処理中フラグを解除
      setAnimatingIds((prev) => prev.filter((id) => id !== countId));
    }
  };

  const handleDecreaseDosageCount = async (supplementId: string) => {
    const supplement = supplements.find((s) => s.id === supplementId);
    if (!supplement) return;

    const currentCount = supplement.takenCount || 0;
    if (currentCount <= 0) return;

    // 処理中チェック
    if (
      showFeedback ||
      animatingIds.includes(`${supplementId}-count-decrease`)
    ) {
      return;
    }

    // 操作中フラグを設定
    const countId = `${supplementId}-count-decrease`;
    setAnimatingIds((prev) => [...prev, countId]);

    try {
      // データ準備
      const newCount = currentCount - 1;
      const newDosage =
        (supplement.dosage_left ?? supplement.dosage) +
        supplement.intake_amount;

      // 履歴から最新の記録を削除
      const currentHistory = supplement.dosageHistory || [];
      const newHistory = [...currentHistory];
      if (newHistory.length > 0) {
        newHistory.pop();
      }

      // UI更新を先に行う
      setSupplements((prevSupplements) =>
        prevSupplements.map((s) =>
          s.id === supplementId
            ? {
                ...s,
                dosage: newDosage,
                dosage_left: newDosage,
                takenCount: newCount,
                dosageHistory: newHistory,
              }
            : s
        )
      );

      // データベース更新は非同期で行う
      updateSupplementCount(
        supplementId,
        newDosage,
        newCount,
        newHistory
      ).catch((error) => {
        console.error("服用回数更新エラー:", error);
        showNotification({ message: "エラーが発生しました" });

        // エラー時はUIを元に戻す
        setSupplements((prevSupplements) =>
          prevSupplements.map((s) =>
            s.id === supplementId
              ? {
                  ...s,
                  dosage: supplement.dosage_left ?? supplement.dosage,
                  dosage_left: supplement.dosage_left ?? supplement.dosage,
                  takenCount: currentCount,
                  dosageHistory: currentHistory,
                }
              : s
          )
        );
      });

      // 操作完了後フラグを解除（即時）
      setAnimatingIds((prev) => prev.filter((id) => id !== countId));
    } catch (error) {
      console.error("服用回数更新エラー:", error);
      showNotification({ message: "エラーが発生しました" });

      // エラー時は処理中フラグを解除
      setAnimatingIds((prev) => prev.filter((id) => id !== countId));
    }
  };

  return {
    resetForm,
    handleAddOrUpdateSupplement,
    handleOpenUpdateModal,
    handleDeleteSupplement,
    handleImageChange,
    handleImageDelete,
    handleImageUpdate,
    handleUnitChange,
    handleIncreaseDosageCount,
    handleDecreaseDosageCount,
  };
};
