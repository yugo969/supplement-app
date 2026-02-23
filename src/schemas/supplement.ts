import * as z from "zod";
import { supplementFormSchema, type SupplementFormData } from "./form-schemas";

// サプリメントの服用方法タイプ定義
export type DosageMethod = "timing" | "count";

// タイミングカテゴリの型定義
type TimingCategory = {
  time?: "morning" | "noon" | "night";
  meal?: "before_meal" | "after_meal" | "empty_stomach" | "bedtime";
};

// 従来のスキーマはform-schemas.tsに移動しました
export { supplementFormSchema };
export type { SupplementFormData };

// サプリメントデータ（フォームデータ + 追加情報）の型定義
export type SupplementData = SupplementFormData & {
  id: string; // Firestoreのドキュメントid
  imageUrl: string;
  groupIds?: string[];
  dosage_left?: number; // 服用状況更新後の残量
  lastTakenDate?: string; // 最後に服用した日付
  shouldResetTimings?: boolean; // 日付変更によるリセットが必要かどうか
};

export type SupplementGroup = {
  id: string;
  name: string;
  isSystem?: boolean;
};
