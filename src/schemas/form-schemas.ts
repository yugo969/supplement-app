import * as z from "zod";

// 数値フィールド用の共通バリデーション
export const numberFieldSchema = (fieldName: string) =>
  z
    .union([z.string(), z.number()])
    .refine(
      (val) => {
        if (typeof val === "string") {
          return val.trim() !== "" && !isNaN(Number(val));
        }
        return true;
      },
      {
        message: `${fieldName}を入力してください`,
      }
    )
    .refine(
      (val) => {
        const num = typeof val === "string" ? Number(val) : val;
        return num > 0;
      },
      {
        message: `${fieldName}は0より大きい値を入力してください`,
      }
    )
    .refine(
      (val) => {
        const num = typeof val === "string" ? Number(val) : val;
        return Number.isInteger(num);
      },
      {
        message: `${fieldName}は整数を入力してください`,
      }
    )
    .transform((val) => (typeof val === "string" ? Number(val) : val));

// サプリメント登録・編集用のZodスキーマ定義
export const supplementFormSchema = z
  .object({
    supplement_name: z.string().min(1, "サプリ名は必須です"),
    dosage: numberFieldSchema("内容量"),
    dosage_unit: z.string().min(1, "単位は必須です"),
    intake_amount: numberFieldSchema("服用量"),
    intake_unit: z.string().min(1, "単位は必須です"),
    dosage_method: z.enum(["timing", "count"]),
    timing_morning: z.boolean(),
    timing_noon: z.boolean(),
    timing_night: z.boolean(),
    timing_before_meal: z.boolean(),
    timing_after_meal: z.boolean(),
    timing_empty_stomach: z.boolean(),
    timing_bedtime: z.boolean(),
    daily_target_count: z
      .union([z.string(), z.number()])
      .optional()
      .refine(
        (val) => {
          if (val === undefined || val === "") return true;
          const num = typeof val === "string" ? Number(val) : val;
          return !isNaN(num);
        },
        {
          message: "目標服用回数は数値を入力してください",
        }
      )
      .refine(
        (val) => {
          if (val === undefined || val === "") return true;
          const num = typeof val === "string" ? Number(val) : val;
          return num > 0;
        },
        {
          message: "目標服用回数は0より大きい値を入力してください",
        }
      )
      .refine(
        (val) => {
          if (val === undefined || val === "") return true;
          const num = typeof val === "string" ? Number(val) : val;
          return Number.isInteger(num);
        },
        {
          message: "目標服用回数は整数を入力してください",
        }
      )
      .transform((val) => {
        if (val === undefined || val === "") return undefined;
        return typeof val === "string" ? Number(val) : val;
      }),
    image: z.any().optional(),
    takenTimings: z
      .object({
        morning: z.boolean(),
        noon: z.boolean(),
        night: z.boolean(),
        before_meal: z.boolean(),
        after_meal: z.boolean(),
        empty_stomach: z.boolean(),
        bedtime: z.boolean(),
      })
      .optional(),
    takenCount: z.number().optional(),
    dosageHistory: z
      .array(
        z.object({
          timestamp: z.string(),
          count: z.number(),
        })
      )
      .optional(),
    meal_timing: z
      .enum(["before_meal", "after_meal", "empty_stomach", "none"])
      .optional(),
  })
  .refine(
    (data) => {
      if (data.dosage_method === "timing") {
        return data.timing_morning || data.timing_noon || data.timing_night;
      }
      return true;
    },
    {
      message:
        "タイミングベースを選択した場合、少なくとも1つの時間帯を選択してください",
      path: ["dosage_method"],
    }
  )
  .refine(
    (data) => {
      if (data.dosage_method === "count") {
        return (
          data.daily_target_count !== undefined && data.daily_target_count > 0
        );
      }
      return true;
    },
    {
      message: "回数ベースを選択した場合、目標服用回数を入力してください",
      path: ["daily_target_count"],
    }
  );

// フォームデータの型定義
export type SupplementFormData = z.infer<typeof supplementFormSchema>;
