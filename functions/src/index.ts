import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";

admin.initializeApp();

// タイムゾーンを設定（例：日本時間）
const timeZone = "Asia/Tokyo";

exports.resetTakenTimings = functions.pubsub
  .schedule("0 0 * * *") // 毎日0時に実行
  .timeZone(timeZone)
  .onRun(async () => {
    const db = admin.firestore();

    try {
      const supplementsSnapshot = await db.collection("supplements").get();

      const batch = db.batch();

      supplementsSnapshot.forEach((doc: { id: string }) => {
        const supplementRef = db.collection("supplements").doc(doc.id);
        batch.update(supplementRef, {
          takenTimings: {
            morning: false,
            noon: false,
            night: false,
          },
        });
      });

      await batch.commit();
      console.log("全てのサプリメントのtakenTimingsをリセットしました。");
    } catch (error) {
      console.error("takenTimingsのリセット中にエラーが発生しました：", error);
    }

    return null;
  });
