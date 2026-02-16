import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { UseFormReturn } from "react-hook-form";
import {
  MdAddAPhoto,
  MdDeleteForever,
  MdInfoOutline,
  MdExpandLess,
  MdCheck,
  MdEdit,
} from "react-icons/md";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  SupplementFormData,
  SupplementData,
  DosageMethod,
  SupplementGroup,
} from "@/schemas/supplement";
import { motion } from "framer-motion";
import ImageCropDialog from "@/components/ImageCropDialog";
import { GROUP_NAME_MAX_LENGTH } from "@/constants/groups";
import { TIMING_ICONS } from "@/components/timing-icons";
interface SupplementFormProps {
  isOpen: boolean;
  onClose: () => void;
  methods: UseFormReturn<SupplementFormData>;
  selectedSupplement: SupplementData | null;
  uploadedImage: string | null;
  selectedUnit: string;
  selectedDosageMethod: DosageMethod;
  showInfoDetails: boolean;
  availableGroups: SupplementGroup[];
  selectedGroupIds: string[];
  onSelectGroup: (groupId: string) => void;
  onRemoveGroup: (groupId: string) => void;
  onCreateGroup: (name: string) => Promise<boolean>;
  onSubmit: (data: SupplementFormData) => void;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImageDelete: () => void;
  onImageUpdate: (croppedImageUrl: string) => void;
  onUnitChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onDosageMethodChange: (method: DosageMethod) => void;
  onToggleInfoDetails: () => void;
}

