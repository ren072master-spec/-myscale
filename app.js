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
/* =========================
   v0.3 評価チャート
========================= */

let draftAxes = [
  { name: "魅力", value: 3 },
  { name: "デザイン", value: 3 },
  { name: "活躍", value: 3 },
  { name: "個性", value: 3 },
  { name: "推し度", value: 3 }
];

function openChartCreator() {
  const item = items.find(
    item => item.id === currentItemId
  );

  if (!item) return;

  document.getElementById("chartName").value = "";

  document.getElementById("chartMax").value = "5";

  draftAxes = [
    { name: "魅力", value: 3 },
    { name: "デザイン", value: 3 },
    { name: "活躍", value: 3 },
    { name: "個性", value: 3 },
    { name: "推し度", value: 3 }
  ];

  renderAxisEditor();

  document
    .getElementById("chartModal")
    .classList.add("show");
}


function closeChartCreator() {
  document
    .getElementById("chartModal")
    .classList.remove("show");
}


function renderAxisEditor() {
  const container =
    document.getElementById("axisEditor");

  if (!container) return;

  const max =
    Number(
      document.getElementById("chartMax")?.value || 5
    );

  container.innerHTML = "";

  draftAxes.forEach((axis, index) => {
    const row = document.createElement("div");

    row.className = "axis-editor-row";

    row.innerHTML = `
      <div class="axis-top">

        <input
          class="axis-name"
          type="text"
          maxlength="20"
          value="${escapeHTML(axis.name)}"
          placeholder="評価項目"
          oninput="changeAxisName(${index}, this.value)"
        >

        <button
          class="axis-remove"
          type="button"
          onclick="removeAxis(${index})"
        >
          ×
        </button>

      </div>

      <div class="axis-score-row">

        <input
          type="range"
          min="0"
          max="${max}"
          step="0.1"
          value="${Math.min(axis.value, max)}"
          oninput="changeAxisValue(${index}, this.value)"
        >

        <strong id="axisValue${index}">
          ${Math.min(axis.value, max).toFixed(1)}
        </strong>

      </div>
    `;

    container.appendChild(row);
  });
}


function changeAxisName(index, value) {
  if (!draftAxes[index]) return;

  draftAxes[index].name = value;
}


function changeAxisValue(index, value) {
  if (!draftAxes[index]) return;

  draftAxes[index].value = Number(value);

  const label =
    document.getElementById(`axisValue${index}`);

  if (label) {
    label.textContent =
      Number(value).toFixed(1);
  }
}


function addAxis() {
  if (draftAxes.length >= 10) {
    alert("評価軸は最大10個まで！");
    return;
  }

  draftAxes.push({
    name: "",
    value: 3
  });

  renderAxisEditor();
}


function removeAxis(index) {
  if (draftAxes.length <= 3) {
    alert("レーダーチャートには最低3項目必要だよ！");
    return;
  }

  draftAxes.splice(index, 1);

  renderAxisEditor();
}


function chartMaxChanged() {
  const max =
    Number(
      document.getElementById("chartMax").value
    );

  draftAxes = draftAxes.map(axis => ({
    ...axis,
    value: Math.min(axis.value, max)
  }));

  renderAxisEditor();
}


function saveChart() {
  const item = items.find(
    item => item.id === currentItemId
  );

  if (!item) return;

  const name =
    document.getElementById("chartName")
      .value.trim();

  const max =
    Number(
      document.getElementById("chartMax").value
    );

  if (!name) {
    alert("チャート名を入力してね！");
    return;
  }

  const cleanAxes = draftAxes
    .map(axis => ({
      name: axis.name.trim(),
      value: Number(axis.value)
    }))
    .filter(axis => axis.name);

  if (cleanAxes.length < 3) {
    alert("評価項目を3つ以上作ってね！");
    return;
  }

  item.charts = item.charts || [];

  item.charts.push({
    id: makeId(),
    name,
    max,
    axes: cleanAxes,
    createdAt: Date.now()
  });

  item.updatedAt = Date.now();

  persist();

  closeChartCreator();

  renderCharts();
}


