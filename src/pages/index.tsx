import Image from "next/image";
import firebase from "@/lib/firebaseClient";
import { useAuth } from "@/hooks/useAuth";
import { useForm as useHookForm } from "react-hook-form";
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
  MdAdd,
  MdRemove,
  MdWbSunny,
  MdRestaurant,
  MdBrightness3,
  MdBrightness2,
  MdFreeBreakfast,
  MdDinnerDining,
  MdBed,
  MdNoFood,
} from "react-icons/md";
import resizeImage from "@/lib/resizeImage";
import { useNotification } from "@/lib/useNotification";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
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
} from "@/components/ui/form";
import {
  AnimatedCard,
  AnimatedCardHeader,
  AnimatedCardContent,
  AnimatedCardFooter,
} from "@/components/ui/animated-card";
import AnimatedFeedback from "@/components/AnimatedFeedback";
import { AnimatedButton } from "@/components/ui/animated-button";

type DosageMethod = "timing" | "count";

type TimingCategory = {
  time?: "morning" | "noon" | "night";
  meal?: "before_meal" | "after_meal" | "empty_stomach" | "bedtime";
};

type FormData = {
  supplement_name: string;
  dosage: number;
  dosage_unit: string;
  intake_amount: number;
  intake_unit: string;
  dosage_method: DosageMethod; // 服用方法（タイミングベースか回数ベース）
  timing_morning: boolean;
  timing_noon: boolean;
  timing_night: boolean;
  timing_before_meal: boolean; // 食前
  timing_after_meal: boolean; // 食後
  timing_empty_stomach: boolean; // 空腹時
  timing_bedtime: boolean; // 就寝前
  daily_target_count?: number; // 1日の目標服用回数
  image?: FileList;
  // 服用状況を管理するフィールド
  takenTimings?: {
    morning: boolean;
    noon: boolean;
    night: boolean;
    before_meal: boolean;
    after_meal: boolean;
    empty_stomach: boolean;
    bedtime: boolean;
  };
  // 回数ベースで使用
  takenCount?: number;
  dosageHistory?: { timestamp: string; count: number }[];
};

type SupplementData = FormData & {
  imageUrl: string;
  dosage_left?: number; // 服用状況更新後の残量
  lastTakenDate?: string; // 最後に服用した日付
  shouldResetTimings?: boolean; // 日付変更によるリセットが必要かどうか
};

const maxWidth = 552;
const maxHeight = 366;

// タイミングアイコン設定
const TIMING_ICONS = {
  morning: <MdWbSunny size={18} />,
  noon: <MdBrightness3 size={18} />,
  night: <MdBrightness2 size={18} />,
  before_meal: <MdNoFood size={18} />,
  after_meal: <MdRestaurant size={18} />,
  empty_stomach: <MdFreeBreakfast size={18} />,
  bedtime: <MdBed size={18} />,
};

// タイミングラベル設定
const TIMING_LABELS = {
  morning: "朝",
  noon: "昼",
  night: "夜",
  before_meal: "食前",
  after_meal: "食後",
  empty_stomach: "空腹時",
  bedtime: "就寝前",
};

