/* =========================
   MyScale v0.9
   写真選択・保存
========================= */

const PHOTO_MAX_SIZE = 1600;
const PHOTO_QUALITY = 0.82;


/* -------------------------
   対象の写真情報を保証
------------------------- */

function ensureItemPhotos(item) {
  if (!Array.isArray(item.photoIds)) {
    item.photoIds = [];
  }

  if (
    typeof item.mainPhotoId !== "string"
  ) {
    item.mainPhotoId = null;
  }
}


/* -------------------------
   写真選択を開く
------------------------- */

function chooseItemPhoto() {
  if (!currentItemId) return;

  const input =
    document.getElementById(
      "itemPhotoInput"
    );

  if (!input) return;

  input.value = "";
  input.click();
}


/* -------------------------
   選択された写真を処理
------------------------- */

async function handleItemPhotoSelected(
  event
) {
  const file =
    event.target.files?.[0];

  if (!file) return;

  const item = items.find(
    item => item.id === currentItemId
  );

  if (!item) return;

  if (!file.type.startsWith("image/")) {
    alert("画像ファイルを選んでね！");
    return;
  }

  try {
    const blob =
      await compressItemPhoto(file);

    const photo =
      await savePhotoToDB(
        item.id,
        blob
      );

        ensureItemPhotos(item);

    item.photoIds.push(photo.id);

    if (!item.mainPhotoId) {
      item.mainPhotoId = photo.id;
    }

    item.updatedAt = Date.now();

    persist();

    await renderItemPhotoSlot();

    alert("写真を追加したよ！");

  } catch (error) {
    console.error(
      "写真の保存に失敗しました",
      error
    );

    alert(
      "写真を保存できませんでした。"
    );
  }
}


/* -------------------------
   写真を縮小・圧縮
------------------------- */

async function compressItemPhoto(file) {
  const image =
    await loadPhotoImage(file);

  let width =
    image.naturalWidth;

  let height =
    image.naturalHeight;

  const longestSide =
    Math.max(width, height);

  if (longestSide > PHOTO_MAX_SIZE) {
    const scale =
      PHOTO_MAX_SIZE / longestSide;

    width =
      Math.round(width * scale);

    height =
      Math.round(height * scale);
  }

  const canvas =
    document.createElement("canvas");

  canvas.width = width;
  canvas.height = height;

  const context =
    canvas.getContext("2d");

  if (!context) {
    throw new Error(
      "Canvasを使用できません"
    );
  }

  context.drawImage(
    image,
    0,
    0,
    width,
    height
  );

  return new Promise(
    (resolve, reject) => {

      canvas.toBlob(
        blob => {
          if (!blob) {
            reject(
              new Error(
                "画像変換に失敗しました"
              )
            );
            return;
          }

          resolve(blob);
        },
        "image/jpeg",
        PHOTO_QUALITY
      );
    }
  );
}


/* -------------------------
   File → Image
------------------------- */

function loadPhotoImage(file) {
  return new Promise(
    (resolve, reject) => {

      const url =
        URL.createObjectURL(file);

      const image =
        new Image();

      image.onload =
        function() {
          URL.revokeObjectURL(url);
          resolve(image);
        };

      image.onerror =
        function() {
          URL.revokeObjectURL(url);

          reject(
            new Error(
              "画像を読み込めませんでした"
            )
          );
        };

      image.src = url;
    }
  );
}


/* -------------------------
   プロフィール写真表示
------------------------- */

let currentItemPhotoURL = null;

async function renderItemPhotoSlot() {
  const slot =
    document.getElementById(
      "itemPhotoSlot"
    );

  const item = items.find(
    item => item.id === currentItemId
  );

  if (!slot || !item) return;

  ensureItemPhotos(item);

  if (currentItemPhotoURL) {
    URL.revokeObjectURL(
      currentItemPhotoURL
    );

    currentItemPhotoURL = null;
  }

  slot.innerHTML = "";
  slot.onclick = null;

  if (!item.mainPhotoId) {

    if (itemEditMode) {
      slot.textContent = "＋";
      slot.classList.add(
        "is-photo-add"
      );

      slot.onclick =
        chooseItemPhoto;

    } else {
      slot.textContent =
        item.emoji || "⭐";

      slot.classList.remove(
        "is-photo-add"
      );
    }

    return;
  }

  const photo =
    await getPhotoFromDB(
      item.mainPhotoId
    );

  if (!photo?.blob) {
    slot.textContent =
      item.emoji || "⭐";

    slot.classList.remove(
      "is-photo-add"
    );

    return;
  }

  currentItemPhotoURL =
    URL.createObjectURL(
      photo.blob
    );

  const image =
    document.createElement("img");

  image.src =
    currentItemPhotoURL;

  image.alt =
    `${item.name}の写真`;

  slot.appendChild(image);

  slot.classList.remove(
    "is-photo-add"
  );
}
