const CATEGORY_KEY = "myscale_categories_v2";
const ITEM_KEY = "myscale_items_v2";

const emojiChoices = [
  "🎬","🍜","🎮","👤","❤️","⭐",
  "🚗","✈️","👟","🍺","📚","🎵",
  "🍔","☕","🏨","⚽","💻","✨"
];

let selectedEmoji = "⭐";
let currentCategoryId = null;
let currentItemId = null;

let categories = loadData(CATEGORY_KEY, [
  { id: makeId(), name: "アニメ", emoji: "🎬" },
  { id: makeId(), name: "ラーメン", emoji: "🍜" },
  { id: makeId(), name: "ゲーム", emoji: "🎮" }
]);

let items = loadData(ITEM_KEY, []);


/* --------------------
   基本
-------------------- */

function makeId() {
  if (window.crypto && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return Date.now().toString(36) +
    Math.random().toString(36).slice(2);
}

function loadData(key, fallback) {
  try {
    const saved = localStorage.getItem(key);

    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error(error);
  }

  return fallback;
}

function persist() {
  localStorage.setItem(
    CATEGORY_KEY,
    JSON.stringify(categories)
  );

  localStorage.setItem(
    ITEM_KEY,
    JSON.stringify(items)
  );
}

function escapeHTML(value = "") {
  return String(value).replace(
    /[&<>"']/g,
    char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[char]
  );
}


/* --------------------
   ホーム
-------------------- */

function showHome() {
  currentCategoryId = null;
  currentItemId = null;

  document.getElementById("homeView").hidden = false;
  document.getElementById("categoryView").hidden = true;
  document.getElementById("itemView").hidden = true;

  renderCategories();
  renderRecent();
}

function renderCategories() {
  const grid = document.getElementById("categoryGrid");

  grid.innerHTML = "";

  categories.forEach(category => {
    const count = items.filter(
      item => item.categoryId === category.id
    ).length;

    const button = document.createElement("button");

    button.className = "category";

    button.onclick = () => openCategory(category.id);

    button.innerHTML = `
      <div class="emoji">
        ${escapeHTML(category.emoji)}
      </div>

      <h2>${escapeHTML(category.name)}</h2>

      <div class="count">
        ${count}件の記録
      </div>
    `;

    grid.appendChild(button);
  });

  const add = document.createElement("button");

  add.className = "category new-card";

  add.onclick = openCategoryCreator;

  add.innerHTML = `
    <div class="plus">＋</div>
    <h2>カテゴリー作成</h2>
  `;

  grid.appendChild(add);
}

function renderRecent() {
  const container =
    document.getElementById("recentRecords");

  const recent = [...items]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5);

  if (!recent.length) {
    container.innerHTML = `
      <div class="empty">
        <strong>まだ記録がありません</strong>
        <span>
          カテゴリーを開いて対象を追加してみよう
        </span>
      </div>
    `;
    return;
  }

  container.innerHTML = "";

  recent.forEach(item => {
    const category = categories.find(
      c => c.id === item.categoryId
    );

    const card = document.createElement("button");

    card.className = "item-card";
    card.onclick = () => openItem(item.id);

    card.innerHTML = `
      <div class="emoji">
        ${escapeHTML(item.emoji || "⭐")}
      </div>

      <h2>${escapeHTML(item.name)}</h2>

      <div class="count">
        ${escapeHTML(category?.name || "")}
      </div>
    `;

    container.appendChild(card);
  });
}


/* --------------------
   カテゴリー作成
-------------------- */

function openCategoryCreator() {
  selectedEmoji = "⭐";

  document.getElementById("categoryName").value = "";

  renderEmojiPicker();

  document
    .getElementById("categoryModal")
    .classList.add("show");
}

function closeCategoryCreator() {
  document
    .getElementById("categoryModal")
    .classList.remove("show");
}

function renderEmojiPicker() {
  const picker =
    document.getElementById("emojiPicker");

  picker.innerHTML = "";

  emojiChoices.forEach(emoji => {
    const button = document.createElement("button");

    button.type = "button";

    button.className =
      "emoji-option" +
      (emoji === selectedEmoji
        ? " selected"
        : "");

    button.textContent = emoji;

    button.onclick = () => {
      selectedEmoji = emoji;
      renderEmojiPicker();
    };

    picker.appendChild(button);
  });
}

function saveCategory() {
  const name =
    document.getElementById("categoryName")
      .value.trim();

  if (!name) {
    alert("カテゴリー名を入力してね！");
    return;
  }

  const category = {
    id: makeId(),
    name,
    emoji: selectedEmoji,
    createdAt: Date.now()
  };

  categories.push(category);

  persist();

  closeCategoryCreator();

  renderCategories();
}


/* --------------------
   カテゴリー詳細
-------------------- */

function openCategory(id) {
  const category = categories.find(
    category => category.id === id
  );

  if (!category) return;

  currentCategoryId = id;
  currentItemId = null;

  document.getElementById("homeView").hidden = true;
  document.getElementById("categoryView").hidden = false;
  document.getElementById("itemView").hidden = true;

  document.getElementById(
    "categoryTitle"
  ).textContent =
    `${category.emoji} ${category.name}`;

  renderCategoryItems();
}

function renderCategoryItems() {
  const container =
    document.getElementById("categoryItems");

  const categoryItems = items.filter(
    item => item.categoryId === currentCategoryId
  );

  container.innerHTML = "";

  categoryItems.forEach(item => {
    const card = document.createElement("button");

    card.className = "item-card";

    card.onclick = () => openItem(item.id);

    card.innerHTML = `
      <div class="emoji">
        ${escapeHTML(item.emoji || "⭐")}
      </div>

      <h2>${escapeHTML(item.name)}</h2>

      <div class="count">
        ${
          item.tags?.length
            ? item.tags
                .map(tag => "#" + escapeHTML(tag))
                .join(" ")
            : "評価はこれから"
        }
      </div>
    `;

    container.appendChild(card);
  });

  const add = document.createElement("button");

  add.className = "item-card new-card";

  add.onclick = openItemCreator;

  add.innerHTML = `
    <div class="plus">＋</div>
    <h2>対象を追加</h2>
  `;

  container.appendChild(add);
}


/* --------------------
   対象作成
-------------------- */

function openItemCreator() {
  const category = categories.find(
    c => c.id === currentCategoryId
  );

  if (!category) return;

  document.getElementById(
    "itemModalTitle"
  ).textContent =
    `${category.emoji} 対象を追加`;

  document.getElementById("itemName").value = "";
  document.getElementById("itemMemo").value = "";
  document.getElementById("itemTags").value = "";

  document
    .getElementById("itemModal")
    .classList.add("show");
}

function closeItemCreator() {
  document
    .getElementById("itemModal")
    .classList.remove("show");
}

function saveItem() {
  const name =
    document.getElementById("itemName")
      .value.trim();

  const memo =
    document.getElementById("itemMemo")
      .value.trim();

  const rawTags =
    document.getElementById("itemTags")
      .value.trim();

  if (!name) {
    alert("名前を入力してね！");
    return;
  }

  const category = categories.find(
    c => c.id === currentCategoryId
  );

  const tags = rawTags
    ? rawTags
        .split(/[,\s、]+/)
        .map(tag => tag.replace(/^#/, "").trim())
        .filter(Boolean)
    : [];

  const item = {
    id: makeId(),
    categoryId: currentCategoryId,
    parentId: null,

    name,
    emoji: category?.emoji || "⭐",
    memo,
    tags,

    charts: [],

    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  items.push(item);

  persist();

  closeItemCreator();

  renderCategoryItems();
}


/* --------------------
   対象詳細
-------------------- */

function openItem(id) {
  const item = items.find(
    item => item.id === id
  );

  if (!item) return;

  currentItemId = id;
  currentCategoryId = item.categoryId;

  document.getElementById("homeView").hidden = true;
  document.getElementById("categoryView").hidden = true;
  document.getElementById("itemView").hidden = false;

  renderItemDetail();
}

function renderItemDetail() {
  const item = items.find(
    item => item.id === currentItemId
  );

  if (!item) return;

  const category = categories.find(
    category => category.id === item.categoryId
  );

  document.getElementById(
    "itemTitle"
  ).textContent =
    `${item.emoji || "⭐"} ${item.name}`;

  document.getElementById(
    "itemCategory"
  ).textContent =
    category?.name || "";

  document.getElementById(
    "itemMemoView"
  ).textContent =
    item.memo || "メモはまだありません。";

  const tags =
    document.getElementById("itemTagsView");

  tags.innerHTML = "";

  item.tags.forEach(tag => {
    const span = document.createElement("span");

    span.className = "tag";
    span.textContent = "#" + tag;

    tags.appendChild(span);
  });

  renderCharts();
}


/* --------------------
   チャート
   v0.3で本実装
-------------------- */

function renderCharts() {
  const item = items.find(
    item => item.id === currentItemId
  );

  const container =
    document.getElementById("chartsContainer");

  container.innerHTML = "";

  if (!item?.charts?.length) {
    container.innerHTML = `
      <div class="chart-placeholder">
        🕸️
        <br><br>
        まだ評価チャートがありません
        <br>
        <small>
          次のアップデートでここに
          自分だけのレーダーチャートを作れます
        </small>
      </div>
    `;
  }
}

function addChartComingSoon() {
  alert(
    "次はいよいよ評価チャート編！\n\n" +
    "チャート名・評価軸・点数を自由に作れるようにします🔥"
  );
}


/* --------------------
   削除
-------------------- */

function deleteCurrentItem() {
  const item = items.find(
    item => item.id === currentItemId
  );

  if (!item) return;

  const ok = confirm(
    `「${item.name}」を削除する？`
  );

  if (!ok) return;

  const categoryId = item.categoryId;

  items = items.filter(
    item => item.id !== currentItemId
  );

  persist();

  openCategory(categoryId);
}

function deleteCurrentCategory() {
  const category = categories.find(
    c => c.id === currentCategoryId
  );

  if (!category) return;

  const categoryItems = items.filter(
    item => item.categoryId === category.id
  );

  const message =
    categoryItems.length > 0
      ? `「${category.name}」と中の${categoryItems.length}件の記録を削除する？`
      : `「${category.name}」を削除する？`;

  if (!confirm(message)) return;

  items = items.filter(
    item => item.categoryId !== category.id
  );

  categories = categories.filter(
    c => c.id !== category.id
  );

  persist();
  showHome();
}


/* --------------------
   モーダル背景タップ
-------------------- */

function closeOnBackground(event, modalId) {
  if (event.target.id === modalId) {
    document
      .getElementById(modalId)
      .classList.remove("show");
  }
}


/* --------------------
   起動
-------------------- */

persist();
renderEmojiPicker();
showHome();
