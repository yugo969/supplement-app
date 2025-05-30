import React from "react";
import Image from "next/image";
import { UseFormReturn } from "react-hook-form";
import {
  MdAddAPhoto,
  MdDeleteForever,
  MdInfoOutline,
  MdExpandLess,
} from "react-icons/md";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  SupplementFormData,
  SupplementData,
  DosageMethod,
} from "@/schemas/supplement";

interface SupplementFormProps {
  isOpen: boolean;
  onClose: () => void;
  methods: UseFormReturn<SupplementFormData>;
  selectedSupplement: SupplementData | null;
  uploadedImage: string | null;
  selectedUnit: string;
  selectedDosageMethod: DosageMethod;
  showInfoDetails: boolean;
  onSubmit: (data: SupplementFormData) => void;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImageDelete: () => void;
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
  onSubmit,
  onImageChange,
  onImageDelete,
  onUnitChange,
  onDosageMethodChange,
  onToggleInfoDetails,
}) => {
  const {
    register,
    formState: { errors },
    setValue,
  } = methods;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
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
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute right-1 bottom-1 w-14 h-14 rounded-full transition duration-300 group-hover:opacity-100 bg-black/70 border-white">
                    <button
                      className="flex flex-col justify-center items-center gap-0.5 opacity-100 transition duration-300 group-hover:opacity-100 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-[22px] w-10 h-10 rounded"
                      onClick={onImageDelete}
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

            {/* 基本情報入力 */}
            <div>
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
                    <FormLabel htmlFor="intake_amount">一回の服用量</FormLabel>
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
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
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

            {/* タイミングベース/回数ベースの切り替え */}
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
                      setValue("timing_before_meal", value === "before_meal");
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
                      <Label htmlFor="timing_empty_stomach_radio">空腹時</Label>
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
  );
};

export default SupplementForm;
