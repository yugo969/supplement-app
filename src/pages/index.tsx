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
} from "@/lib/firestore";
import { useEffect, useState } from "react";
import {
  MdAddAPhoto,
  MdDeleteForever,
  MdCancel,
  MdOutlineCancel,
  MdOutlineMedication,
  MdOutlineAddBox,
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

type FormData = {
  supplement_name: string;
  dosage: number; // 数値型に変更
  dosage_unit: string;
  intake_amount: number; // 数値型に変更
  intake_unit: string;
  timing_morning: boolean;
  timing_noon: boolean;
  timing_night: boolean;
  image?: FileList;
  // 服用状況を管理するフィールド
  takenTimings?: {
    morning: boolean;
    noon: boolean;
    night: boolean;
  };
};

type SupplementData = FormData & {
  imageUrl: string;
  dosage_left?: number; // 服用状況更新後の残量
};

const maxWidth = 552;
const maxHeight = 366;

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

  const handleTakeDose = async (supplementId: string, timing: string) => {
    const supplement = supplements.find((s) => s.id === supplementId);
    if (!supplement) return;

    const timingId = `${supplementId}-${timing}`;

    if (animatingIds.includes(timingId)) return;

    const currentTakenTimings = supplement.takenTimings || {
      morning: false,
      noon: false,
      night: false,
    };

    const timingKey = timing as keyof typeof currentTakenTimings;

    if (currentTakenTimings[timingKey]) {
      handleUpdateSupplementTiming(supplementId, timing, false);
      return;
    }

    const dosageLeft = supplement.dosage_left ?? supplement.dosage;
    if (dosageLeft <= 0 || dosageLeft < supplement.intake_amount) {
      return;
    }

    setShowFeedback(false);

    setTimeout(() => {
      setAnimatingIds((prev) => [...prev, timingId]);
      setFeedbackTimingId(timingId);
      setShowFeedback(true);
    }, 10);
  };

  const handleFeedbackComplete = () => {
    if (!feedbackTimingId) return;

    setShowFeedback(false);

    const [supplementId, timing] = feedbackTimingId.split("-");

    const timingIdCopy = feedbackTimingId;
    setFeedbackTimingId(null);

    setTimeout(() => {
      handleUpdateSupplementTiming(supplementId, timing, true);

      setAnimatingIds((prev) => prev.filter((id) => id !== timingIdCopy));
    }, 50);
  };

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

  const { user, loading } = useAuth();

  useEffect(() => {
    if (user) {
      getSupplements().then((data) => setSupplements(data));
    }
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
      timing_morning: false,
      timing_noon: false,
      timing_night: false,
    });
    setUploadedImage(null);
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

    setValue("supplement_name", supplement.supplement_name);
    setValue("dosage", supplement.dosage);
    setValue("dosage_unit", supplement.dosage_unit);
    setValue("intake_amount", supplement.intake_amount);
    setValue("intake_unit", supplement.intake_unit);
    setValue("timing_morning", supplement.timing_morning);
    setValue("timing_noon", supplement.timing_noon);
    setValue("timing_night", supplement.timing_night);
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
                    <h2 className="py-1 px-4 bg-gray-700 text-bold text-16px text-white rounded-b-[40px]">
                      {supplement.supplement_name}
                    </h2>
                  </div>
                </AnimatedCardHeader>

                <AnimatedCardContent className="flex flex-col gap-4 py-3 px-4">
                  <div className="flex flex-row flex-wrap gap-5">
                    <div className="">
                      <div className="flex border-b-2">
                        <span className="text-[12px] border-gray-300 flex">
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
                        <span className="text-[12px] border-gray-300 flex">
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
                  <div className="flex flex-col md:gap-2 gap-2">
                    <span className="flex-col-reverse text-xs border-gray-300 flex grow">
                      服用タイミング
                    </span>
                    <div className="p-2 flex flex-wrap gap-2 md:text-xs text-base text-black-950 font-regular">
                      {supplement.timing_morning && (
                        <AnimatedButton
                          id={`${supplement.id}-morning`}
                          onClick={() =>
                            handleTakeDose(supplement.id, "morning")
                          }
                          disabled={
                            showFeedback ||
                            animatingIds.includes(`${supplement.id}-morning`) ||
                            (!supplement.takenTimings?.morning &&
                              ((supplement.dosage_left ?? supplement.dosage) <=
                                0 ||
                                (supplement.dosage_left ?? supplement.dosage) <
                                  supplement.intake_amount))
                          }
                          checked={supplement.takenTimings?.morning || false}
                          label="朝"
                          aria-label={`朝 ${
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
                          onClick={() => handleTakeDose(supplement.id, "noon")}
                          disabled={
                            showFeedback ||
                            animatingIds.includes(`${supplement.id}-noon`) ||
                            (!supplement.takenTimings?.noon &&
                              ((supplement.dosage_left ?? supplement.dosage) <=
                                0 ||
                                (supplement.dosage_left ?? supplement.dosage) <
                                  supplement.intake_amount))
                          }
                          checked={supplement.takenTimings?.noon || false}
                          label="昼"
                          aria-label={`昼 ${
                            supplement.takenTimings?.noon
                              ? "服用済み"
                              : "未服用"
                          }`}
                          aria-pressed={supplement.takenTimings?.noon || false}
                        />
                      )}
                      {supplement.timing_night && (
                        <AnimatedButton
                          id={`${supplement.id}-night`}
                          onClick={() => handleTakeDose(supplement.id, "night")}
                          disabled={
                            showFeedback ||
                            animatingIds.includes(`${supplement.id}-night`) ||
                            (!supplement.takenTimings?.night &&
                              ((supplement.dosage_left ?? supplement.dosage) <=
                                0 ||
                                (supplement.dosage_left ?? supplement.dosage) <
                                  supplement.intake_amount))
                          }
                          checked={supplement.takenTimings?.night || false}
                          label="夜"
                          aria-label={`夜 ${
                            supplement.takenTimings?.night
                              ? "服用済み"
                              : "未服用"
                          }`}
                          aria-pressed={supplement.takenTimings?.night || false}
                        />
                      )}
                    </div>
                  </div>
                </AnimatedCardContent>

                <AnimatedCardFooter className="justify-end p-2 gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-500 text-gray-700"
                    onClick={() => handleOpenUpdateModal(supplement)}
                    aria-label={`${supplement.supplement_name}を編集`}
                  >
                    編集
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="border-b border-gray-500 text-gray-700 rounded-none px-3"
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
                            {...register("dosage")}
                            aria-label="内容量の数値"
                          />
                          <select
                            id="dosage_unit"
                            className="p-2 rounded-r-md border border-input border-l-0 bg-background"
                            defaultValue={""}
                            {...register("dosage_unit")}
                            aria-label="内容量の単位"
                          >
                            <option value="" disabled>
                              単位
                            </option>
                            <option value="錠" selected>
                              錠
                            </option>
                            <option value="g">g</option>
                            <option value="ml">ml</option>
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
                            {...register("intake_amount")}
                            aria-label="一回の服用量の数値"
                          />
                          <select
                            id="intake_unit"
                            className="p-2 rounded-r-md border border-input border-l-0 bg-background"
                            defaultValue={""}
                            {...register("intake_unit")}
                            aria-label="一回の服用量の単位"
                          >
                            <option value="" disabled>
                              単位
                            </option>
                            <option value="錠" selected>
                              錠
                            </option>
                            <option value="g">g</option>
                            <option value="ml">ml</option>
                          </select>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <FormItem role="group" aria-labelledby="timing-label">
                  <FormLabel id="timing-label">服用タイミング</FormLabel>
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
