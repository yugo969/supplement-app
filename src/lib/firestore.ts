import firebase from "./firebaseClient";

const db = firebase.firestore();

// 現在の日付を取得する関数
export const getCurrentDate = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(now.getDate()).padStart(2, "0")}`;
};

export const addSupplement = async (data: any) => {
  const user = firebase.auth().currentUser;
  if (!user) return;

  // タイミングベースの場合は初期takenTimingsを設定
  let initialData = { ...data };

  if (data.dosage_method === "timing") {
    initialData.takenTimings = {
      morning: false,
      noon: false,
      night: false,
      before_meal: false,
      after_meal: false,
      empty_stomach: false,
      bedtime: false,
    };
  } else if (data.dosage_method === "count") {
    // 回数ベースの場合は初期takenCountとdosageHistoryを設定
    initialData.takenCount = 0;
    initialData.dosageHistory = [];
  }

  await db.collection("supplements").add({
    ...initialData,
    userId: user.uid,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    lastTakenDate: getCurrentDate(), // 最後に服用した日付を追加
  });
};

export const getSupplements = async () => {
  const user = firebase.auth().currentUser;
  if (!user) return [];

  const snapshot = await db
    .collection("supplements")
    .where("userId", "==", user.uid)
    .get();

  const currentDate = getCurrentDate();

  return snapshot.docs.map((doc) => {
    const data = doc.data();

    // 日付が変わっていれば服用状況をリセット
    const takenTimings = data.takenTimings || {
      morning: false,
      noon: false,
      night: false,
      before_meal: false,
      after_meal: false,
      empty_stomach: false,
      bedtime: false,
    };

    const lastTakenDate = data.lastTakenDate || "";
    const shouldResetTimings = lastTakenDate !== currentDate;
    const dosageMethod = data.dosage_method || "timing";

    // 新しい日には服用状況をリセット（データの表示上のみ）
    if (shouldResetTimings) {
      if (dosageMethod === "timing") {
        // タイミングベースの場合は各タイミングをリセット
        Object.keys(takenTimings).forEach((key) => {
          takenTimings[key] = false;
        });
      }
      // 回数ベースの場合は後でリセット
    }

    return {
      id: doc.id,
      ...data,
      dosage: Number(data.dosage), // 数値に変換
      intake_amount: Number(data.intake_amount), // 数値に変換
      dosage_method: dosageMethod,
      takenTimings: takenTimings,
      takenCount:
        shouldResetTimings && dosageMethod === "count"
          ? 0
          : data.takenCount || 0,
      dosageHistory: data.dosageHistory || [],
      daily_target_count: data.daily_target_count || 0,
      lastTakenDate: data.lastTakenDate || currentDate,
      shouldResetTimings: shouldResetTimings,
    };
  });
};

export const updateSupplement = async (id: string | undefined, data: any) => {
  await db.collection("supplements").doc(id).update(data);
};

export const deleteSupplement = async (id: string | undefined) => {
  await db.collection("supplements").doc(id).delete();
};

export const uploadImage = async (file: File) => {
  const storageRef = firebase.storage().ref();
  const fileRef = storageRef.child(file.name);
  await fileRef.put(file);
  return fileRef.getDownloadURL();
};

export const updateSupplementDosage = async (
  id: string,
  newDosage: number,
  takenTimings: any
) => {
  const currentDate = getCurrentDate();

  await db.collection("supplements").doc(id).update({
    dosage: newDosage,
    takenTimings: takenTimings,
    lastTakenDate: currentDate, // 服用日付を更新
  });
};

// 日付が変わった場合に服用状況をリセットする関数
export const resetTimingsIfDateChanged = async (id: string) => {
  const currentDate = getCurrentDate();
  const doc = await db.collection("supplements").doc(id).get();

  if (!doc.exists) return;

  const data = doc.data();
  if (!data) return null;

  const lastTakenDate = data.lastTakenDate || "";
  const dosageMethod = data.dosage_method || "timing";

  if (lastTakenDate !== currentDate) {
    if (dosageMethod === "timing") {
      const resetTimings = {
        morning: false,
        noon: false,
        night: false,
        before_meal: false,
        after_meal: false,
        empty_stomach: false,
        bedtime: false,
      };

      await db.collection("supplements").doc(id).update({
        takenTimings: resetTimings,
        lastTakenDate: currentDate,
      });

      return resetTimings;
    } else if (dosageMethod === "count") {
      // 回数ベースの場合は、takenCountをリセット
      await db
        .collection("supplements")
        .doc(id)
        .update({
          takenCount: 0,
          lastTakenDate: currentDate,
          // 履歴は保持するが、新しい日の履歴を開始
          dosageHistory: data.dosageHistory || [],
        });

      return { takenCount: 0 };
    }
  }

  return null;
};

export const updateSupplementCount = async (
  id: string,
  newDosage: number,
  takenCount: number,
  dosageHistory: { timestamp: string; count: number }[]
) => {
  const currentDate = getCurrentDate();

  // 現在のドキュメントを取得して、dosage_methodを確保
  const doc = await db.collection("supplements").doc(id).get();
  if (!doc.exists) return;

  const data = doc.data();
  if (!data) return;

  // dosage_methodを確保（デフォルトは"count"）
  const dosageMethod = data.dosage_method || "count";

  await db.collection("supplements").doc(id).update({
    dosage: newDosage,
    takenCount: takenCount,
    dosageHistory: dosageHistory,
    lastTakenDate: currentDate,
    dosage_method: dosageMethod, // 必ず含める
  });
};
