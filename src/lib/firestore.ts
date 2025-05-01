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

  await db.collection("supplements").add({
    ...data,
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
    };

    const lastTakenDate = data.lastTakenDate || "";
    const shouldResetTimings = lastTakenDate !== currentDate;

    if (shouldResetTimings) {
      // 日付が変わっていれば服用状況をリセット（データの表示上のみ）
      Object.keys(takenTimings).forEach((key) => {
        takenTimings[key] = false;
      });
    }

    return {
      id: doc.id,
      ...data,
      dosage: Number(data.dosage), // 数値に変換
      intake_amount: Number(data.intake_amount), // 数値に変換
      takenTimings: takenTimings,
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
  const lastTakenDate = data?.lastTakenDate || "";

  if (lastTakenDate !== currentDate) {
    const resetTimings = {
      morning: false,
      noon: false,
      night: false,
    };

    await db.collection("supplements").doc(id).update({
      takenTimings: resetTimings,
      lastTakenDate: currentDate,
    });

    return resetTimings;
  }

  return null;
};