function deleteChart(chartId) {
  const item = items.find(
    item => item.id === currentItemId
  );

  if (!item) return;

  const chart = item.charts?.find(
    chart => chart.id === chartId
  );

  if (!chart) return;

  if (!confirm(`「${chart.name}」を削除する？`)) {
    return;
  }

  item.charts = item.charts.filter(
    chart => chart.id !== chartId
  );

  persist();

  renderCharts();
}


/* レーダーチャートをSVGで描画 */

function createRadarSVG(chart) {
  const size = 300;
  const center = 150;
  const radius = 92;

  const count = chart.axes.length;

  if (count < 3) return "";

  function point(index, ratio) {
    const angle =
      -Math.PI / 2 +
      (Math.PI * 2 * index / count);

    return {
      x: center +
        Math.cos(angle) * radius * ratio,

      y: center +
        Math.sin(angle) * radius * ratio
    };
  }

  let grid = "";

  for (let level = 1; level <= 5; level++) {
    const ratio = level / 5;

    const points = chart.axes
      .map((_, index) => {
        const p = point(index, ratio);

        return `${p.x},${p.y}`;
      })
      .join(" ");

    grid += `
      <polygon
        points="${points}"
        fill="none"
        stroke="#dedee8"
        stroke-width="1"
      />
    `;
  }


  const axisLines = chart.axes
    .map((_, index) => {
      const p = point(index, 1);

      return `
        <line
          x1="${center}"
          y1="${center}"
          x2="${p.x}"
          y2="${p.y}"
          stroke="#dedee8"
          stroke-width="1"
        />
      `;
    })
    .join("");


  const valuePoints = chart.axes
    .map((axis, index) => {
      const ratio =
        Math.max(
          0,
          Math.min(1, axis.value / chart.max)
        );

      const p = point(index, ratio);

      return `${p.x},${p.y}`;
    })
    .join(" ");


  const dots = chart.axes
    .map((axis, index) => {
      const ratio =
        Math.max(
          0,
          Math.min(1, axis.value / chart.max)
        );

      const p = point(index, ratio);

      return `
        <circle
          cx="${p.x}"
          cy="${p.y}"
          r="3.5"
          fill="#6557d9"
        />
      `;
    })
    .join("");


  const labels = chart.axes
    .map((axis, index) => {
      const p = point(index, 1.28);

      let anchor = "middle";

      if (p.x < center - 20) {
        anchor = "end";
      }

      if (p.x > center + 20) {
        anchor = "start";
      }

      return `
        <text
          x="${p.x}"
          y="${p.y}"
          text-anchor="${anchor}"
          dominant-baseline="middle"
          font-size="11"
          fill="#555665"
        >
          ${escapeHTML(axis.name)}
        </text>

        <text
          x="${p.x}"
          y="${p.y + 14}"
          text-anchor="${anchor}"
          dominant-baseline="middle"
          font-size="11"
          font-weight="700"
          fill="#202235"
        >
          ${axis.value.toFixed(1)}
        </text>
      `;
    })
    .join("");


  return `
    <svg
      class="radar-svg"
      viewBox="0 0 ${size} ${size}"
      role="img"
      aria-label="${escapeHTML(chart.name)}"
    >
      ${grid}

      ${axisLines}

      <polygon
        points="${valuePoints}"
        fill="rgba(101,87,217,.22)"
        stroke="#6557d9"
        stroke-width="2"
      />

      ${dots}

      ${labels}
    </svg>
  `;
}


/* 既存のrenderChartsをv0.3版に上書き */

function renderCharts() {
  const item = items.find(
    item => item.id === currentItemId
  );

  const container =
    document.getElementById("chartsContainer");

  if (!container) return;

  container.innerHTML = "";

  if (!item?.charts?.length) {
    container.innerHTML = `
      <div class="chart-placeholder">
        🕸️
        <br><br>

        まだ評価チャートがありません

        <br>

        <small>
          好きな評価軸を作って
          自分だけのチャートを作ろう
        </small>
      </div>
    `;

    return;
  }


  item.charts.forEach(chart => {
    const average =
      chart.axes.reduce(
        (sum, axis) => sum + axis.value,
        0
      ) / chart.axes.length;

    const card =
      document.createElement("div");

    card.className = "radar-card";

    card.innerHTML = `
      <div class="radar-head">

        <div>
          <h3>
            ${escapeHTML(chart.name)}
          </h3>

          <div class="chart-average">
            ⭐ ${average.toFixed(1)}
            <span>/ ${chart.max}</span>
          </div>
        </div>

        <button
          class="chart-delete"
          onclick="deleteChart('${chart.id}')"
        >
          •••
        </button>

      </div>

      ${createRadarSVG(chart)}
    `;

    container.appendChild(card);
  });
}


