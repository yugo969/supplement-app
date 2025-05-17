import { SupplementData, SupplementFormData } from "@/schemas/supplement";

/**
 * APIから取得したデータがSupplementDataの型に適合しているかをチェックする型ガード
 */
export function isSupplementData(data: unknown): data is SupplementData {
  return (
    typeof data === "object" &&
    data !== null &&
    "supplement_name" in data &&
    "dosage" in data &&
    "dosage_unit" in data &&
    "intake_amount" in data &&
    "intake_unit" in data &&
    "id" in data &&
    "imageUrl" in data
  );
}

/**
 * APIレスポンスをSupplementDataに変換する関数
 * Firestoreから取得したデータに必要なプロパティがない場合でも適切にデフォルト値を設定
 */
export function convertToSupplementData(apiData: any): SupplementData {
  // 必須フィールドがない場合はデフォルト値を設定
  const result: SupplementData = {
    id: apiData.id || "",
    supplement_name: apiData.supplement_name || "",
    dosage: apiData.dosage || 0,
    dosage_unit: apiData.dosage_unit || "錠",
    intake_amount: apiData.intake_amount || 0,
    intake_unit: apiData.intake_unit || "錠",
    dosage_method: apiData.dosage_method || "timing",
    timing_morning: apiData.timing_morning || false,
    timing_noon: apiData.timing_noon || false,
    timing_night: apiData.timing_night || false,
    timing_before_meal: apiData.timing_before_meal || false,
    timing_after_meal: apiData.timing_after_meal || false,
    timing_empty_stomach: apiData.timing_empty_stomach || false,
    timing_bedtime: apiData.timing_bedtime || false,
    imageUrl: apiData.imageUrl || "",
    dosage_left: apiData.dosage_left,
    lastTakenDate: apiData.lastTakenDate,
    shouldResetTimings: apiData.shouldResetTimings || false,
  };

  // オプショナルフィールドがある場合は追加
  if (apiData.daily_target_count !== undefined) {
    result.daily_target_count = apiData.daily_target_count;
  }

  if (apiData.takenTimings) {
    result.takenTimings = {
      morning: apiData.takenTimings.morning || false,
      noon: apiData.takenTimings.noon || false,
      night: apiData.takenTimings.night || false,
      before_meal: apiData.takenTimings.before_meal || false,
      after_meal: apiData.takenTimings.after_meal || false,
      empty_stomach: apiData.takenTimings.empty_stomach || false,
      bedtime: apiData.takenTimings.bedtime || false,
    };
  }

  if (apiData.takenCount !== undefined) {
    result.takenCount = apiData.takenCount;
  }

  if (apiData.dosageHistory) {
    result.dosageHistory = apiData.dosageHistory.map((history: any) => ({
      timestamp: history.timestamp || new Date().toISOString(),
      count: history.count || 0,
    }));
  }

  return result;
}

/**
 * APIレスポンスの配列をSupplementDataの配列に変換する関数
 */
export function convertToSupplementDataArray(
  apiDataArray: any[]
): SupplementData[] {
  return apiDataArray.map(convertToSupplementData);
}