const SupplementForm: React.FC<SupplementFormProps> = ({
  isOpen,
  onClose,
  methods,
  selectedSupplement,
  uploadedImage,
  selectedUnit,
  selectedDosageMethod,
  showInfoDetails,
  availableGroups,
  selectedGroupIds,
  onSelectGroup,
  onRemoveGroup,
  onCreateGroup,
  onSubmit,
  onImageChange,
  onImageDelete,
  onImageUpdate,
  onUnitChange,
  onDosageMethodChange,
  onToggleInfoDetails,
}) => {
  const {
    register,
    formState: { errors },
    setValue,
  } = methods;

  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);
  const [groupSelectValue, setGroupSelectValue] = useState("");
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [isSubmittingGroup, setIsSubmittingGroup] = useState(false);
  const groupInputAreaRef = useRef<HTMLDivElement | null>(null);
  const createGroupInputRef = useRef<HTMLInputElement | null>(null);
  const selectedGroups = availableGroups.filter((group) =>
    selectedGroupIds.includes(group.id)
  );
  const NEW_GROUP_OPTION_VALUE = "__new_group__";
  const newGroupNameLength = Array.from(newGroupName.trim()).length;
  const isGroupNameTooLong = newGroupNameLength > GROUP_NAME_MAX_LENGTH;

  const handleCreateGroup = async () => {
    const trimmedName = newGroupName.trim();
    if (!trimmedName || isSubmittingGroup || isGroupNameTooLong) return;

    setIsSubmittingGroup(true);
    try {
      const created = await onCreateGroup(trimmedName);
      if (created) {
        setNewGroupName("");
        setIsCreatingGroup(false);
      }
    } finally {
      setIsSubmittingGroup(false);
    }
  };

  useEffect(() => {
    if (!isCreatingGroup) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (
        groupInputAreaRef.current &&
        !groupInputAreaRef.current.contains(event.target as Node)
      ) {
        setIsCreatingGroup(false);
        setNewGroupName("");
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isCreatingGroup]);

  useEffect(() => {
    if (!isCreatingGroup) return;
    createGroupInputRef.current?.focus();
  }, [isCreatingGroup]);

  return (
    <>
      <ImageCropDialog
        isOpen={isCropDialogOpen}
        imageSrc={uploadedImage || ""}
        onClose={() => setIsCropDialogOpen(false)}
        onCropComplete={(croppedImageUrl) => {
          onImageUpdate(croppedImageUrl);
          setIsCropDialogOpen(false);
        }}
      />

      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            onClose();
          }
        }}
      >
        <DialogContent
          className="max-w-md sm:max-w-lg md:max-w-xl"
          aria-describedby="supplement-form-description"
        >
          <DialogTitle className="sr-only">
            {selectedSupplement ? "サプリ編集" : "サプリ追加"}
          </DialogTitle>
          <DialogDescription
            id="supplement-form-description"
            className="sr-only"
          >
            サプリ情報の入力と画像設定を行うダイアログです。
          </DialogDescription>
          <Form {...methods}>
            <form
              className="space-y-6"
              onSubmit={methods.handleSubmit(onSubmit)}
              aria-label={
                selectedSupplement ? "サプリ編集フォーム" : "サプリ追加フォーム"
              }
            >
              {/* 画像アップロード部分 */}
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
                      onChange={onImageChange}
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
                      sizes="(max-width: 768px) 100vw, 640px"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute right-2 bottom-2 flex gap-2">
                      <button
                        className="flex flex-col justify-center items-center gap-0.5 w-14 h-14 rounded-full transition duration-300 bg-black/70 hover:bg-black/80 text-white"
                        onClick={() => setIsCropDialogOpen(true)}
                        type="button"
                        aria-label="画像を編集"
                      >
                        <MdEdit size={20} aria-hidden="true" />
                        <span className="text-[10px] font-medium">編集</span>
                      </button>
                      <button
                        className="flex flex-col justify-center items-center gap-0.5 w-14 h-14 rounded-full transition duration-300 bg-black/70 hover:bg-black/80 text-white"
                        onClick={onImageDelete}
                        type="button"
                        aria-label="画像を削除"
                      >
                        <MdDeleteForever size={20} aria-hidden="true" />
                        <span className="text-[10px] font-medium">削除</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 基本情報入力 */}
              <div className="space-y-4">
                <FormField
                  control={methods.control}
                  name="supplement_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="supplement_name">サプリ名</FormLabel>
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

                <div className="space-y-2">
                  <Label htmlFor="supplement_group_select">グループ</Label>
                  <div className="flex gap-2" ref={groupInputAreaRef}>
                    {!isCreatingGroup ? (
                      <div className="relative flex-1">
                        <select
                          id="supplement_group_select"
                          className="w-full p-2 pr-8 rounded-md border border-input bg-background focus:ring-2 focus:ring-gray-500 focus:border-gray-500 focus:outline-none appearance-none cursor-pointer"
                          value={groupSelectValue}
                          onChange={(e) => {
                            const groupId = e.target.value;
                            if (!groupId) {
                              setGroupSelectValue("");
                              return;
                            }
                            if (groupId === NEW_GROUP_OPTION_VALUE) {
                              setIsCreatingGroup(true);
                              setGroupSelectValue("");
                              return;
                            }
                            onSelectGroup(groupId);
                            setGroupSelectValue("");
                          }}
                        >
                          <option value="">グループを選択</option>
                          <option value={NEW_GROUP_OPTION_VALUE}>
                            + 新規追加
                          </option>
                          {availableGroups.map((group) => (
                            <option key={group.id} value={group.id}>
                              {group.name}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 12 12"
                            fill="currentColor"
                          >
                            <path d="M6 9L1 4h10z" />
                          </svg>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Input
                          id="supplement_group_create"
                          ref={createGroupInputRef}
                          value={newGroupName}
                          onChange={(e) => setNewGroupName(e.target.value)}
                          placeholder={`新しいグループ名を入力（${GROUP_NAME_MAX_LENGTH}文字以内）`}
                          className="flex-1"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              void handleCreateGroup();
                            }
                          }}
                        />
                        <Button
                          type="button"
                          onClick={() => void handleCreateGroup()}
                          disabled={
                            !newGroupName.trim() ||
                            isSubmittingGroup ||
                            isGroupNameTooLong
                          }
                        >
                          追加
                        </Button>
                        <p
                          className={`self-center text-xs ${
                            isGroupNameTooLong
                              ? "text-red-600 font-medium"
                              : "text-gray-500"
                          }`}
                        >
                          {newGroupNameLength}/{GROUP_NAME_MAX_LENGTH}
                        </p>
                      </>
                    )}
                  </div>
                  {isCreatingGroup && isGroupNameTooLong && (
                    <p className="text-xs text-red-600">
                      グループ名は{GROUP_NAME_MAX_LENGTH}
                      文字以内で入力してください
                    </p>
                  )}

                  {selectedGroups.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {selectedGroups.map((group) => (
                        <button
                          key={group.id}
                          type="button"
                          className="flex-none px-2 py-1 text-xs rounded-full border border-gray-300 bg-gray-100 text-gray-700"
                          onClick={() => onRemoveGroup(group.id)}
                          aria-label={`${group.name}をグループから外す`}
                        >
                          {group.name} ×
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-4">
                  <FormField
                    control={methods.control}
                    name="dosage"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel htmlFor="dosage">内容量</FormLabel>
                        <div className="flex">
                          <Input
                            id="dosage"
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            className="rounded-r-none text-center"
                            value={field.value?.toString() || ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(value === "" ? "" : value);
                            }}
                            aria-label="サプリメント全体の内容量の数値"
                            aria-required="true"
                            placeholder="数値を入力"
                          />
                          <div className="relative">
                            <select
                              id="dosage_unit"
                              className="p-2 pr-8 rounded-r-md border border-input border-l-0 bg-background focus:ring-2 focus:ring-gray-500 focus:border-gray-500 focus:outline-none appearance-none cursor-pointer"
                              value={selectedUnit}
                              {...register("dosage_unit", {
                                required: "単位は必須です",
                              })}
                              onChange={onUnitChange}
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
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 12 12"
                                fill="currentColor"
                              >
                                <path d="M6 9L1 4h10z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={methods.control}
                    name="intake_amount"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel htmlFor="intake_amount">
                          一回の服用量
                        </FormLabel>
                        <div className="flex">
                          <Input
                            id="intake_amount"
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            className="rounded-r-none text-center"
                            value={field.value?.toString() || ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(value === "" ? "" : value);
                            }}
                            aria-label="一回の服用量の数値"
                            aria-required="true"
                            placeholder="数値を入力"
                          />
                          <div className="relative">
                            <select
                              id="intake_unit"
                              className="p-2 pr-8 rounded-r-md border border-input border-l-0 bg-background focus:ring-2 focus:ring-gray-500 focus:border-gray-500 focus:outline-none appearance-none cursor-pointer"
                              value={selectedUnit}
                              {...register("intake_unit", {
                                required: "単位は必須です",
                              })}
                              onChange={onUnitChange}
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
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 12 12"
                                fill="currentColor"
                              >
                                <path d="M6 9L1 4h10z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* 服用管理方法選択 */}
              <FormField
                control={methods.control}
                name="dosage_method"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel id="dosage_method_label">服用管理方法</FormLabel>
                    <RadioGroup
                      id="dosage_method_group"
                      value={field.value}
                      onValueChange={(value) => {
                        onDosageMethodChange(value as DosageMethod);
                        field.onChange(value);
                      }}
                      className="flex justify-center"
                      aria-labelledby="dosage_method_label"
                    >
                      <div className="relative flex w-full max-w-xs rounded-lg bg-gray-100 p-1">
                        {/* スライドインジケーター */}
                        <div
                          className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-md bg-gray-700 shadow-sm transition-transform duration-200 ease-in-out"
                          style={{
                            transform:
                              field.value === "count"
                                ? "translateX(calc(100% + 8px))"
                                : "translateX(0)",
                          }}
                        />
                        <label
                          htmlFor="timing_method"
                          className={`relative z-10 flex-1 flex items-center justify-center px-2 py-2.5 cursor-pointer rounded-md transition-colors text-sm font-medium ${
                            field.value === "timing"
                              ? "text-white"
                              : "text-gray-600 hover:text-gray-800"
                          }`}
                        >
                          <RadioGroupItem
                            value="timing"
                            id="timing_method"
                            className="sr-only"
                          />
                          <span>タイミング</span>
                        </label>
                        <label
                          htmlFor="count_method"
                          className={`relative z-10 flex-1 flex items-center justify-center px-2 py-2.5 cursor-pointer rounded-md transition-colors text-sm font-medium ${
                            field.value === "count"
                              ? "text-white"
                              : "text-gray-600 hover:text-gray-800"
                          }`}
                        >
                          <RadioGroupItem
                            value="count"
                            id="count_method"
                            className="sr-only"
                          />
                          <span>回数</span>
                        </label>
                      </div>
                    </RadioGroup>
                  </FormItem>
                )}
              />

              {/* タイミングベース/回数ベースの切り替え */}
              {selectedDosageMethod === "timing" ? (
                <FormItem>
                  <FormLabel id="timing_group_label" htmlFor="timing_group">
                    時間帯
                  </FormLabel>
                  <div
                    id="timing_group"
                    className="flex flex-wrap gap-2 justify-center"
                    role="group"
                    aria-labelledby="timing_group_label"
                  >
                    <FormField
                      control={methods.control}
                      name="timing_morning"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <input
                              id="timing_morning_input"
                              type="checkbox"
                              checked={!!field.value}
                              onChange={(event) =>
                                field.onChange(event.target.checked)
                              }
                              className="sr-only"
                              aria-label={`朝の服用を${field.value ? "選択解除" : "選択"}`}
                            />
                          </FormControl>
                          <label
                            htmlFor="timing_morning_input"
                            className={`relative flex items-center rounded-full px-3 py-1 text-xs border border-gray-200 cursor-pointer transition-all shadow-sm hover:shadow-md ${
                              field.value
                                ? "bg-white"
                                : "bg-white hover:bg-gray-50"
                            }`}
                          >
                            <span className="text-gray-700 flex items-center gap-1">
                              {TIMING_ICONS.morning}
                            </span>
                            {field.value && (
                              <div className="ml-1.5 flex items-center justify-center w-4 h-4 bg-gray-700 rounded-full">
                                <MdCheck size={12} className="text-white" />
                              </div>
                            )}
                          </label>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={methods.control}
                      name="timing_noon"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <input
                              id="timing_noon_input"
                              type="checkbox"
                              checked={!!field.value}
                              onChange={(event) =>
                                field.onChange(event.target.checked)
                              }
                              className="sr-only"
                              aria-label={`昼の服用を${field.value ? "選択解除" : "選択"}`}
                            />
                          </FormControl>
                          <label
                            htmlFor="timing_noon_input"
                            className={`relative flex items-center rounded-full px-3 py-1 text-xs border border-gray-200 cursor-pointer transition-all shadow-sm hover:shadow-md ${
                              field.value
                                ? "bg-white"
                                : "bg-white hover:bg-gray-50"
                            }`}
                          >
                            <span className="text-gray-700 flex items-center gap-1">
                              {TIMING_ICONS.noon}
                            </span>
                            {field.value && (
                              <div className="ml-1.5 flex items-center justify-center w-4 h-4 bg-gray-700 rounded-full">
                                <MdCheck size={12} className="text-white" />
                              </div>
                            )}
                          </label>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={methods.control}
                      name="timing_night"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <input
                              id="timing_night_input"
                              type="checkbox"
                              checked={!!field.value}
                              onChange={(event) =>
                                field.onChange(event.target.checked)
                              }
                              className="sr-only"
                              aria-label={`夜の服用を${field.value ? "選択解除" : "選択"}`}
                            />
                          </FormControl>
                          <label
                            htmlFor="timing_night_input"
                            className={`relative flex items-center rounded-full px-3 py-1 text-xs border border-gray-200 cursor-pointer transition-all shadow-sm hover:shadow-md ${
                              field.value
                                ? "bg-white"
                                : "bg-white hover:bg-gray-50"
                            }`}
                          >
                            <span className="text-gray-700 flex items-center gap-1">
                              {TIMING_ICONS.night}
                            </span>
                            {field.value && (
                              <div className="ml-1.5 flex items-center justify-center w-4 h-4 bg-gray-700 rounded-full">
                                <MdCheck size={12} className="text-white" />
                              </div>
                            )}
                          </label>
                        </FormItem>
                      )}
                    />
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
                      <div className="flex items-center gap-3">
                        <FormLabel
                          htmlFor="daily_target_count"
                          className="whitespace-nowrap"
                        >
                          1日の服用回数
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
                            className="w-24 text-center"
                            placeholder="数値を入力"
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* 推奨服用方法 */}
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
                      onClick={onToggleInfoDetails}
                      className="inline-flex items-center text-gray-500 hover:text-gray-700 transition-colors ml-1"
                      aria-label={
                        showInfoDetails ? "詳細情報を閉じる" : "詳細情報を表示"
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
                  <div className="mt-1 mb-3 p-3 bg-gray-50 border border-gray-300 rounded-md text-xs overflow-y-auto">
                    <dl className="space-y-3">
                      <div>
                        <dt className="font-semibold text-gray-800 mb-1">
                          食前
                        </dt>
                        <dd className="text-gray-600 leading-relaxed">
                          食事の前に服用することで、効果的に吸収されます。一般的に食事の30分前が推奨されます。
                        </dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-gray-800 mb-1">
                          食後
                        </dt>
                        <dd className="text-gray-600 leading-relaxed">
                          食後に服用することで、胃への刺激を軽減します。食事から30分以内の服用が推奨されます。
                        </dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-gray-800 mb-1">
                          空腹時
                        </dt>
                        <dd className="text-gray-600 leading-relaxed">
                          空腹時（食間）に服用することで、より効率的に吸収されます。食事から2時間以上経過した時間帯が最適です。
                        </dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-gray-800 mb-1">
                          就寝前
                        </dt>
                        <dd className="text-gray-600 leading-relaxed">
                          就寝前に服用することで、体内での作用時間を最大化します。就寝30分前の服用が推奨されます。
                        </dd>
                      </div>
                    </dl>
                  </div>
                )}

                <div
                  id="meal_timing_group"
                  className="flex flex-wrap gap-2 pt-2 justify-center"
                  role="group"
                  aria-labelledby="meal_timing_label"
                >
                  {/* 食前・食後・空腹時の選択肢を排他的にする（ラジオボタン） */}
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
                      setValue("timing_before_meal", value === "before_meal");
                      setValue("timing_after_meal", value === "after_meal");
                      setValue(
                        "timing_empty_stomach",
                        value === "empty_stomach"
                      );
                    }}
                    className="flex flex-wrap gap-2"
                  >
                    <label
                      htmlFor="timing_before_meal_radio"
                      className={`relative flex items-center rounded-full px-3 py-1 text-xs border border-gray-200 cursor-pointer transition-all shadow-sm hover:shadow-md ${
                        methods.watch("meal_timing") === "before_meal"
                          ? "bg-white"
                          : "bg-white hover:bg-gray-50"
                      }`}
                      onMouseDown={(e) => {
                        if (methods.watch("meal_timing") === "before_meal") {
                          e.preventDefault();
                          setValue("meal_timing", "none");
                          setValue("timing_before_meal", false);
                          setValue("timing_after_meal", false);
                          setValue("timing_empty_stomach", false);
                        }
                      }}
                    >
                      <RadioGroupItem
                        value="before_meal"
                        id="timing_before_meal_radio"
                        className="sr-only"
                      />
                      <span className="text-gray-700">食前</span>
                      {methods.watch("meal_timing") === "before_meal" && (
                        <div className="ml-1.5 flex items-center justify-center w-4 h-4 bg-gray-700 rounded-full">
                          <MdCheck size={12} className="text-white" />
                        </div>
                      )}
                    </label>

                    <label
                      htmlFor="timing_after_meal_radio"
                      className={`relative flex items-center rounded-full px-3 py-1 text-xs border border-gray-200 cursor-pointer transition-all shadow-sm hover:shadow-md ${
                        methods.watch("meal_timing") === "after_meal"
                          ? "bg-white"
                          : "bg-white hover:bg-gray-50"
                      }`}
                      onMouseDown={(e) => {
                        if (methods.watch("meal_timing") === "after_meal") {
                          e.preventDefault();
                          setValue("meal_timing", "none");
                          setValue("timing_before_meal", false);
                          setValue("timing_after_meal", false);
                          setValue("timing_empty_stomach", false);
                        }
                      }}
                    >
                      <RadioGroupItem
                        value="after_meal"
                        id="timing_after_meal_radio"
                        className="sr-only"
                      />
                      <span className="text-gray-700">食後</span>
                      {methods.watch("meal_timing") === "after_meal" && (
                        <div className="ml-1.5 flex items-center justify-center w-4 h-4 bg-gray-700 rounded-full">
                          <MdCheck size={12} className="text-white" />
                        </div>
                      )}
                    </label>

                    <label
                      htmlFor="timing_empty_stomach_radio"
                      className={`relative flex items-center rounded-full px-3 py-1 text-xs border border-gray-200 cursor-pointer transition-all shadow-sm hover:shadow-md ${
                        methods.watch("meal_timing") === "empty_stomach"
                          ? "bg-white"
                          : "bg-white hover:bg-gray-50"
                      }`}
                      onMouseDown={(e) => {
                        if (methods.watch("meal_timing") === "empty_stomach") {
                          e.preventDefault();
                          setValue("meal_timing", "none");
                          setValue("timing_before_meal", false);
                          setValue("timing_after_meal", false);
                          setValue("timing_empty_stomach", false);
                        }
                      }}
                    >
                      <RadioGroupItem
                        value="empty_stomach"
                        id="timing_empty_stomach_radio"
                        className="sr-only"
                      />
                      <span className="text-gray-700">空腹時</span>
                      {methods.watch("meal_timing") === "empty_stomach" && (
                        <div className="ml-1.5 flex items-center justify-center w-4 h-4 bg-gray-700 rounded-full">
                          <MdCheck size={12} className="text-white" />
                        </div>
                      )}
                    </label>
                  </RadioGroup>

                  {/* 就寝前と頓服はチェックボックスで個別に選択可能 */}
                  <FormField
                    control={methods.control}
                    name="timing_bedtime"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <label
                            htmlFor="timing_bedtime"
                            className={`relative flex items-center rounded-full px-3 py-1 text-xs border border-gray-200 cursor-pointer transition-all shadow-sm hover:shadow-md ${
                              field.value
                                ? "bg-white"
                                : "bg-white hover:bg-gray-50"
                            }`}
                          >
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              id="timing_bedtime"
                              className="sr-only"
                            />
                            <span className="text-gray-700">就寝前</span>
                            {field.value && (
                              <div className="ml-1.5 flex items-center justify-center w-4 h-4 bg-gray-700 rounded-full">
                                <MdCheck size={12} className="text-white" />
                              </div>
                            )}
                          </label>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={methods.control}
                    name="timing_as_needed"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <label
                            htmlFor="timing_as_needed"
                            className={`relative flex items-center rounded-full px-3 py-1 text-xs border border-gray-200 cursor-pointer transition-all shadow-sm hover:shadow-md ${
                              field.value
                                ? "bg-white"
                                : "bg-white hover:bg-gray-50"
                            }`}
                          >
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              id="timing_as_needed"
                              className="sr-only"
                            />
                            <span className="text-gray-700">頓服</span>
                            {field.value && (
                              <div className="ml-1.5 flex items-center justify-center w-4 h-4 bg-gray-700 rounded-full">
                                <MdCheck size={12} className="text-white" />
                              </div>
                            )}
                          </label>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </FormItem>

              <DialogFooter className="sm:justify-center">
                <Button
                  type="submit"
                  className="w-full max-w-xs bg-gray-700 hover:bg-gray-800 text-white"
                >
                  {selectedSupplement ? "編集" : "登録"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SupplementForm;
