function resizeImage(
  file: File,
  maxWidth: number,
  maxHeight: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function (event: ProgressEvent<FileReader>) {
      if (!event.target?.result) {
        reject(new Error("ファイルの読み込みに失敗しました。"));
        return;
      }

      const img = new Image();
      img.src = event.target.result as string;

      img.onload = function () {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = height * (maxWidth / width);
          width = maxWidth;
        }

        if (height > maxHeight) {
          width = width * (maxHeight / height);
          height = maxHeight;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("キャンバスのコンテキストの取得に失敗しました。"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg"));
      };

      img.onerror = function () {
        reject(new Error("画像の読み込みに失敗しました。"));
      };
    };

    reader.onerror = function () {
      reject(new Error("ファイルの読み込みに失敗しました。"));
    };

    reader.readAsDataURL(file);
  });
}

export default resizeImage;