/* 旧ボタンの動作も本物に変更 */

function addChartComingSoon() {
  openChartCreator();
}
persist();
renderEmojiPicker();
showHome();
/* =========================
   v0.3.1 チャート編集・複製
========================= */

let editingChartId = null;

function showChartMenu(chartId) {
  const item = items.find(item => item.id === currentItemId);
  const chart = item?.charts?.find(chart => chart.id === chartId);

  if (!chart) return;

  const action = prompt(
    `「${chart.name}」\n\n` +
    `1：編集\n` +
    `2：複製\n` +
    `3：削除\n\n` +
    `番号を入力してね`
  );

  if (action === "1") {
    editChart(chartId);
  }

  if (action === "2") {
    duplicateChart(chartId);
  }

  if (action === "3") {
    deleteChart(chartId);
  }
}

function editChart(chartId) {
  const item = items.find(item => item.id === currentItemId);
  const chart = item?.charts?.find(chart => chart.id === chartId);

  if (!chart) return;

  editingChartId = chartId;

  document.getElementById("chartName").value = chart.name;
  document.getElementById("chartMax").value = String(chart.max);

  draftAxes = chart.axes.map(axis => ({
    name: axis.name,
    value: axis.value
  }));

  renderAxisEditor();

  document
    .getElementById("chartModal")
    .classList.add("show");
}

function duplicateChart(chartId) {
  const item = items.find(item => item.id === currentItemId);
  const chart = item?.charts?.find(chart => chart.id === chartId);

  if (!chart) return;

  const copy = {
    id: makeId(),
    name: `${chart.name} コピー`,
    max: chart.max,

    axes: chart.axes.map(axis => ({
      name: axis.name,
      value: axis.value
    })),

    createdAt: Date.now()
  };

  item.charts.push(copy);
  item.updatedAt = Date.now();

  persist();
  renderCharts();
}

function saveChartV031() {
  const item = items.find(item => item.id === currentItemId);

  if (!item) return;

  const name = document
    .getElementById("chartName")
    .value
    .trim();

  const max = Number(
    document.getElementById("chartMax").value
  );

  if (!name) {
    alert("チャート名を入力してね！");
    return;
  }

  const cleanAxes = draftAxes
    .map(axis => ({
      name: axis.name.trim(),
      value: Number(axis.value)
    }))
    .filter(axis => axis.name);

  if (cleanAxes.length < 3) {
    alert("評価項目を3つ以上作ってね！");
    return;
  }

  if (editingChartId) {
    const chart = item.charts.find(
      chart => chart.id === editingChartId
    );

    if (!chart) return;

    chart.name = name;
    chart.max = max;
    chart.axes = cleanAxes;
    chart.updatedAt = Date.now();

  } else {
    item.charts.push({
      id: makeId(),
      name,
      max,
      axes: cleanAxes,
      createdAt: Date.now()
    });
  }

  item.updatedAt = Date.now();

  persist();

  editingChartId = null;

  closeChartCreator();
  renderCharts();
}


/* 新規作成時は編集状態を解除 */

const originalOpenChartCreator = openChartCreator;

openChartCreator = function() {
  editingChartId = null;
  originalOpenChartCreator();
};


/* 閉じた場合も解除 */

const originalCloseChartCreator = closeChartCreator;

closeChartCreator = function() {
  editingChartId = null;
  originalCloseChartCreator();
};


/* チャート表示をv0.3.1版へ */

