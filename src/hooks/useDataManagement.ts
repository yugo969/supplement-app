import { useEffect } from "react";
import { SupplementData } from "@/schemas/supplement";
import {
  resetTimingsIfDateChanged,
  getCurrentDate,
  getSupplements,
} from "@/lib/firestore";

interface UseDataManagementProps {
  user: any;
  setSupplements: React.Dispatch<React.SetStateAction<SupplementData[]>>;
}

export const useDataManagement = ({
  user,
  setSupplements,
}: UseDataManagementProps) => {
  // 初回ロード時のデータ取得とリセット処理
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
  }, [user, setSupplements]);

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
  }, [user, setSupplements]);
};
