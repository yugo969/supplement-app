import Image from "next/image";
import firebase from "@/lib/firebaseClient";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import {
  updateSupplementDosage,
  resetTimingsIfDateChanged,
  getCurrentDate,
  getSupplements,
} from "@/lib/firestore";
import { useEffect, useState, useRef, useCallback } from "react";
import { MdOutlineMedication, MdOutlineAddBox } from "react-icons/md";
import { useNotification } from "@/lib/useNotification";
import { Button } from "@/components/ui/button";
import AnimatedFeedback from "@/components/AnimatedFeedback";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  SupplementData,
  DosageMethod,
  supplementFormSchema,
  SupplementFormData,
} from "@/schemas/supplement";
import SupplementCard from "@/components/SupplementCard";
import SupplementForm from "@/components/SupplementForm";
import { useSupplementOperations } from "@/hooks/useSupplementOperations";

const maxWidth = 552;
const maxHeight = 366;

export default function Home() {
  const methods = useForm<SupplementFormData>({
    resolver: zodResolver(supplementFormSchema) as any,
    defaultValues: {
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
      daily_target_count: 1,
      meal_timing: "none",
    },
  });
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
    watch,
  } = methods;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [supplements, setSupplements] = useState<SupplementData[]>([]);
  const [selectedSupplement, setSelectedSupplement] =
    useState<null | SupplementData>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackTimingId, setFeedbackTimingId] = useState<string | null>(null);
  const [animatingIds, setAnimatingIds] = useState<string[]>([]);

  const { showNotification } = useNotification();

  // 単位の同期処理のための状態
  const [selectedUnit, setSelectedUnit] = useState<string>("錠");

  const [selectedDosageMethod, setSelectedDosageMethod] =
    useState<DosageMethod>("timing");

  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [showInfoDetails, setShowInfoDetails] = useState(false);

  const { user, loading } = useAuth();

  // useSupplementOperationsカスタムフック
  const {
    resetForm,
    handleAddOrUpdateSupplement,
    handleOpenUpdateModal,
    handleDeleteSupplement,
    handleImageChange,
    handleImageDelete,
    handleUnitChange,
    handleIncreaseDosageCount,
    handleDecreaseDosageCount,
  } = useSupplementOperations({
    supplements,
    setSupplements,
    setIsModalOpen,
    selectedSupplement,
    setSelectedSupplement,
    setUploadedImage,
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
  });

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

  const handleTakeDose = async (supplementId: string, timing: string) => {
    const timingId = `${supplementId}-${timing}`;
    const supplement = supplements.find((s) => s.id === supplementId);

    if (
      supplement?.takenTimings?.[timing as keyof typeof supplement.takenTimings]
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
  };

  const handleFeedbackComplete = () => {
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
  };

  useEffect(() => {
    if (user) {
      getSupplements().then((data) => {
        // サプリメントデータに日付変更フラグがあれば処理する
        const updatedData = data.map(async (supplement) => {
          if (supplement.shouldResetTimings) {
            // サーバー側でもリセットを実行
            await resetTimingsIfDateChanged(supplement.id);

            // 回数ベースの場合はtakenCountをリセット
            if (supplement.dosage_method === "count") {
              supplement.takenCount = 0;
              supplement.dosageHistory = [];
            } else {
              // タイミングベースの場合はtakenTimingsをリセット
              if (supplement.takenTimings) {
                // 型安全な方法でtakenTimingsを更新
                const timings = supplement.takenTimings;
                Object.keys(timings).forEach((key) => {
                  const timingKey = key as keyof typeof timings;
                  timings[timingKey] = false;
                });
              }
            }
          }
          return supplement;
        });

        Promise.all(updatedData).then((result) => {
          setSupplements(result);
        });
      });
    }
  }, [user]);

  // 定期的に日付をチェックして変更があればリロード
  useEffect(() => {
    if (!user) return;

    let lastCheckedDate = getCurrentDate();

    const checkDateInterval = setInterval(() => {
      const currentDate = getCurrentDate();
      if (currentDate !== lastCheckedDate) {
        // 日付が変わったらデータを再取得
        getSupplements().then((data) => {
          const updatedData = data.map(async (supplement) => {
            // リセット処理を実行
            await resetTimingsIfDateChanged(supplement.id);
            return {
              ...supplement,
              takenTimings: {
                morning: false,
                noon: false,
                night: false,
                before_meal: false,
                after_meal: false,
                empty_stomach: false,
                bedtime: false,
              },
            };
          });

          Promise.all(updatedData).then((result) => {
            setSupplements(result);
            lastCheckedDate = currentDate;
          });
        });
      }
    }, 60000); // 1分ごとにチェック

    return () => clearInterval(checkDateInterval);
  }, [user]);

  const handleLogout = async () => {
    await firebase.auth().signOut();
  };

  if (loading) {
    return <p>ロード中...</p>;
  }

  return (
    <div
      className={`relative min-h-screen bg-zinc-200 ${
        isModalOpen && "overflow-hidden"
      }`}
    >
      <main className="relative">
        <Button
          className="fixed bottom-6 right-4 z-10 md:hidden rounded-full bg-gray-700 hover:bg-gray-800 p-0 w-16 h-16 shadow-lg shadow-slate-500"
          onClick={() => setIsModalOpen(true)}
          size="icon"
          aria-label="サプリを追加"
        >
          <MdOutlineAddBox size={32} />
        </Button>
        <div className="relative flex flex-col w-screen h-full md:p-10 p-4 gap-6">
          <header className="flex md:sticky md:top-2 bg-white/80 z-10 justify-between items-center rounded-md shadow-md shadow-slate-400 md:p-6 p-3">
            <h1 className="flex items-center sm:gap-2 text-gray-600 md:text-xl text-lg">
              <MdOutlineMedication size={40} aria-hidden="true" />
              <span className="font-bold leading-6">サプリ KEEPER</span>
            </h1>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="text-gray-700 border-gray-500 font-semibold hover:bg-gray-100 shadow-sm max-md:hidden"
                onClick={() => setIsModalOpen(true)}
                aria-label="サプリを追加"
              >
                <span>サプリ追加</span>
                <MdOutlineAddBox size={24} aria-hidden="true" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-gray-500 border-gray-400 hover:bg-gray-100"
                onClick={handleLogout}
                aria-label="ログアウト"
              >
                ログアウト
              </Button>
            </div>
          </header>

          <section
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 justify-items-center"
            aria-label="サプリメント一覧"
          >
            {supplements.map((supplement) => (
              <SupplementCard
                key={supplement.id}
                supplement={supplement}
                onEdit={handleOpenUpdateModal}
                onDelete={handleDeleteSupplement}
                onTakeDose={handleTakeDose}
                onIncreaseCount={handleIncreaseDosageCount}
                onDecreaseCount={handleDecreaseDosageCount}
                showFeedback={showFeedback}
                animatingIds={animatingIds}
              />
            ))}
          </section>
        </div>
      </main>

      {isModalOpen && (
        <SupplementForm
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedSupplement(null);
            setUploadedImage(null);
            resetForm();
            setShowInfoDetails(false);
          }}
          methods={methods}
          selectedSupplement={selectedSupplement}
          uploadedImage={uploadedImage}
          selectedUnit={selectedUnit}
          selectedDosageMethod={selectedDosageMethod}
          showInfoDetails={showInfoDetails}
          onSubmit={handleAddOrUpdateSupplement}
          onImageChange={handleImageChange}
          onImageDelete={handleImageDelete}
          onUnitChange={handleUnitChange}
          onDosageMethodChange={(method: DosageMethod) => {
            setSelectedDosageMethod(method);
            setValue("dosage_method", method);
          }}
          onToggleInfoDetails={() => setShowInfoDetails(!showInfoDetails)}
        />
      )}

      <AnimatedFeedback
        isVisible={showFeedback}
        timingId={feedbackTimingId}
        onAnimationComplete={handleFeedbackComplete}
      />
    </div>
  );
}