renderCharts = function() {
  const item = items.find(
    item => item.id === currentItemId
  );

  const container =
    document.getElementById("chartsContainer");

  if (!container) return;

  container.innerHTML = "";

  if (!item?.charts?.length) {
    container.innerHTML = `
      <div class="chart-placeholder">
        🕸️
        <br><br>
        まだ評価チャートがありません
        <br>
        <small>
          好きな評価軸を作って
          自分だけのチャートを作ろう
        </small>
      </div>
    `;

    return;
  }

  item.charts.forEach(chart => {
    const average =
      chart.axes.reduce(
        (sum, axis) => sum + axis.value,
        0
      ) / chart.axes.length;

    const card = document.createElement("div");

    card.className = "radar-card";

    card.innerHTML = `
      <div class="radar-head">

        <div>
          <h3>${escapeHTML(chart.name)}</h3>

          <div class="chart-average">
            ⭐ ${average.toFixed(1)}
            <span>/ ${chart.max}</span>
          </div>
        </div>

        <button
          class="chart-delete"
          onclick="showChartMenu('${chart.id}')"
        >
          •••
        </button>

      </div>

      ${createRadarSVG(chart)}
    `;

    container.appendChild(card);
  });
};
/* =====================================
   MyScale v0.4
   テンプレート機能
===================================== */

const TEMPLATE_KEY = "myscale_chart_templates_v1";

let chartTemplates = loadData(TEMPLATE_KEY, []);

let selectedChartActionId = null;


/* -------------------------
   テンプレート保存
------------------------- */

function persistTemplates() {
  localStorage.setItem(
    TEMPLATE_KEY,
    JSON.stringify(chartTemplates)
  );
}


function saveChartAsTemplate(chartId) {

  const item = items.find(
    item => item.id === currentItemId
  );

  const chart = item?.charts?.find(
    chart => chart.id === chartId
  );

  if (!chart) return;


  const exists = chartTemplates.some(
    template =>
      template.name === chart.name
  );


  if (exists) {

    const overwrite = confirm(
      `「${chart.name}」というテンプレートは既にあります。\n\nもう1つ保存する？`
    );

    if (!overwrite) return;
  }


  chartTemplates.push({

    id: makeId(),

    name: chart.name,

    max: chart.max,

    axes: chart.axes.map(axis => ({
      name: axis.name
    })),

    createdAt: Date.now()

  });


  persistTemplates();

  closeChartActionMenu();

  alert(
    `🧩「${chart.name}」をテンプレートに保存したよ！`
  );
}


/* -------------------------
   チャート•••メニュー
------------------------- */

function openChartActionMenu(chartId) {

  selectedChartActionId = chartId;

  const item = items.find(
    item => item.id === currentItemId
  );

  const chart = item?.charts?.find(
    chart => chart.id === chartId
  );

  if (!chart) return;


  document.getElementById(
    "chartActionTitle"
  ).textContent = chart.name;


  document
    .getElementById("chartActionModal")
    .classList.add("show");
}


function closeChartActionMenu() {

  document
    .getElementById("chartActionModal")
    .classList.remove("show");

  selectedChartActionId = null;
}


function actionEditChart() {

  const id = selectedChartActionId;

  closeChartActionMenu();

  editChart(id);
}


function actionDuplicateChart() {

  const id = selectedChartActionId;

  closeChartActionMenu();

  duplicateChart(id);
}


function actionSaveTemplate() {

  const id = selectedChartActionId;

  saveChartAsTemplate(id);
}


function actionDeleteChart() {

  const id = selectedChartActionId;

  closeChartActionMenu();

  deleteChart(id);
}


/* -------------------------
   ＋評価チャート
------------------------- */

function openAddChartMenu() {

  document
    .getElementById("addChartModal")
    .classList.add("show");
}


function closeAddChartMenu() {

  document
    .getElementById("addChartModal")
    .classList.remove("show");
}


function createNewChartFromMenu() {

  closeAddChartMenu();

  openChartCreator();
}


/* -------------------------
   テンプレート一覧
------------------------- */

function openTemplatePicker() {

  closeAddChartMenu();

  renderTemplateList();

  document
    .getElementById("templateModal")
    .classList.add("show");
}


function closeTemplatePicker() {

  document
    .getElementById("templateModal")
    .classList.remove("show");
}


