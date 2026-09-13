/* =========================
   MyScale v0.9
   写真ストレージ
   IndexedDB
========================= */

const PHOTO_DB_NAME =
  "myscale_photo_db";

const PHOTO_DB_VERSION = 1;

const PHOTO_STORE_NAME =
  "photos";


/* -------------------------
   DBを開く
------------------------- */

function openPhotoDB() {
  return new Promise(
    (resolve, reject) => {

      const request =
        indexedDB.open(
          PHOTO_DB_NAME,
          PHOTO_DB_VERSION
        );

      request.onupgradeneeded =
        function(event) {

          const db =
            event.target.result;

          if (
            !db.objectStoreNames.contains(
              PHOTO_STORE_NAME
            )
          ) {
            const store =
              db.createObjectStore(
                PHOTO_STORE_NAME,
                {
                  keyPath: "id"
                }
              );

            store.createIndex(
              "itemId",
              "itemId",
              {
                unique: false
              }
            );
          }
        };

      request.onsuccess =
        function() {
          resolve(request.result);
        };

      request.onerror =
        function() {
          reject(request.error);
        };
    }
  );
}


/* -------------------------
   写真を保存
------------------------- */

async function savePhotoToDB(
  itemId,
  blob
) {
  const db =
    await openPhotoDB();

  const photo = {
    id: makeId(),
    itemId,
    blob,
    createdAt: Date.now()
  };

  return new Promise(
    (resolve, reject) => {

      const transaction =
        db.transaction(
          PHOTO_STORE_NAME,
          "readwrite"
        );

      const store =
        transaction.objectStore(
          PHOTO_STORE_NAME
        );

      const request =
        store.add(photo);

      request.onsuccess =
        function() {
          resolve(photo);
        };

      request.onerror =
        function() {
          reject(request.error);
        };

      transaction.oncomplete =
        function() {
          db.close();
        };
    }
  );
}


/* -------------------------
   写真1枚を取得
------------------------- */

async function getPhotoFromDB(
  photoId
) {
  const db =
    await openPhotoDB();

  return new Promise(
    (resolve, reject) => {

      const transaction =
        db.transaction(
          PHOTO_STORE_NAME,
          "readonly"
        );

      const store =
        transaction.objectStore(
          PHOTO_STORE_NAME
        );

      const request =
        store.get(photoId);

      request.onsuccess =
        function() {
          resolve(
            request.result || null
          );
        };

      request.onerror =
        function() {
          reject(request.error);
        };

      transaction.oncomplete =
        function() {
          db.close();
        };
    }
  );
}


/* -------------------------
   対象の写真を全部取得
------------------------- */

async function getPhotosForItem(
  itemId
) {
  const db =
    await openPhotoDB();

  return new Promise(
    (resolve, reject) => {

      const transaction =
        db.transaction(
          PHOTO_STORE_NAME,
          "readonly"
        );

      const store =
        transaction.objectStore(
          PHOTO_STORE_NAME
        );

      const index =
        store.index("itemId");

      const request =
        index.getAll(itemId);

      request.onsuccess =
        function() {
          resolve(
            request.result || []
          );
        };

      request.onerror =
        function() {
          reject(request.error);
        };

      transaction.oncomplete =
        function() {
          db.close();
        };
    }
  );
}


/* -------------------------
   写真を削除
------------------------- */

async function deletePhotoFromDB(
  photoId
) {
  const db =
    await openPhotoDB();

  return new Promise(
    (resolve, reject) => {

      const transaction =
        db.transaction(
          PHOTO_STORE_NAME,
          "readwrite"
        );

      const store =
        transaction.objectStore(
          PHOTO_STORE_NAME
        );

      const request =
        store.delete(photoId);

      request.onsuccess =
        function() {
          resolve();
        };

      request.onerror =
        function() {
          reject(request.error);
        };

      transaction.oncomplete =
        function() {
          db.close();
        };
    }
  );
}


/* -------------------------
   対象の写真を全部削除
------------------------- */

async function deletePhotosForItem(
  itemId
) {
  const photos =
    await getPhotosForItem(itemId);

  for (const photo of photos) {
    await deletePhotoFromDB(
      photo.id
    );
  }
}
