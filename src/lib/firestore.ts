import firebase from "./firebaseClient";
import {
  convertToSupplementData,
  convertToSupplementDataArray,
} from "./type-guards";
import { SupplementData, SupplementGroup } from "@/schemas/supplement";

const firestore = firebase.firestore();
const GROUP_NAME_MAX_LENGTH = 12;

// supplement-appのコレクションとサブコレクションを参照
const getSupplementsCollection = () => {
  const user = firebase.auth().currentUser;
  if (!user) {
    throw new Error("ユーザーがログインしていません");
  }
  // セキュリティルールでは /supplements/{supplementId} パスで
  // ドキュメントのuserIdフィールドと認証ユーザーIDを比較している
  return firestore.collection("supplements");
};

const getSupplementGroupsCollection = () => {
  const user = firebase.auth().currentUser;
  if (!user) {
    throw new Error("ユーザーがログインしていません");
  }
  return firestore.collection("supplementGroups");
};

// 現在の日付を取得（日本時間）
export const getCurrentDate = () => {
  const now = new Date();
  return now.toLocaleDateString("ja-JP");
};

// 日付変更時のリセット処理
export const resetTimingsIfDateChanged = async (supplementId: string) => {
  const user = firebase.auth().currentUser;
  if (!user) return;

  try {
    const supplementRef = getSupplementsCollection().doc(supplementId);
    const supplementDoc = await supplementRef.get();
    const supplementData = supplementDoc.data();

    // ユーザーIDが一致するか確認
    if (!supplementData || supplementData.userId !== user.uid) return;

    const currentDate = getCurrentDate();

    // 最後に服用した日付と現在の日付を比較
    if (supplementData.lastTakenDate !== currentDate) {
      // 回数ベースの場合はtakenCountをリセット
      if (supplementData.dosage_method === "count") {
        await supplementRef.update({
          takenCount: 0,
          lastTakenDate: currentDate,
          shouldResetTimings: false,
        });
      } else {
        // タイミングベースの場合はtakenTimingsをリセット
        const resetTimings = {
          morning: false,
          noon: false,
          night: false,
          before_meal: false,
          after_meal: false,
          empty_stomach: false,
          bedtime: false,
        };

        await supplementRef.update({
          takenTimings: resetTimings,
          lastTakenDate: currentDate,
          shouldResetTimings: false,
        });
      }
    }
  } catch (error) {
    console.error("日付変更時のリセット処理でエラーが発生しました", error);
  }
};

// サプリメントを追加
export const addSupplement = async (data: any) => {
  try {
    const user = firebase.auth().currentUser;
    if (!user) throw new Error("ユーザーがログインしていません");

    const supplementsRef = getSupplementsCollection();
    const currentDate = getCurrentDate();

    // 日付情報とユーザーIDを追加
    const supplementData = {
      ...data,
      userId: user.uid, // ユーザーIDをドキュメントに保存
      lastTakenDate: currentDate,
      shouldResetTimings: false,
      dosage_left: data.dosage, // 新規追加時は残量=内容量
    };

    await supplementsRef.add(supplementData);
  } catch (error) {
    console.error("サプリメント追加エラー:", error);
    throw error;
  }
};

// サプリメント一覧を取得
export const getSupplements = async (): Promise<SupplementData[]> => {
  try {
    const user = firebase.auth().currentUser;
    if (!user) return [];

    // ユーザーIDでフィルタリング
    const supplementsRef = getSupplementsCollection().where(
      "userId",
      "==",
      user.uid
    );
    const snapshot = await supplementsRef.get();

    const supplementsData = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
      };
    });

    // APIレスポンスを適切な型に変換
    return convertToSupplementDataArray(supplementsData);
  } catch (error) {
    console.error("サプリメント取得エラー:", error);
    return [];
  }
};

// サプリメントを更新
export const updateSupplement = async (id: string, data: any) => {
  try {
    const user = firebase.auth().currentUser;
    if (!user) throw new Error("ユーザーがログインしていません");

    const supplementRef = getSupplementsCollection().doc(id);

    // セキュリティチェック - 自分のドキュメントか確認
    const doc = await supplementRef.get();
    if (!doc.exists || doc.data()?.userId !== user.uid) {
      throw new Error(
        "指定されたサプリメントが存在しないか、アクセス権限がありません"
      );
    }

    // 内容量（dosage）が更新される場合は、残り数量（dosage_left）も同じ値に更新
    const updateData = { ...data };
    if (data.dosage !== undefined) {
      updateData.dosage_left = data.dosage;
    }

    await supplementRef.update(updateData);
  } catch (error) {
    console.error("サプリメント更新エラー:", error);
    throw error;
  }
};

// サプリメントを削除
export const deleteSupplement = async (id: string) => {
  try {
    const user = firebase.auth().currentUser;
    if (!user) throw new Error("ユーザーがログインしていません");

    const supplementRef = getSupplementsCollection().doc(id);

    // セキュリティチェック - 自分のドキュメントか確認
    const doc = await supplementRef.get();
    if (!doc.exists || doc.data()?.userId !== user.uid) {
      throw new Error(
        "指定されたサプリメントが存在しないか、アクセス権限がありません"
      );
    }

    await supplementRef.delete();
  } catch (error) {
    console.error("サプリメント削除エラー:", error);
    throw error;
  }
};