function renderTemplateList() {

  const container =
    document.getElementById("templateList");

  container.innerHTML = "";


  if (!chartTemplates.length) {

    container.innerHTML = `
      <div class="empty">
        <strong>
          まだテンプレートがありません
        </strong>

        <span>
          作成済みチャートの•••から
          テンプレートとして保存できます
        </span>
      </div>
    `;

    return;
  }


  chartTemplates.forEach(template => {

    const button =
      document.createElement("button");

    button.className = "template-card";


    button.innerHTML = `

      <div class="template-icon">
        🧩
      </div>

      <div class="template-info">

        <strong>
          ${escapeHTML(template.name)}
        </strong>

        <span>
          ${template.axes.length}項目・
          ${template.max}点満点
        </span>

      </div>

      <div class="template-arrow">
        ›
      </div>

    `;


    button.onclick = () =>
      useTemplate(template.id);


    container.appendChild(button);

  });

}


/* -------------------------
   テンプレート使用
------------------------- */

function useTemplate(templateId) {

  const template =
    chartTemplates.find(
      template =>
        template.id === templateId
    );


  if (!template) return;


  editingChartId = null;


  document.getElementById(
    "chartName"
  ).value = template.name;


  document.getElementById(
    "chartMax"
  ).value = String(template.max);


  const defaultValue =
    template.max === 10 ? 5 : 3;


  draftAxes =
    template.axes.map(axis => ({

      name: axis.name,

      value: defaultValue

    }));


  closeTemplatePicker();

  renderAxisEditor();


  document
    .getElementById("chartModal")
    .classList.add("show");
}


/* -------------------------
   テンプレート削除
------------------------- */

function deleteTemplate(templateId) {

  const template =
    chartTemplates.find(
      template =>
        template.id === templateId
    );


  if (!template) return;


  if (
    !confirm(
      `テンプレート「${template.name}」を削除する？`
    )
  ) {
    return;
  }


  chartTemplates =
    chartTemplates.filter(
      template =>
        template.id !== templateId
    );


  persistTemplates();

  renderTemplateList();
}


/* -------------------------
   renderCharts v0.4
------------------------- */

renderCharts = function() {

  const item = items.find(
    item => item.id === currentItemId
  );


  const container =
    document.getElementById(
      "chartsContainer"
    );


  if (!container) return;


  container.innerHTML = "";


  if (!item?.charts?.length) {

    container.innerHTML = `

      <div class="chart-placeholder">

        🕸️

        <br><br>

        まだ評価チャートがありません

        <br>

        <small>
          新しく作るか、
          保存したテンプレートを使ってみよう
        </small>

      </div>

    `;

    return;
  }


  item.charts.forEach(chart => {

    const average =
      chart.axes.reduce(
        (sum, axis) =>
          sum + axis.value,
        0
      ) / chart.axes.length;


    const card =
      document.createElement("div");


    card.className =
      "radar-card";


    card.innerHTML = `

      <div class="radar-head">

        <div>

          <h3>
            ${escapeHTML(chart.name)}
          </h3>

          <div class="chart-average">

            ⭐ ${average.toFixed(1)}

            <span>
              / ${chart.max}
            </span>

          </div>

        </div>


        <button
          class="chart-delete"
          onclick="
            openChartActionMenu('${chart.id}')
          "
        >
          •••
        </button>

      </div>


      ${createRadarSVG(chart)}

    `;


    container.appendChild(card);

  });

};


/* 既存の追加ボタンをv0.4へ */

addChartComingSoon = function() {
  openAddChartMenu();
};
/* =====================================
   MyScale v0.5
   カスタム情報項目
===================================== */

let selectedFieldType = null;

function ensureCustomFields(item) {
  if (!Array.isArray(item.customFields)) {
    item.customFields = [];
  }
}

function openAddFieldMenu() {
  document
    .getElementById("addFieldModal")
    .classList.add("show");
}

function closeAddFieldMenu() {
  document
    .getElementById("addFieldModal")
    .classList.remove("show");
}

