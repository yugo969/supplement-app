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
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<FormData>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [supplements, setSupplements] = useState<any[]>([]);
  const [selectedSupplement, setSelectedSupplement] = useState<null | any>(
    null
  );

  const { showNotification } = useNotification();

  // 服用タイミングのボタンを押したときの処理
  const handleTakeDose = async (supplementId: string, timing: string) => {
    const supplement = supplements.find((s) => s.id === supplementId);
    if (!supplement) return;

    const currentTakenTimings = supplement.takenTimings || {
      morning: false,
      noon: false,
      night: false,
    };

    const timingKey = timing as keyof typeof currentTakenTimings;

    // トグル状態の変更
    currentTakenTimings[timingKey] = !currentTakenTimings[timingKey];

    // 内容量の計算
    let newDosage = supplement.dosage;

    if (currentTakenTimings[timingKey]) {
      // 服用した場合、内容量を減らす
      newDosage -= supplement.intake_amount;
    } else {
      // 取り消した場合、内容量を戻す
      newDosage += supplement.intake_amount;
    }

    // 内容量が負の数にならないようにチェック
    if (newDosage < 0) newDosage = 0;

    // Firebaseを更新
    await updateSupplementDosage(supplementId, newDosage, currentTakenTimings);

    // ローカルの状態を更新
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

  const handleAddOrUpdateSupplement = async (data: FormData) => {
    const dosage = Number(data.dosage);
    const intake_amount = Number(data.intake_amount);
    let imageUrl = uploadedImage;
    if (data.image && data.image[0]) {
      imageUrl = await uploadImage(data.image[0]);
    }

    const supplementData = { ...data, dosage, intake_amount, imageUrl }; // 画像のURLを含むデータを作成
    if ("image" in supplementData) {
      delete supplementData.image; // imageキーを削除
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

    getSupplements()
      .then((data) => {
        setSupplements(data);
      })
      .catch(() => {});
  };

  const handleOpenUpdateModal = (supplement: SupplementData) => {
    setSelectedSupplement(supplement);
    setIsModalOpen(true);

    // 選択されたサプリの情報をフォームにセット
    setValue("supplement_name", supplement.supplement_name);
    setValue("dosage", supplement.dosage);
    setValue("dosage_unit", supplement.dosage_unit);
    setValue("intake_amount", supplement.intake_amount);
    setValue("intake_unit", supplement.intake_unit);
    setValue("timing_morning", supplement.timing_morning);
    setValue("timing_noon", supplement.timing_noon);
    setValue("timing_night", supplement.timing_night);
    // すでに登録されている画像URLをuploadedImageに設定
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

  // サプリメント画像の操作
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

  // const user = firebase.auth().currentUser;
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
      <button
        className={`fixed flex flex-col justify-center items-center w-24 h-24 bottom-6 right-4 z-10 md:hidden ${
          isModalOpen && "hidden"
        } text-[10px] shadow-lg shadow-slate-500 p-2 text-orange-950 font-semibold rounded-full bg-white/70`}
        onClick={() => setIsModalOpen(true)}
      >
        <MdOutlineAddBox size={64} />
        <span>サプリ追加</span>
      </button>
      <div className="relative flex flex-col w-screen h-full md:p-10 p-4 gap-6">
        <div className="flex md:sticky md:top-2 bg-white/80 z-10 justify-between items-center rounded-md shadow-md shadow-slate-400 md:p-6 p-3">
          <h2 className="flex items-center sm:gap-2 text-gray-600 md:text-xl text-lg">
            <MdOutlineMedication size={40} />
            <span className="font-bold leading-6">サプリ KEEPER</span>
          </h2>
          <div className="flex gap-3">
            <button
              className="flex justify-between items-center gap-2 py-2 md:px-4 px-3 text-orange-400 font-semibold rounded-md border border-orange-400 bg-white md:flex max-md:hidden hover:opacity-60 duration-100 shadow-sm hover:shadow-none shadow-black"
              onClick={() => setIsModalOpen(true)}
            >
              <span>サプリ追加</span>
              <MdOutlineAddBox size={24} />
            </button>
            <button
              className="py-1 md:px-4 px-3 text-sm text-gray-500 rounded-md border border-gray-400 hover:opacity-60 duration-100 break-keep"
              onClick={handleLogout}
            >
              ログアウト
            </button>
          </div>
        </div>

        {/* <div className="flex flex-col"> */}
        <div className="grid md:grid-cols-[repeat(auto-fill,356px)] grid-cols-1 justify-center gap-6">
          {/* <div className="flex flex-wrap gap-6"> */}
          {supplements.map((supplement) => (
            <div
              key={supplement.id}
              className="flex flex-col justify-between gap-3 w-full pb-2 rounded-lg border-2 border-white bg-zinc-50 shadow-slate-300 shadow-md"
            >
              <div className="flex flex-col gap-3">
                <div>
                  {/* 画像を表示 */}
                  {supplement.imageUrl ? (
                    <div className="relative w-full h-auto aspect-[3/2]">
                      <Image
                        src={supplement.imageUrl}
                        alt={supplement.supplement_name}
                        fill
                        className="inset-0 w-full h-full rounded-t"
                        style={{
                          // objectFit: 'contain',
                          objectFit: "cover",
                        }}
                      />
                    </div>
                  ) : (
                    <p className="flex justify-center items-center w-full text-black/50 text-[24px] aspect-[3/2] bg-gray-400">
                      no-image
                    </p>
                  )}

                  <div className="text-center break-all">
                    <h3 className="py-1 px-4 bg-gray-700 text-bold text-16px text-white rounded-b-[40px]">
                      {supplement.supplement_name}
                    </h3>
                  </div>
                </div>

                <div className="flex flex-col gap-4 py-3 px-4">
                  <div className="flex flex-row gap-5">
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
                    <p className="p-2 flex gap-2 md:text-xs text-base text-black-950 font-regular">
                      {supplement.timing_morning && (
                        <button
                          onClick={() =>
                            handleTakeDose(supplement.id, "morning")
                          }
                          className={`shadow-md hover:shadow-inner hover:opacity-60 rounded-full flex py-1 px-4
                                ${
                                  supplement.takenTimings?.morning
                                    ? "from-cyan-400 to-orange-400 bg-gradient-to-tr"
                                    : "border border-orange-400"
                                }
                              `}
                        >
                          朝 {supplement.takenTimings?.morning ? "✔" : ""}
                        </button>
                      )}

                      {supplement.timing_noon && (
                        <button
                          onClick={() => handleTakeDose(supplement.id, "noon")}
                          className={`shadow-md hover:shadow-inner hover:opacity-60 rounded-full flex py-1 px-4
                                ${
                                  supplement.takenTimings?.noon
                                    ? "bg-orange-400"
                                    : "border border-orange-400"
                                }
                              `}
                        >
                          昼 {supplement.takenTimings?.noon ? "✔" : ""}
                        </button>
                      )}
                      {supplement.timing_night && (
                        <button
                          onClick={() => handleTakeDose(supplement.id, "night")}
                          className={`shadow-md hover:shadow-inner hover:opacity-60 rounded-full flex py-1 px-4
                                ${
                                  supplement.takenTimings?.night
                                    ? "from-cyan-400 to-orange-400 bg-gradient-to-bl"
                                    : "border border-orange-400"
                                }
                              `}
                        >
                          夜 {supplement.takenTimings?.night ? "✔" : ""}
                        </button>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-sm flex gap-3 self-end px-2">
                <button
                  className=" py-1 px-5 rounded-sm border border-gray-500"
                  onClick={() => handleOpenUpdateModal(supplement)}
                >
                  編集
                </button>
                <button
                  className="py-2 px-3 border-b border-gray-500"
                  onClick={() => handleDeleteSupplement(supplement.id)}
                >
                  削除
                </button>
              </div>
            </div>
          ))}
          {/* </div> */}
        </div>
      </div>
      {isModalOpen && (
        <div
          className="modal overscroll-none overflow-auto bg-black/80 w-screen h-full fixed top-0 bottom-0 left-0 right-0 flex justify-center items-center z-10"
          onClick={() => {
            setIsModalOpen(false);
            setSelectedSupplement(null);
          }}
        >
          <form
            className="relative flex flex-col md:w-fit w-[calc(100vw-32px)] h-fit gap-4 md:gap-6 md:py-8 md:px-20 pt-3 p-4 md:p-6 bg-zinc-500 rounded-lg"
            onSubmit={(e) => {
              e.preventDefault(); // ページのリロードを防ぐ
              handleSubmit(handleAddOrUpdateSupplement)(e);
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="group relative w-full aspect-[3/2] rounded-md bg-gray-200">
              {!uploadedImage ? (
                <label className="absolute inset-0 flex flex-col items-center justify-center gap-2 cursor-pointer">
                  <MdAddAPhoto size={64} />
                  <span className="text-[16px]">画像追加</span>
                  <input
                    type="file"
                    {...register("image")}
                    onChange={handleImageChange}
                    className="opacity-0 absolute inset-0 w-full h-full"
                  />
                </label>
              ) : (
                <div className="relative w-full h-full">
                  <Image
                    src={uploadedImage}
                    alt="Uploaded"
                    fill
                    className="absolute inset-0 w-full h-full"
                    style={{
                      objectFit: "cover",
                    }}
                  />
                  <div className="absolute right-1 bottom-1 w-14 h-14 rounded-full transition duration-300 group-hover:opacity-100 bg-black/70 border-white">
                    <button
                      className="flex flex-col justify-center items-center gap-0.5 opacity-100 transition duration-300 group-hover:opacity-100 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-[22px] w-10 h-10 rounded"
                      onClick={handleImageDelete}
                    >
                      <MdDeleteForever size={60} />
                      <span className="text-[12px]">削除</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col">
              <label htmlFor="supplement-name">サプリ名</label>
              <input
                type="text"
                id="supplement-name"
                {...register("supplement_name", { required: true })}
              />
            </div>

            <div>
              <label htmlFor="dosage">内容量</label>
              <div className="flex">
                <input
                  className="w-full rounded-r-none border-gray-400"
                  style={{ borderRight: "1px inset" }}
                  type="number"
                  id="dosage"
                  {...register("dosage")}
                />
                <select
                  className="rounded-l-none rounded-r-md"
                  defaultValue={""}
                  {...register("dosage_unit")}
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
            </div>

            <div>
              <label htmlFor="intake-amount">一回の服用量</label>
              <div className="flex">
                <input
                  className="w-full rounded-l-md rounded-r-none border-gray-400"
                  style={{ borderRight: "1px inset" }}
                  type="number"
                  id="intake-amount"
                  {...register("intake_amount")}
                />
                <select
                  className="rounded-l-none rounded-r-md"
                  defaultValue={""}
                  {...register("intake_unit")}
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
            </div>

            <div>
              <label>服用タイミング:</label>
              <div className="flex gap-5">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    className="w-6 h-auto"
                    type="checkbox"
                    {...register("timing_morning")}
                  />
                  朝
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" {...register("timing_noon")} />昼
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" {...register("timing_night")} />夜
                </label>
              </div>
            </div>

            <button
              className="p-2 rounded-md font-semibold text-gray-700 bg-orange-300"
              type="submit"
            >
              {selectedSupplement ? "編集" : "登録"}
            </button>
            <button
              className="flex gap-2 absolute items-center self-center md:self-auto w-fit -right-3 md:right-4 -top-2 md:top-4 text-white/80 md:w-8 h-8 rounded-full"
              onClick={() => {
                setIsModalOpen(false);
                setSelectedSupplement(null);
              }}
            >
              <MdCancel
                color="#fff"
                size={32}
                className="drop-shadow-[1px_1px_4px_rgba(0,0,0,0.6)]"
              />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
