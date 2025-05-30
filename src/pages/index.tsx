import Image from "next/image";
import firebase from "@/lib/firebaseClient";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import {
  addSupplement,
  deleteSupplement,
  getSupplements,
  updateSupplement,
  uploadImage,
  updateSupplementDosage,
  resetTimingsIfDateChanged,
  getCurrentDate,
  updateSupplementCount,
} from "@/lib/firestore";
import { useEffect, useState, useRef, useCallback } from "react";
import {
  MdAddAPhoto,
  MdDeleteForever,
  MdCancel,
  MdOutlineCancel,
  MdOutlineMedication,
  MdOutlineAddBox,
  MdInfoOutline,
  MdExpandMore,
  MdExpandLess,
} from "react-icons/md";
import resizeImage from "@/lib/resizeImage";
import { useNotification } from "@/lib/useNotification";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import AnimatedFeedback from "@/components/AnimatedFeedback";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  SupplementData,
  DosageMethod,
  TimingCategory,
  supplementFormSchema,
  SupplementFormData,
} from "@/schemas/supplement";
import { z } from "zod";
import SupplementCard from "@/components/SupplementCard";

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

    let newDosage = supplement.dosage;
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
          ? { ...s, dosage: newDosage, takenTimings: currentTakenTimings }
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

  const { user, loading } = useAuth();

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
      daily_target_count: 1,
      meal_timing: "none",
    });
    setSelectedUnit("錠");
    setSelectedDosageMethod("timing");
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
      // エラーメッセージは既にZodスキーマで設定されているので、ここでは何もしない
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
    if (data.image && data.image[0]) {
      imageUrl = await uploadImage(data.image[0]);
    }

    // 服用タイミングフィールドが含まれていることを確認
    const timingFields = {
      timing_morning: !!data.timing_morning,
      timing_noon: !!data.timing_noon,
      timing_night: !!data.timing_night,
      timing_before_meal: !!data.timing_before_meal,
      timing_after_meal: !!data.timing_after_meal,
      timing_empty_stomach: !!data.timing_empty_stomach,
      timing_bedtime: !!data.timing_bedtime,
    };

    // dosage_methodがundefinedの場合は'timing'をデフォルト値として使用
    const supplementData = {
      ...data,
      ...timingFields, // タイミングフィールドを明示的に含める
      dosage,
      intake_amount,
      imageUrl,
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
          // 食事関連のタイミングは推奨情報として扱うため、服用記録からは除外
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

    getSupplements()
      .then((data) => {
        setSupplements(data);
      })
      .catch(() => {});
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
    setValue("timing_morning", supplement.timing_morning);
    setValue("timing_noon", supplement.timing_noon);
    setValue("timing_night", supplement.timing_night);
    setValue("timing_before_meal", supplement.timing_before_meal);
    setValue("timing_after_meal", supplement.timing_after_meal);
    setValue("timing_empty_stomach", supplement.timing_empty_stomach);
    setValue("timing_bedtime", supplement.timing_bedtime);
    setValue("meal_timing", mealTiming);

    if (supplement.daily_target_count) {
      setValue("daily_target_count", supplement.daily_target_count);
    }

    setUploadedImage(supplement.imageUrl);
  };

  const handleDeleteSupplement = async (id: string) => {
    await deleteSupplement(id);

    showNotification({
      message: "本当に削除しますか？",
      autoHide: false,
      actions: [
        {
          label: "キャンセル",
          callback: () => {
            showNotification({ message: "本当に削除しますか？", duration: 1 });
          },
        },
        {
          label: "削除",
          callback: async () => {
            await deleteSupplement(id);

            getSupplements()
              .then((data) => {
                setSupplements(data);
                showNotification({ message: "サプリ情報を削除しました" });
              })
              .catch(() => {
                showNotification({ message: "サプリ情報の削除に失敗しました" });
              });
          },
        },
      ],
    });
  };

  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

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

  // 単位の変更を同期させる関数
  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newUnit = e.target.value;
    setSelectedUnit(newUnit);

    // 両方の単位を更新
    setValue("dosage_unit", newUnit);
    setValue("intake_unit", newUnit);
  };

  // 回数ベースでの服用記録関数を追加
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

    // 処理中フラグを設定（先に設定）
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
                  dosage: supplement.dosage,
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
                  dosage: supplement.dosage,
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

  const [showInfoDetails, setShowInfoDetails] = useState(false);

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
        <Dialog
          open={isModalOpen}
          onOpenChange={(open) => {
            if (!open) {
              setIsModalOpen(false);
              setSelectedSupplement(null);
              resetForm();
              setShowInfoDetails(false);
            }
          }}
        >
          <DialogContent
            className="max-w-md max-h-[90vh] overflow-y-auto sm:max-w-lg md:max-w-xl"
            aria-describedby="dialog-description"
          >
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-gray-800">
                {selectedSupplement ? "サプリ編集" : "サプリ追加"}
              </DialogTitle>
              <div id="dialog-description" className="sr-only">
                {selectedSupplement
                  ? "サプリメントの情報を編集するフォーム"
                  : "新しいサプリメントを追加するフォーム"}
              </div>
            </DialogHeader>

            <Form {...methods}>
              <form
                className="space-y-6"
                onSubmit={methods.handleSubmit((data) =>
                  handleAddOrUpdateSupplement(data as SupplementFormData)
                )}
                aria-label={
                  selectedSupplement
                    ? "サプリ編集フォーム"
                    : "サプリ追加フォーム"
                }
              >
                <div className="group relative w-full aspect-[3/2] rounded-md bg-gray-200">
                  {!uploadedImage ? (
                    <label
                      htmlFor="supplement_image"
                      className="absolute inset-0 flex flex-col items-center justify-center gap-2 cursor-pointer"
                    >
                      <MdAddAPhoto size={64} aria-hidden="true" />
                      <span className="text-[16px]">画像追加</span>
                      <input
                        id="supplement_image"
                        type="file"
                        {...register("image")}
                        onChange={handleImageChange}
                        className="opacity-0 absolute inset-0 w-full h-full"
                        aria-label="サプリの画像をアップロード"
                      />
                    </label>
                  ) : (
                    <div className="relative w-full h-full">
                      <Image
                        src={uploadedImage}
                        alt="アップロードされた画像"
                        fill
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute right-1 bottom-1 w-14 h-14 rounded-full transition duration-300 group-hover:opacity-100 bg-black/70 border-white">
                        <button
                          className="flex flex-col justify-center items-center gap-0.5 opacity-100 transition duration-300 group-hover:opacity-100 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-[22px] w-10 h-10 rounded"
                          onClick={handleImageDelete}
                          type="button"
                          aria-label="画像を削除"
                        >
                          <MdDeleteForever size={60} aria-hidden="true" />
                          <span className="text-[12px]">削除</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <FormField
                    control={methods.control}
                    name="supplement_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="supplement_name">
                          サプリ名
                        </FormLabel>
                        <FormControl>
                          <Input
                            id="supplement_name"
                            placeholder="サプリメント名を入力"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={methods.control}
                    name="dosage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="dosage">内容量</FormLabel>
                        <div className="flex">
                          <Input
                            id="dosage"
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            className="rounded-r-none"
                            value={field.value?.toString() || ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(value === "" ? "" : value);
                            }}
                            aria-label="サプリメント全体の内容量の数値"
                            aria-required="true"
                            placeholder="数値を入力"
                          />
                          <select
                            id="dosage_unit"
                            className="p-2 rounded-r-md border border-input border-l-0 bg-background focus:ring-2 focus:ring-gray-500 focus:border-gray-500 focus:outline-none"
                            value={selectedUnit}
                            {...register("dosage_unit", {
                              required: "単位は必須です",
                            })}
                            onChange={handleUnitChange}
                            aria-label="内容量の単位"
                            aria-required="true"
                          >
                            <option value="" disabled>
                              単位
                            </option>
                            <option value="錠">錠</option>
                            <option value="g">g</option>
                            <option value="ml">ml</option>
                            <option value="包">包</option>
                          </select>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={methods.control}
                    name="intake_amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="intake_amount">
                          一回の服用量
                        </FormLabel>
                        <div className="flex">
                          <Input
                            id="intake_amount"
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            className="rounded-r-none"
                            value={field.value?.toString() || ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(value === "" ? "" : value);
                            }}
                            aria-label="一回の服用量の数値"
                            aria-required="true"
                            placeholder="数値を入力"
                          />
                          <select
                            id="intake_unit"
                            className="p-2 rounded-r-md border border-input border-l-0 bg-background focus:ring-2 focus:ring-gray-500 focus:border-gray-500 focus:outline-none"
                            value={selectedUnit}
                            {...register("intake_unit", {
                              required: "単位は必須です",
                            })}
                            onChange={handleUnitChange}
                            aria-label="一回の服用量の単位"
                            aria-required="true"
                          >
                            <option value="" disabled>
                              単位
                            </option>
                            <option value="錠">錠</option>
                            <option value="g">g</option>
                            <option value="ml">ml</option>
                            <option value="包">包</option>
                          </select>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={methods.control}
                  name="dosage_method"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel id="dosage_method_label">
                        服用管理方法
                      </FormLabel>
                      <RadioGroup
                        id="dosage_method_group"
                        value={field.value}
                        onValueChange={(value) => {
                          setSelectedDosageMethod(value as DosageMethod);
                          field.onChange(value);
                        }}
                        className="flex flex-col space-y-2"
                        aria-labelledby="dosage_method_label"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="timing" id="timing_method" />
                          <Label htmlFor="timing_method">
                            タイミングベース（朝・昼・夜など）
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="count" id="count_method" />
                          <Label htmlFor="count_method">
                            回数ベース（1日の服用回数）
                          </Label>
                        </div>
                      </RadioGroup>
                    </FormItem>
                  )}
                />

                {selectedDosageMethod === "timing" ? (
                  <FormItem>
                    <FormLabel id="timing_group_label" htmlFor="timing_group">
                      時間帯
                    </FormLabel>
                    <div
                      id="timing_group"
                      className="flex flex-wrap gap-5 pt-2"
                      role="group"
                      aria-labelledby="timing_group_label"
                    >
                      <div className="flex items-center space-x-2">
                        <FormField
                          control={methods.control}
                          name="timing_morning"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  id="timing_morning"
                                />
                              </FormControl>
                              <Label htmlFor="timing_morning">朝</Label>
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <FormField
                          control={methods.control}
                          name="timing_noon"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  id="timing_noon"
                                />
                              </FormControl>
                              <Label htmlFor="timing_noon">昼</Label>
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <FormField
                          control={methods.control}
                          name="timing_night"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  id="timing_night"
                                />
                              </FormControl>
                              <Label htmlFor="timing_night">夜</Label>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    {/* 時間帯が選択されていない場合のエラーメッセージ */}
                    {errors.dosage_method && (
                      <p className="text-sm font-medium text-red-500 mt-2">
                        少なくとも1つの時間帯を選択してください
                      </p>
                    )}
                  </FormItem>
                ) : (
                  <FormField
                    control={methods.control}
                    name="daily_target_count"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="daily_target_count">
                          1日の目標服用回数
                        </FormLabel>
                        <FormControl>
                          <Input
                            id="daily_target_count"
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(value === "" ? "" : value);
                            }}
                            value={field.value?.toString() || ""}
                            className="w-24"
                            placeholder="数値を入力"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* 推奨服用方法は服用管理方法に関わらず表示 */}
                <FormItem>
                  <div className="flex items-center">
                    <FormLabel
                      id="meal_timing_label"
                      htmlFor="meal_timing_group"
                      className="flex items-center"
                    >
                      推奨服用方法
                      <button
                        type="button"
                        onClick={() => setShowInfoDetails(!showInfoDetails)}
                        className="inline-flex items-center text-gray-500 hover:text-gray-700 transition-colors ml-1"
                        aria-label={
                          showInfoDetails
                            ? "詳細情報を閉じる"
                            : "詳細情報を表示"
                        }
                      >
                        {showInfoDetails ? (
                          <MdExpandLess size={18} />
                        ) : (
                          <MdInfoOutline size={18} />
                        )}
                      </button>
                    </FormLabel>
                  </div>

                  {showInfoDetails && (
                    <div className="mt-1 mb-3 p-3 bg-gray-200 border-2 border-gray-200 rounded-md text-xs overflow-y-auto">
                      <dl className="space-y-3">
                        <div>
                          <dt className="font-medium text-gray-700">食前</dt>
                          <dd className="text-gray-600 ml-4">
                            食事の前に服用することで、効果的に吸収されます。一般的に食事の30分前が推奨されます。
                          </dd>
                        </div>
                        <div>
                          <dt className="font-medium text-gray-700">食後</dt>
                          <dd className="text-gray-600 ml-4">
                            食後に服用することで、胃への刺激を軽減します。食事から30分以内の服用が推奨されます。
                          </dd>
                        </div>
                        <div>
                          <dt className="font-medium text-gray-700">空腹時</dt>
                          <dd className="text-gray-600 ml-4">
                            空腹時（食間）に服用することで、より効率的に吸収されます。食事から2時間以上経過した時間帯が最適です。
                          </dd>
                        </div>
                        <div>
                          <dt className="font-medium text-gray-700">就寝前</dt>
                          <dd className="text-gray-600 ml-4">
                            就寝前に服用することで、体内での作用時間を最大化します。就寝30分前の服用が推奨されます。
                          </dd>
                        </div>
                      </dl>
                    </div>
                  )}

                  <div
                    id="meal_timing_group"
                    className="flex flex-wrap gap-5 pt-2"
                    role="group"
                    aria-labelledby="meal_timing_label"
                  >
                    {/* 食前・食後・空腹時・なしの選択肢を排他的にする（ラジオボタン） */}
                    <div className="w-full mb-1">
                      <RadioGroup
                        value={methods.watch("meal_timing") || "none"}
                        onValueChange={(value) => {
                          // meal_timingを更新
                          setValue(
                            "meal_timing",
                            value as
                              | "before_meal"
                              | "after_meal"
                              | "empty_stomach"
                              | "none"
                          );

                          // 古い個別のフラグを更新（後方互換性のため）
                          setValue(
                            "timing_before_meal",
                            value === "before_meal"
                          );
                          setValue("timing_after_meal", value === "after_meal");
                          setValue(
                            "timing_empty_stomach",
                            value === "empty_stomach"
                          );
                        }}
                        className="flex flex-wrap gap-5"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value="before_meal"
                            id="timing_before_meal_radio"
                          />
                          <Label htmlFor="timing_before_meal_radio">食前</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value="after_meal"
                            id="timing_after_meal_radio"
                          />
                          <Label htmlFor="timing_after_meal_radio">食後</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value="empty_stomach"
                            id="timing_empty_stomach_radio"
                          />
                          <Label htmlFor="timing_empty_stomach_radio">
                            空腹時
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="none" id="timing_none_radio" />
                          <Label htmlFor="timing_none_radio">なし</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* 就寝前はチェックボックスで個別に選択可能 */}
                    <div className="flex items-center space-x-2">
                      <FormField
                        control={methods.control}
                        name="timing_bedtime"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                id="timing_bedtime"
                              />
                            </FormControl>
                            <Label htmlFor="timing_bedtime">就寝前</Label>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </FormItem>

                <DialogFooter>
                  <Button
                    type="submit"
                    className="w-full bg-gray-700 hover:bg-gray-800 text-white"
                  >
                    {selectedSupplement ? "編集" : "登録"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}

      <AnimatedFeedback
        isVisible={showFeedback}
        timingId={feedbackTimingId}
        onAnimationComplete={handleFeedbackComplete}
      />
    </div>
  );
}