function chooseFieldType(type) {
  selectedFieldType = type;

  closeAddFieldMenu();

  document.getElementById("fieldLabel").value = "";
  document.getElementById("fieldValue").value = "";

  const valueInput =
    document.getElementById("fieldValue");

  const yesNoArea =
    document.getElementById("yesNoArea");

  valueInput.hidden = false;
  yesNoArea.hidden = true;

  if (type === "text") {
    document.getElementById(
      "fieldEditorTitle"
    ).textContent = "📝 テキスト項目";

    valueInput.placeholder =
      "例：ツンデレ";
  }

  if (type === "number") {
    document.getElementById(
      "fieldEditorTitle"
    ).textContent = "🔢 数値項目";

    valueInput.placeholder =
      "例：157 cm";
  }

  if (type === "boolean") {
    document.getElementById(
      "fieldEditorTitle"
    ).textContent = "☑️ Yes / No";

    valueInput.hidden = true;
    yesNoArea.hidden = false;

    document.querySelector(
      'input[name="booleanValue"][value="yes"]'
    ).checked = true;
  }

  document
    .getElementById("fieldEditorModal")
    .classList.add("show");
}

function closeFieldEditor() {
  document
    .getElementById("fieldEditorModal")
    .classList.remove("show");

  selectedFieldType = null;
}

function saveCustomField() {
  const item = items.find(
    item => item.id === currentItemId
  );

  if (!item) return;

  ensureCustomFields(item);

  const label =
    document.getElementById("fieldLabel")
      .value.trim();

  if (!label) {
    alert("項目名を入力してね！");
    return;
  }

  let value = "";

  if (selectedFieldType === "boolean") {
    value =
      document.querySelector(
        'input[name="booleanValue"]:checked'
      )?.value || "yes";
  } else {
    value =
      document.getElementById("fieldValue")
        .value.trim();

    if (!value) {
      alert("内容を入力してね！");
      return;
    }
  }

  item.customFields.push({
    id: makeId(),
    type: selectedFieldType,
    label,
    value,
    createdAt: Date.now()
  });

  item.updatedAt = Date.now();

  persist();

  closeFieldEditor();
  renderCustomFields();
}

function renderCustomFields() {
  const item = items.find(
    item => item.id === currentItemId
  );

  const container =
    document.getElementById(
      "customFieldsContainer"
    );

  if (!container || !item) return;

  ensureCustomFields(item);

  container.innerHTML = "";

  if (!item.customFields.length) {
    container.innerHTML = `
      <div class="custom-empty">
        まだ情報項目がありません
      </div>
    `;
    return;
  }

  item.customFields.forEach(field => {
    const row =
      document.createElement("div");

    row.className = "custom-field-row";

    let displayValue =
      escapeHTML(field.value);

    if (field.type === "boolean") {
      displayValue =
        field.value === "yes"
          ? "YES"
          : "NO";
    }

    row.innerHTML = `
      <div class="custom-field-main">
        <span>
          ${escapeHTML(field.label)}
        </span>

        <strong>
          ${displayValue}
        </strong>
      </div>

      <button
        class="custom-field-delete"
        onclick="
          deleteCustomField('${field.id}')
        "
      >
        •••
      </button>
    `;

    container.appendChild(row);
  });
}

function deleteCustomField(fieldId) {
  const item = items.find(
    item => item.id === currentItemId
  );

  if (!item) return;

  ensureCustomFields(item);

  const field =
    item.customFields.find(
      field => field.id === fieldId
    );

  if (!field) return;

  if (
    !confirm(
      `「${field.label}」を削除する？`
    )
  ) {
    return;
  }

  item.customFields =
    item.customFields.filter(
      field => field.id !== fieldId
    );

  persist();
  renderCustomFields();
}


/* 対象詳細表示にカスタム項目描画を追加 */

const renderItemDetailBeforeV05 =
  renderItemDetail;

renderItemDetail = function() {
  renderItemDetailBeforeV05();
  renderCustomFields();
};
/* =========================
   MyScale v0.5.1
   閲覧 / 編集モード
========================= */

let itemEditMode = false;

function applyItemEditMode() {
  const itemView =
    document.getElementById("itemView");

  const editButton =
    document.getElementById("itemEditButton");

  if (!itemView || !editButton) return;

  itemView.classList.toggle(
    "edit-mode",
    itemEditMode
  );

  editButton.textContent =
    itemEditMode ? "完了" : "編集";
}

function toggleItemEditMode() {
  itemEditMode = !itemEditMode;

  applyItemEditMode();

  renderCustomFields();
  renderCharts();
}


/* 対象を開いた時は必ず閲覧モード */

const openItemBeforeV051 = openItem;

openItem = function(id) {
  itemEditMode = false;

  openItemBeforeV051(id);

  applyItemEditMode();
};