export default function Home() {
  const methods = useHookForm<FormData>();
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = methods;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [supplements, setSupplements] = useState<any[]>([]);
  const [selectedSupplement, setSelectedSupplement] = useState<null | any>(
    null
  );
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
                Object.keys(supplement.takenTimings).forEach((key) => {
                  supplement.takenTimings[key] = false;
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
      dosage: 0,
      dosage_unit: "錠",
      intake_amount: 0,
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
    });
    setSelectedUnit("錠");
    setSelectedDosageMethod("timing");
    setUploadedImage("");
  };

  const handleAddOrUpdateSupplement = async (data: FormData) => {
    const dosage = Number(data.dosage);
    const intake_amount = Number(data.intake_amount);
    let imageUrl = uploadedImage;
    if (data.image && data.image[0]) {
      imageUrl = await uploadImage(data.image[0]);
    }

    const supplementData = { ...data, dosage, intake_amount, imageUrl };
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

    getSupplements()
      .then((data) => {
        setSupplements(data);
      })
      .catch(() => {});
  };

  const handleOpenUpdateModal = (supplement: SupplementData) => {
    setIsModalOpen(true);
    setSelectedSupplement(supplement);
    setSelectedUnit(supplement.dosage_unit);
    setSelectedDosageMethod(supplement.dosage_method || "timing");

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

  if (user) {
    console.log("ユーザーは認証されています");
  } else {
    console.log("ユーザーは認証されていません");
  }

  if (loading) {
    return <p>ロード中...</p>;
  }

  return (
    <div
      className={`relative h-full bg-zinc-200 ${
        isModalOpen && "overflow-hidden"
      }`}
    >
      <main className="relative">
        <Button
          className="fixed bottom-6 right-4 z-10 md:hidden rounded-full bg-orange-400 hover:bg-orange-500 p-0 w-16 h-16 shadow-lg shadow-slate-500"
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
                className="text-orange-400 border-orange-400 font-semibold hover:bg-orange-100 shadow-sm max-md:hidden"
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
              <AnimatedCard
                key={supplement.id}
                id={`supplement-card-${supplement.id}`}
                className="w-full max-w-[356px] overflow-hidden border-2 border-white bg-zinc-50 shadow-slate-300 animated-card"
                tabIndex={0}
              >
                <div className="relative w-full h-auto aspect-[3/2]">
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
                </div>

                <AnimatedCardHeader className="p-0">
                  <div className="text-center break-all">
                    <h2 className="py-0.5 px-4 bg-gray-700 text-bold text-sm text-white rounded-b-[40px] truncate">
                      {supplement.supplement_name}
                    </h2>
                  </div>
                </AnimatedCardHeader>

                <AnimatedCardContent className="flex flex-col gap-2 py-2 px-3">
                  <div className="flex flex-row flex-wrap gap-4">
                    <div className="">
                      <div className="flex border-b-2">
                        <span className="text-xs border-gray-300 flex">
                          内容量
                        </span>
                        <p className="p-2 pb-1 md:text-lg text-xl font-medium">
                          {supplement.dosage_left ?? supplement.dosage}{" "}
                          <span className="text-sm font-mono font-normal">
                            {supplement.dosage_unit}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="">
                      <div className="flex border-b-2">
                        <span className="text-xs border-gray-300 flex">
                          一回
                        </span>
                        <p className="p-2 pb-1 md:text-lg text-xl font-medium ">
                          {supplement.intake_amount}{" "}
                          <span className="text-sm font-mono font-normal">
                            {supplement.intake_unit}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col md:gap-1 gap-1">
                    <span className="flex-col-reverse text-xs border-gray-300 flex grow">
                      {supplement.dosage_method === "count"
                        ? "服用回数"
                        : "服用タイミング"}
                    </span>
                    {supplement.dosage_method === "timing" ? (
                      <div className="p-1 flex flex-col gap-2">
                        {/* 時間帯のタイミング */}
                        {(supplement.timing_morning ||
                          supplement.timing_noon ||
                          supplement.timing_night) && (
                          <div className="flex flex-wrap gap-2">
                            {supplement.timing_morning && (
                              <AnimatedButton
                                id={`${supplement.id}-morning`}
                                onClick={() =>
                                  handleTakeDose(supplement.id, "morning")
                                }
                                disabled={
                                  showFeedback ||
                                  animatingIds.includes(
                                    `${supplement.id}-morning`
                                  ) ||
                                  (!supplement.takenTimings?.morning &&
                                    ((supplement.dosage_left ??
                                      supplement.dosage) <= 0 ||
                                      (supplement.dosage_left ??
                                        supplement.dosage) <
                                        supplement.intake_amount))
                                }
                                checked={
                                  supplement.takenTimings?.morning || false
                                }
                                label={TIMING_ICONS.morning}
                                aria-label={`${TIMING_LABELS.morning} ${
                                  supplement.takenTimings?.morning
                                    ? "服用済み"
                                    : "未服用"
                                }`}
                                aria-pressed={
                                  supplement.takenTimings?.morning || false
                                }
                              />
                            )}

                            {supplement.timing_noon && (
                              <AnimatedButton
                                id={`${supplement.id}-noon`}
                                onClick={() =>
                                  handleTakeDose(supplement.id, "noon")
                                }
                                disabled={
                                  showFeedback ||
                                  animatingIds.includes(
                                    `${supplement.id}-noon`
                                  ) ||
                                  (!supplement.takenTimings?.noon &&
                                    ((supplement.dosage_left ??
                                      supplement.dosage) <= 0 ||
                                      (supplement.dosage_left ??
                                        supplement.dosage) <
                                        supplement.intake_amount))
                                }
                                checked={supplement.takenTimings?.noon || false}
                                label={TIMING_ICONS.noon}
                                aria-label={`${TIMING_LABELS.noon} ${
                                  supplement.takenTimings?.noon
                                    ? "服用済み"
                                    : "未服用"
                                }`}
                                aria-pressed={
                                  supplement.takenTimings?.noon || false
                                }
                              />
                            )}
                            {supplement.timing_night && (
                              <AnimatedButton
                                id={`${supplement.id}-night`}
                                onClick={() =>
                                  handleTakeDose(supplement.id, "night")
                                }
                                disabled={
                                  showFeedback ||
                                  animatingIds.includes(
                                    `${supplement.id}-night`
                                  ) ||
                                  (!supplement.takenTimings?.night &&
                                    ((supplement.dosage_left ??
                                      supplement.dosage) <= 0 ||
                                      (supplement.dosage_left ??
                                        supplement.dosage) <
                                        supplement.intake_amount))
                                }
                                checked={
                                  supplement.takenTimings?.night || false
                                }
                                label={TIMING_ICONS.night}
                                aria-label={`${TIMING_LABELS.night} ${
                                  supplement.takenTimings?.night
                                    ? "服用済み"
                                    : "未服用"
                                }`}
                                aria-pressed={
                                  supplement.takenTimings?.night || false
                                }
                              />
                            )}
                          </div>
                        )}

                        {/* 食事関連のタイミング */}
                        {(supplement.timing_before_meal ||
                          supplement.timing_after_meal ||
                          supplement.timing_empty_stomach ||
                          supplement.timing_bedtime) && (
                          <div className="flex flex-wrap gap-2">
                            {supplement.timing_before_meal && (
                              <AnimatedButton
                                id={`${supplement.id}-before_meal`}
                                onClick={() =>
                                  handleTakeDose(supplement.id, "before_meal")
                                }
                                disabled={
                                  showFeedback ||
                                  animatingIds.includes(
                                    `${supplement.id}-before_meal`
                                  ) ||
                                  (!supplement.takenTimings?.before_meal &&
                                    ((supplement.dosage_left ??
                                      supplement.dosage) <= 0 ||
                                      (supplement.dosage_left ??
                                        supplement.dosage) <
                                        supplement.intake_amount))
                                }
                                checked={
                                  supplement.takenTimings?.before_meal || false
                                }
                                label={TIMING_ICONS.before_meal}
                                aria-label={`${TIMING_LABELS.before_meal} ${
                                  supplement.takenTimings?.before_meal
                                    ? "服用済み"
                                    : "未服用"
                                }`}
                                aria-pressed={
                                  supplement.takenTimings?.before_meal || false
                                }
                              />
                            )}

                            {supplement.timing_after_meal && (
                              <AnimatedButton
                                id={`${supplement.id}-after_meal`}
                                onClick={() =>
                                  handleTakeDose(supplement.id, "after_meal")
                                }
                                disabled={
                                  showFeedback ||
                                  animatingIds.includes(
                                    `${supplement.id}-after_meal`
                                  ) ||
                                  (!supplement.takenTimings?.after_meal &&
                                    ((supplement.dosage_left ??
                                      supplement.dosage) <= 0 ||
                                      (supplement.dosage_left ??
                                        supplement.dosage) <
                                        supplement.intake_amount))
                                }
                                checked={
                                  supplement.takenTimings?.after_meal || false
                                }
                                label={TIMING_ICONS.after_meal}
                                aria-label={`${TIMING_LABELS.after_meal} ${
                                  supplement.takenTimings?.after_meal
                                    ? "服用済み"
                                    : "未服用"
                                }`}
                                aria-pressed={
                                  supplement.takenTimings?.after_meal || false
                                }
                              />
                            )}

                            {supplement.timing_empty_stomach && (
                              <AnimatedButton
                                id={`${supplement.id}-empty_stomach`}
                                onClick={() =>
                                  handleTakeDose(supplement.id, "empty_stomach")
                                }
                                disabled={
                                  showFeedback ||
                                  animatingIds.includes(
                                    `${supplement.id}-empty_stomach`
                                  ) ||
                                  (!supplement.takenTimings?.empty_stomach &&
                                    ((supplement.dosage_left ??
                                      supplement.dosage) <= 0 ||
                                      (supplement.dosage_left ??
                                        supplement.dosage) <
                                        supplement.intake_amount))
                                }
                                checked={
                                  supplement.takenTimings?.empty_stomach ||
                                  false
                                }
                                label={TIMING_ICONS.empty_stomach}
                                aria-label={`${TIMING_LABELS.empty_stomach} ${
                                  supplement.takenTimings?.empty_stomach
                                    ? "服用済み"
                                    : "未服用"
                                }`}
                                aria-pressed={
                                  supplement.takenTimings?.empty_stomach ||
                                  false
                                }
                              />
                            )}

                            {supplement.timing_bedtime && (
                              <AnimatedButton
                                id={`${supplement.id}-bedtime`}
                                onClick={() =>
                                  handleTakeDose(supplement.id, "bedtime")
                                }
                                disabled={
                                  showFeedback ||
                                  animatingIds.includes(
                                    `${supplement.id}-bedtime`
                                  ) ||
                                  (!supplement.takenTimings?.bedtime &&
                                    ((supplement.dosage_left ??
                                      supplement.dosage) <= 0 ||
                                      (supplement.dosage_left ??
                                        supplement.dosage) <
                                        supplement.intake_amount))
                                }
                                checked={
                                  supplement.takenTimings?.bedtime || false
                                }
                                label={TIMING_ICONS.bedtime}
                                aria-label={`${TIMING_LABELS.bedtime} ${
                                  supplement.takenTimings?.bedtime
                                    ? "服用済み"
                                    : "未服用"
                                }`}
                                aria-pressed={
                                  supplement.takenTimings?.bedtime || false
                                }
                              />
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-1 flex flex-col gap-2">
                        <div className="flex items-center">
                          <div className="flex items-center bg-white rounded-full border-2 border-gray-300 shadow-md w-full overflow-hidden h-8">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                if (
                                  (supplement.takenCount || 0) > 0 &&
                                  !showFeedback
                                ) {
                                  handleDecreaseDosageCount(supplement.id);
                                }
                              }}
                              onMouseOver={(e) => {
                                if (
                                  (supplement.takenCount || 0) > 0 &&
                                  !showFeedback
                                ) {
                                  e.currentTarget.style.backgroundColor =
                                    "#d1d5db";
                                }
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.backgroundColor =
                                  "#e5e7eb";
                              }}
                              onMouseDown={(e) => {
                                if (
                                  (supplement.takenCount || 0) > 0 &&
                                  !showFeedback
                                ) {
                                  e.currentTarget.style.backgroundColor =
                                    "#9ca3af";
                                }
                              }}
                              onMouseUp={(e) => {
                                e.currentTarget.style.backgroundColor =
                                  "#e5e7eb";
                              }}
                              disabled={
                                (supplement.takenCount || 0) <= 0 ||
                                showFeedback
                              }
                              className="flex-none w-8 h-8 p-0 text-gray-600 border-r border-gray-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-l-full shadow-inner hover:shadow-md"
                              style={{
                                backgroundColor: "#e5e7eb",
                                boxShadow:
                                  "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
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
                              onLoad={(e) => {
                                // 読み込み時に右端にスクロールする
                                const div = e.currentTarget;
                                div.scrollLeft = div.scrollWidth;
                              }}
                              onWheel={(e) => {
                                // Shiftキーを押しながらのホイールは横スクロール
                                if (e.shiftKey) return;

                                // ホイールイベントを横スクロールに変換
                                e.preventDefault();
                                const container = e.currentTarget;

                                // スクロール速度を調整（deltaModifier）
                                const deltaModifier = 2;
                                container.scrollLeft +=
                                  e.deltaY * deltaModifier;
                              }}
                            >
                              <div
                                className="flex items-center gap-1 w-full justify-end pl-2 pr-1"
                                style={{
                                  minWidth:
                                    (supplement.takenCount || 0) === 0
                                      ? "100%"
                                      : `${Math.max(
                                          (supplement.takenCount || 0) * 30,
                                          100
                                        )}px`,
                                }}
                              >
                                {(supplement.takenCount || 0) === 0 ? (
                                  <div className="text-sm text-gray-500 flex items-center mx-auto px-2">
                                    未服用
                                  </div>
                                ) : (
                                  Array.from({
                                    length: supplement.takenCount || 0,
                                  }).map((_, index) => (
                                    <div
                                      key={index}
                                      className="flex-none w-6 h-6 bg-orange-400 text-white rounded-full flex items-center justify-center text-xs font-medium shadow-sm"
                                      aria-label={`${index + 1}回目の服用`}
                                    >
                                      {index + 1}
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>

                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                if (
                                  !showFeedback &&
                                  (supplement.dosage_left ??
                                    supplement.dosage) >=
                                    supplement.intake_amount
                                ) {
                                  handleIncreaseDosageCount(supplement.id);
                                }
                              }}
                              onMouseOver={(e) => {
                                if (
                                  !showFeedback &&
                                  (supplement.dosage_left ??
                                    supplement.dosage) >=
                                    supplement.intake_amount
                                ) {
                                  e.currentTarget.style.backgroundColor =
                                    "#d1d5db";
                                }
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.backgroundColor =
                                  "#e5e7eb";
                              }}
                              onMouseDown={(e) => {
                                if (
                                  !showFeedback &&
                                  (supplement.dosage_left ??
                                    supplement.dosage) >=
                                    supplement.intake_amount
                                ) {
                                  e.currentTarget.style.backgroundColor =
                                    "#9ca3af";
                                }
                              }}
                              onMouseUp={(e) => {
                                e.currentTarget.style.backgroundColor =
                                  "#e5e7eb";
                              }}
                              disabled={
                                showFeedback ||
                                (supplement.dosage_left ?? supplement.dosage) <
                                  supplement.intake_amount
                              }
                              className="flex-none w-8 h-8 p-0 text-gray-600 border-l border-gray-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-r-full shadow-inner hover:shadow-md"
                              style={{
                                backgroundColor: "#e5e7eb",
                                boxShadow:
                                  "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
                              }}
                              aria-label="服用回数を増やす"
                            >
                              <MdAdd size={16} />
                            </button>
                          </div>
                        </div>

                        {supplement.daily_target_count &&
                          supplement.daily_target_count > 0 && (
                            <div className="text-xs text-gray-500 text-right">
                              目標: {supplement.takenCount || 0} /{" "}
                              {supplement.daily_target_count} 回
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                </AnimatedCardContent>

                <AnimatedCardFooter className="justify-end p-1 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-500 text-gray-700 py-1 px-2 text-xs h-auto"
                    onClick={() => handleOpenUpdateModal(supplement)}
                    aria-label={`${supplement.supplement_name}を編集`}
                  >
                    編集
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="border-b border-gray-500 text-gray-700 rounded-none py-1 px-2 text-xs h-auto"
                    onClick={() => handleDeleteSupplement(supplement.id)}
                    aria-label={`${supplement.supplement_name}を削除`}
                  >
                    削除
                  </Button>
                </AnimatedCardFooter>
              </AnimatedCard>
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
            }
          }}
        >
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto sm:max-w-lg md:max-w-xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-gray-800">
                {selectedSupplement ? "サプリ編集" : "サプリ追加"}
              </DialogTitle>
            </DialogHeader>

            <Form {...methods}>
              <form
                className="space-y-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmit(handleAddOrUpdateSupplement)(e);
                }}
                aria-label={
                  selectedSupplement
                    ? "サプリ編集フォーム"
                    : "サプリ追加フォーム"
                }
              >
                <div className="group relative w-full aspect-[3/2] rounded-md bg-gray-200">
                  {!uploadedImage ? (
                    <label className="absolute inset-0 flex flex-col items-center justify-center gap-2 cursor-pointer">
                      <MdAddAPhoto size={64} aria-hidden="true" />
                      <span className="text-[16px]">画像追加</span>
                      <input
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

                <FormField
                  name="supplement_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="supplement_name">サプリ名</FormLabel>
                      <FormControl>
                        <Input
                          id="supplement_name"
                          {...register("supplement_name", {
                            required: "サプリ名は必須です",
                          })}
                          aria-required="true"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    name="dosage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="dosage">内容量</FormLabel>
                        <div className="flex">
                          <Input
                            id="dosage"
                            type="number"
                            className="rounded-r-none"
                            {...register("dosage", {
                              required: "内容量は必須です",
                              valueAsNumber: true,
                              validate: {
                                isNumber: (value) =>
                                  (!isNaN(value) &&
                                    /^\d*\.?\d*$/.test(String(value))) ||
                                  "数値のみ入力可能です",
                              },
                              min: {
                                value: 0,
                                message: "0以上の値を入力してください",
                              },
                            })}
                            aria-label="内容量の数値"
                            aria-required="true"
                            onKeyDown={(e) => {
                              // アルファベットキーの入力を防止
                              if (/^[a-zA-Z]$/.test(e.key)) {
                                e.preventDefault();
                              }
                            }}
                          />
                          <select
                            id="dosage_unit"
                            className="p-2 rounded-r-md border border-input border-l-0 bg-background"
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
                            <option value="粒">粒</option>
                            <option value="カプセル">カプセル</option>
                            <option value="g">g</option>
                            <option value="mg">mg</option>
                            <option value="ml">ml</option>
                            <option value="包">包</option>
                          </select>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    name="intake_amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="intake_amount">
                          一回の服用量
                        </FormLabel>
                        <div className="flex">
                          <Input
                            id="intake_amount"
                            type="number"
                            className="rounded-r-none"
                            {...register("intake_amount", {
                              required: "服用量は必須です",
                              valueAsNumber: true,
                              validate: {
                                isNumber: (value) =>
                                  (!isNaN(value) &&
                                    /^\d*\.?\d*$/.test(String(value))) ||
                                  "数値のみ入力可能です",
                              },
                              min: {
                                value: 0,
                                message: "0以上の値を入力してください",
                              },
                            })}
                            aria-label="一回の服用量の数値"
                            aria-required="true"
                            onKeyDown={(e) => {
                              // アルファベットキーの入力を防止
                              if (/^[a-zA-Z]$/.test(e.key)) {
                                e.preventDefault();
                              }
                            }}
                          />
                          <select
                            id="intake_unit"
                            className="p-2 rounded-r-md border border-input border-l-0 bg-background"
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
                            <option value="粒">粒</option>
                            <option value="カプセル">カプセル</option>
                            <option value="g">g</option>
                            <option value="mg">mg</option>
                            <option value="ml">ml</option>
                            <option value="包">包</option>
                          </select>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={methods.control}
                  name="dosage_method"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>服用管理方法</FormLabel>
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="timing_method"
                            value="timing"
                            checked={selectedDosageMethod === "timing"}
                            onChange={(e) => {
                              setSelectedDosageMethod("timing");
                              field.onChange(e);
                            }}
                            className="w-4 h-4 accent-orange-400"
                          />
                          <Label htmlFor="timing_method">
                            タイミングベース（朝・昼・夜など）
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="count_method"
                            value="count"
                            checked={selectedDosageMethod === "count"}
                            onChange={(e) => {
                              setSelectedDosageMethod("count");
                              field.onChange(e);
                            }}
                            className="w-4 h-4 accent-orange-400"
                          />
                          <Label htmlFor="count_method">
                            回数ベース（1日の服用回数）
                          </Label>
                        </div>
                      </div>
                    </FormItem>
                  )}
                />

                {selectedDosageMethod === "timing" && (
                  <>
                    <FormItem role="group" aria-labelledby="timing-label">
                      <FormLabel id="timing-label">時間帯</FormLabel>
                      <div className="flex flex-wrap gap-5 pt-2">
                        <Label
                          htmlFor="timing_morning"
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <input
                            id="timing_morning"
                            className="w-4 h-4 rounded accent-orange-400"
                            type="checkbox"
                            {...register("timing_morning")}
                          />
                          朝
                        </Label>
                        <Label
                          htmlFor="timing_noon"
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <input
                            id="timing_noon"
                            className="w-4 h-4 rounded accent-orange-400"
                            type="checkbox"
                            {...register("timing_noon")}
                          />
                          昼
                        </Label>
                        <Label
                          htmlFor="timing_night"
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <input
                            id="timing_night"
                            className="w-4 h-4 rounded accent-orange-400"
                            type="checkbox"
                            {...register("timing_night")}
                          />
                          夜
                        </Label>
                      </div>
                    </FormItem>

                    <FormItem role="group" aria-labelledby="meal-label">
                      <FormLabel id="meal-label">食事関連</FormLabel>
                      <div className="flex flex-wrap gap-5 pt-2">
                        <Label
                          htmlFor="timing_before_meal"
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <input
                            id="timing_before_meal"
                            className="w-4 h-4 rounded accent-orange-400"
                            type="checkbox"
                            {...register("timing_before_meal")}
                          />
                          食前
                        </Label>
                        <Label
                          htmlFor="timing_after_meal"
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <input
                            id="timing_after_meal"
                            className="w-4 h-4 rounded accent-orange-400"
                            type="checkbox"
                            {...register("timing_after_meal")}
                          />
                          食後
                        </Label>
                        <Label
                          htmlFor="timing_empty_stomach"
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <input
                            id="timing_empty_stomach"
                            className="w-4 h-4 rounded accent-orange-400"
                            type="checkbox"
                            {...register("timing_empty_stomach")}
                          />
                          空腹時
                        </Label>
                        <Label
                          htmlFor="timing_bedtime"
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <input
                            id="timing_bedtime"
                            className="w-4 h-4 rounded accent-orange-400"
                            type="checkbox"
                            {...register("timing_bedtime")}
                          />
                          就寝前
                        </Label>
                      </div>
                    </FormItem>
                  </>
                )}

                {selectedDosageMethod === "count" && (
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
                            type="number"
                            onChange={field.onChange}
                            value={field.value}
                            defaultValue={1}
                            className="w-24"
                            min={1}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                )}

                <DialogFooter>
                  <Button
                    type="submit"
                    className="w-full bg-orange-400 hover:bg-orange-500 text-white"
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
