import firebase from "./firebaseClient";

const db = firebase.firestore();

export const addSupplement = async (data: any) => {
  const user = firebase.auth().currentUser;
  if (!user) return;

  await db.collection("supplements").add({
    ...data,
    userId: user.uid,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
};

export const getSupplements = async () => {
  const user = firebase.auth().currentUser;
  if (!user) return [];

  const snapshot = await db
    .collection("supplements")
    .where("userId", "==", user.uid)
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      dosage: Number(data.dosage), // 数値に変換
      intake_amount: Number(data.intake_amount), // 数値に変換
      takenTimings: data.takenTimings || {
        morning: false,
        noon: false,
        night: false,
      },
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
  await db.collection("supplements").doc(id).update({
    dosage: newDosage,
    takenTimings: takenTimings,
  });
};