// サプリメントの服用状況を更新
export const updateSupplementDosage = async (
  id: string,
  newDosage: number,
  takenTimings: any
) => {
  try {
    const user = firebase.auth().currentUser;
    if (!user) throw new Error("ユーザーがログインしていません");

    const supplementRef = getSupplementsCollection().doc(id);

    // セキュリティチェック - 自分のドキュメントか確認
    const doc = await supplementRef.get();
    if (!doc.exists || doc.data()?.userId !== user.uid) {
      throw new Error(
        "指定されたサプリメントが存在しないか、アクセス権限がありません"
      );
    }

    const currentDate = getCurrentDate();

    await supplementRef.update({
      dosage: newDosage,
      takenTimings,
      lastTakenDate: currentDate,
      dosage_left: newDosage, // 残量も更新
    });
  } catch (error) {
    console.error("服用状況更新エラー:", error);
    throw error;
  }
};

// サプリメントの服用回数を更新
export const updateSupplementCount = async (
  id: string,
  newDosage: number,
  newCount: number,
  dosageHistory: any
) => {
  try {
    const user = firebase.auth().currentUser;
    if (!user) throw new Error("ユーザーがログインしていません");

    const supplementRef = getSupplementsCollection().doc(id);

    // セキュリティチェック - 自分のドキュメントか確認
    const doc = await supplementRef.get();
    if (!doc.exists || doc.data()?.userId !== user.uid) {
      throw new Error(
        "指定されたサプリメントが存在しないか、アクセス権限がありません"
      );
    }

    const currentDate = getCurrentDate();

    await supplementRef.update({
      dosage: newDosage,
      takenCount: newCount,
      dosageHistory,
      lastTakenDate: currentDate,
      dosage_left: newDosage, // 残量も更新
    });
  } catch (error) {
    console.error("服用回数更新エラー:", error);
    throw error;
  }
};

// 画像をアップロード
export const uploadImage = async (file: File): Promise<string> => {
  const user = firebase.auth().currentUser;
  if (!user) {
    throw new Error("ユーザーがログインしていません");
  }

  try {
    const storageRef = firebase.storage().ref();
    const imageRef = storageRef.child(
      `supplements/${user.uid}_${Date.now()}_${file.name}`
    );

    const snapshot = await imageRef.put(file);
    const downloadURL = await snapshot.ref.getDownloadURL();

    return downloadURL;
  } catch (error) {
    console.error("画像アップロードエラー:", error);
    throw error;
  }
};

export const getSupplementGroups = async (): Promise<SupplementGroup[]> => {
  try {
    const user = firebase.auth().currentUser;
    if (!user) return [];

    const groupsRef = getSupplementGroupsCollection().where(
      "userId",
      "==",
      user.uid
    );
    const snapshot = await groupsRef.get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: typeof data.name === "string" ? data.name : "",
        isSystem: false,
      };
    });
  } catch (error) {
    console.error("グループ取得エラー:", error);
    return [];
  }
};

export const addSupplementGroup = async (name: string): Promise<string> => {
  const user = firebase.auth().currentUser;
  if (!user) {
    throw new Error("ユーザーがログインしていません");
  }

  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error("グループ名が空です");
  }
  if (Array.from(trimmedName).length > GROUP_NAME_MAX_LENGTH) {
    throw new Error(
      `グループ名は${GROUP_NAME_MAX_LENGTH}文字以内で入力してください`
    );
  }

  const groupsRef = getSupplementGroupsCollection();
  const docRef = await groupsRef.add({
    name: trimmedName,
    userId: user.uid,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  });

  return docRef.id;
};

export const toggleSupplementGroupMembership = async (
  supplementId: string,
  groupId: string,
  shouldAssign: boolean
) => {
  const user = firebase.auth().currentUser;
  if (!user) {
    throw new Error("ユーザーがログインしていません");
  }

  const supplementRef = getSupplementsCollection().doc(supplementId);
  const doc = await supplementRef.get();
  if (!doc.exists || doc.data()?.userId !== user.uid) {
    throw new Error(
      "指定されたサプリメントが存在しないか、アクセス権限がありません"
    );
  }

  await supplementRef.update({
    groupIds: shouldAssign
      ? firebase.firestore.FieldValue.arrayUnion(groupId)
      : firebase.firestore.FieldValue.arrayRemove(groupId),
  });
};

export const deleteSupplementGroup = async (groupId: string) => {
  const user = firebase.auth().currentUser;
  if (!user) {
    throw new Error("ユーザーがログインしていません");
  }

  const groupRef = getSupplementGroupsCollection().doc(groupId);
  const groupDoc = await groupRef.get();
  if (!groupDoc.exists || groupDoc.data()?.userId !== user.uid) {
    throw new Error(
      "指定されたグループが存在しないか、アクセス権限がありません"
    );
  }

  const linkedSupplements = await getSupplementsCollection()
    .where("userId", "==", user.uid)
    .where("groupIds", "array-contains", groupId)
    .get();

  const batch = firestore.batch();
  linkedSupplements.docs.forEach((supplementDoc) => {
    batch.update(supplementDoc.ref, {
      groupIds: firebase.firestore.FieldValue.arrayRemove(groupId),
    });
  });
  batch.delete(groupRef);
  await batch.commit();
};
