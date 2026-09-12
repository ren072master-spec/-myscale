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
/* =========================
   MyScale v0.5.2
   バックアップ / 復元
========================= */

function openSettings() {
  document
    .getElementById("settingsModal")
    ?.classList.add("show");
}

function closeSettings() {
  document
    .getElementById("settingsModal")
    ?.classList.remove("show");
}


/* -------------------------
   バックアップ書き出し
------------------------- */

function exportMyScaleData() {

  const backup = {
    app: "MyScale",
    version: "0.5.2",
    exportedAt: new Date().toISOString(),

    data: {
      categories: categories,
      items: items,
      chartTemplates: chartTemplates
    }
  };

  const json = JSON.stringify(
    backup,
    null,
    2
  );

  const blob = new Blob(
    [json],
    {
      type: "application/json"
    }
  );

  const url =
    URL.createObjectURL(blob);

  const link =
    document.createElement("a");

  const date =
    new Date()
      .toISOString()
      .slice(0, 10);

  link.href = url;

  link.download =
    `myscale-backup-${date}.json`;

  document.body.appendChild(link);

  link.click();

  link.remove();

  URL.revokeObjectURL(url);
}


/* -------------------------
   復元ファイル選択
------------------------- */

function chooseBackupFile() {

  const input =
    document.getElementById(
      "backupFileInput"
    );

  if (!input) return;

  input.value = "";

  input.click();
}


/* -------------------------
   バックアップ復元
------------------------- */

function importMyScaleData(event) {

  const file =
    event.target.files?.[0];

  if (!file) return;

  const reader =
    new FileReader();

  reader.onload = function() {

    try {

      const backup =
        JSON.parse(reader.result);

      if (
        backup?.app !== "MyScale" ||
        !backup?.data ||
        !Array.isArray(
          backup.data.categories
        ) ||
        !Array.isArray(
          backup.data.items
        )
      ) {
        throw new Error(
          "MyScaleのバックアップではありません"
        );
      }

      const ok = confirm(
        "現在のMyScaleデータを、" +
        "このバックアップ内容で置き換えます。\n\n" +
        "よろしいですか？"
      );

      if (!ok) return;

      categories =
        backup.data.categories;

      items =
        backup.data.items;

      chartTemplates =
        Array.isArray(
          backup.data.chartTemplates
        )
          ? backup.data.chartTemplates
          : [];

      persist();

      persistTemplates();

      closeSettings();

      showHome();

      alert(
        "バックアップを復元しました！"
      );

    } catch (error) {

      console.error(error);

      alert(
        "このファイルは読み込めませんでした。\n" +
        "MyScaleのバックアップJSONを選んでね。"
      );
    }
  };

  reader.readAsText(file);
}


/* -------------------------
   下ナビ「設定」を有効化
------------------------- */

document
  .querySelectorAll("nav button")
  .forEach(button => {

    if (
      button.textContent.includes("設定")
    ) {
      button.onclick =
        openSettings;
    }

  });
/* =========================
   MyScale v0.6
   基本情報 編集 / 削除
========================= */

let selectedCustomFieldId = null;
let editingCustomFieldId = null;


/* -------------------------
   ••• メニューを開く
------------------------- */

function openFieldActionMenu(fieldId) {

  const item = items.find(
    item => item.id === currentItemId
  );

  if (!item) return;

  ensureCustomFields(item);

  const field = item.customFields.find(
    field => field.id === fieldId
  );

  if (!field) return;

  selectedCustomFieldId = fieldId;

  document.getElementById(
    "fieldActionTitle"
  ).textContent = field.label;

  document
    .getElementById("fieldActionModal")
    .classList.add("show");
}


function closeFieldActionMenu() {

  document
    .getElementById("fieldActionModal")
    ?.classList.remove("show");

  selectedCustomFieldId = null;
}


/* -------------------------
   編集
------------------------- */

function actionEditCustomField() {

  const fieldId = selectedCustomFieldId;

  const item = items.find(
    item => item.id === currentItemId
  );

  const field = item?.customFields?.find(
    field => field.id === fieldId
  );

  if (!field) return;

  editingCustomFieldId = fieldId;

  closeFieldActionMenu();

  selectedFieldType = field.type;

  document.getElementById(
    "fieldLabel"
  ).value = field.label;

  const valueInput =
    document.getElementById("fieldValue");

  const yesNoArea =
    document.getElementById("yesNoArea");

  valueInput.hidden = false;
  yesNoArea.hidden = true;

  if (field.type === "text") {

    document.getElementById(
      "fieldEditorTitle"
    ).textContent = "📝 テキスト項目を編集";

    valueInput.value = field.value;
  }

  if (field.type === "number") {

    document.getElementById(
      "fieldEditorTitle"
    ).textContent = "🔢 数値項目を編集";

    valueInput.value = field.value;
  }

  if (field.type === "boolean") {

    document.getElementById(
      "fieldEditorTitle"
    ).textContent = "☑️ Yes / No を編集";

    valueInput.hidden = true;
    yesNoArea.hidden = false;

    const radio = document.querySelector(
      `input[name="booleanValue"][value="${field.value}"]`
    );

    if (radio) {
      radio.checked = true;
    }
  }

  document
    .getElementById("fieldEditorModal")
    .classList.add("show");
}


/* -------------------------
   削除
------------------------- */

function actionDeleteCustomField() {

  const fieldId = selectedCustomFieldId;

  closeFieldActionMenu();

  deleteCustomField(fieldId);
}


/* -------------------------
   既存保存処理を編集対応へ
------------------------- */

const saveCustomFieldBeforeV06 =
  saveCustomField;

saveCustomField = function() {

  if (!editingCustomFieldId) {
    saveCustomFieldBeforeV06();
    return;
  }

  const item = items.find(
    item => item.id === currentItemId
  );

  if (!item) return;

  ensureCustomFields(item);

  const field = item.customFields.find(
    field => field.id === editingCustomFieldId
  );

  if (!field) return;

  const label =
    document.getElementById("fieldLabel")
      .value.trim();

  if (!label) {
    alert("項目名を入力してね！");
    return;
  }

  let value = "";

  if (field.type === "boolean") {

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

  field.label = label;
  field.value = value;
  field.updatedAt = Date.now();

  item.updatedAt = Date.now();

  persist();

  editingCustomFieldId = null;

  closeFieldEditor();

  renderCustomFields();
};


/* -------------------------
   新規追加時は編集状態解除
------------------------- */

const chooseFieldTypeBeforeV06 =
  chooseFieldType;

chooseFieldType = function(type) {

  editingCustomFieldId = null;

  chooseFieldTypeBeforeV06(type);
};


/* -------------------------
   ••• を編集メニューに変更
------------------------- */

renderCustomFields = function() {

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
          openFieldActionMenu('${field.id}')
        "
      >
        •••
      </button>
    `;

    container.appendChild(row);
  });
};
/* =========================
   MyScale v0.6.1
   メモ・タグ編集
========================= */

function openMemoEditor() {
  const item = items.find(
    item => item.id === currentItemId
  );

  if (!item) return;

  const memoInput =
    document.getElementById("memoEditValue");

  const tagsInput =
    document.getElementById("memoEditTags");

  if (!memoInput || !tagsInput) return;

  memoInput.value = item.memo || "";

  tagsInput.value =
    Array.isArray(item.tags)
      ? item.tags.join(" ")
      : "";

  document
    .getElementById("memoEditorModal")
    ?.classList.add("show");
}


function closeMemoEditor() {
  document
    .getElementById("memoEditorModal")
    ?.classList.remove("show");
}


function saveMemoEdit() {
  const item = items.find(
    item => item.id === currentItemId
  );

  if (!item) return;

  const memo =
    document
      .getElementById("memoEditValue")
      .value.trim();

  const tagsText =
    document
      .getElementById("memoEditTags")
      .value.trim();

  const tags = tagsText
    ? tagsText
        .split(/\s+/)
        .map(tag => tag.replace(/^#/, ""))
        .filter(Boolean)
    : [];

  item.memo = memo;
  item.tags = tags;
  item.updatedAt = Date.now();

  persist();

  closeMemoEditor();

  renderItemDetail();
  applyItemEditMode();
}
/* =========================
   MyScale v0.6.2
   対象情報編集
========================= */

let itemInfoSelectedEmoji = "👤";

function openItemInfoEditor() {
  const item = items.find(
    item => item.id === currentItemId
  );

  if (!item) return;

  document.getElementById(
    "itemInfoName"
  ).value = item.name || "";

  itemInfoSelectedEmoji =
    item.emoji || "👤";

  renderItemInfoEmojiChoices();
  renderItemInfoCategoryChoices(item);

  document
    .getElementById("itemInfoEditorModal")
    ?.classList.add("show");
}


function closeItemInfoEditor() {
  document
    .getElementById("itemInfoEditorModal")
    ?.classList.remove("show");
}


function renderItemInfoEmojiChoices() {
  const container =
    document.getElementById(
      "itemInfoEmojiChoices"
    );

  if (!container) return;

  container.innerHTML = "";

  emojiChoices.forEach(emoji => {
    const button =
      document.createElement("button");

    button.type = "button";
    button.textContent = emoji;

    button.className =
      emoji === itemInfoSelectedEmoji
        ? "emoji-option selected"
        : "emoji-option";

    button.onclick = function() {
      itemInfoSelectedEmoji = emoji;
      renderItemInfoEmojiChoices();
    };

    container.appendChild(button);
  });
}


function renderItemInfoCategoryChoices(item) {
  const select =
    document.getElementById(
      "itemInfoCategory"
    );

  if (!select) return;

  select.innerHTML = "";

  categories.forEach(category => {
    const option =
      document.createElement("option");

    option.value = category.id;
    option.textContent =
      `${category.emoji || "📁"} ${category.name}`;

    if (category.id === item.categoryId) {
      option.selected = true;
    }

    select.appendChild(option);
  });
}


function saveItemInfoEdit() {
  const item = items.find(
    item => item.id === currentItemId
  );

  if (!item) return;

  const name =
    document
      .getElementById("itemInfoName")
      .value.trim();

  const categoryId =
    document
      .getElementById("itemInfoCategory")
      .value;

  if (!name) {
    alert("名前を入力してね！");
    return;
  }

  if (!categoryId) {
    alert("カテゴリーを選んでね！");
    return;
  }

  item.name = name;
  item.emoji = itemInfoSelectedEmoji;
  item.categoryId = categoryId;
  item.updatedAt = Date.now();

  persist();

  closeItemInfoEditor();

  renderItemDetail();
  applyItemEditMode();
}
/* =========================
   MyScale v0.7
   詳細カード並び替え
========================= */

const DEFAULT_SECTION_ORDER = [
  "memo",
  "info",
  "charts"
];

function ensureSectionOrder(item) {
  if (
    !Array.isArray(item.sectionOrder) ||
    item.sectionOrder.length !== 3
  ) {
    item.sectionOrder = [
      ...DEFAULT_SECTION_ORDER
    ];
  }
}


function applySectionOrder() {
  const item = items.find(
    item => item.id === currentItemId
  );

  if (!item) return;

  ensureSectionOrder(item);

  const cards = {};

  document
    .querySelectorAll(
      "#itemView .reorder-card"
    )
    .forEach(card => {
      cards[card.dataset.section] = card;
    });

  const firstCard =
    cards[
      item.sectionOrder[0]
    ];

  if (!firstCard) return;

  const parent =
    firstCard.parentElement;

  item.sectionOrder.forEach(
    section => {
      const card = cards[section];

      if (card) {
        parent.appendChild(card);
      }
    }
  );

  renderSectionControls();
}


function renderSectionControls() {
  document
    .querySelectorAll(
      ".section-order-controls"
    )
    .forEach(el => el.remove());

  if (!itemEditMode) return;

  const item = items.find(
    item => item.id === currentItemId
  );

  if (!item) return;

  ensureSectionOrder(item);

  item.sectionOrder.forEach(section => {
    const card =
      document.querySelector(
        `.reorder-card[data-section="${section}"]`
      );

    if (!card) return;

    const handle =
      document.createElement("div");

    handle.className =
      "section-order-controls section-drag-handle";

    handle.textContent = "☰";

    handle.setAttribute(
      "aria-label",
      "並び替え"
    );

    handle.addEventListener(
      "pointerdown",
      event => {
        event.preventDefault();
        event.stopPropagation();

        startSectionDrag(
          event,
          card,
          section
        );
      }
    );

    card.prepend(handle);
  });
}

function moveSection(section, direction) {
  const item = items.find(
    item => item.id === currentItemId
  );

  if (!item) return;

  ensureSectionOrder(item);

  const index =
    item.sectionOrder.indexOf(section);

  const nextIndex =
    index + direction;

  if (
    index < 0 ||
    nextIndex < 0 ||
    nextIndex >=
      item.sectionOrder.length
  ) {
    return;
  }

  const newOrder = [
    ...item.sectionOrder
  ];

  [
    newOrder[index],
    newOrder[nextIndex]
  ] = [
    newOrder[nextIndex],
    newOrder[index]
  ];

  item.sectionOrder = newOrder;
  item.updatedAt = Date.now();

  persist();

  applySectionOrder();
}


/* -------------------------
   編集モードとの連動
------------------------- */

const applyItemEditModeBeforeV07 =
  applyItemEditMode;

applyItemEditMode = function() {
  applyItemEditModeBeforeV07();
  renderSectionControls();
};


/* -------------------------
   対象詳細表示との連動
------------------------- */

const renderItemDetailBeforeV07 =
  renderItemDetail;

renderItemDetail = function() {
  renderItemDetailBeforeV07();
  applySectionOrder();
};
/* =========================
   MyScale v0.8
   カテゴリー編集モード
========================= */

let categoryEditMode = false;
let categoryEditSelectedEmoji = "📁";


function applyCategoryEditMode() {
  const categoryView =
    document.getElementById("categoryView");

  const editButton =
    document.getElementById("categoryEditButton");

  if (!categoryView || !editButton) return;

  categoryView.classList.toggle(
    "edit-mode",
    categoryEditMode
  );

  editButton.textContent =
    categoryEditMode ? "完了" : "編集";
}


function toggleCategoryEditMode() {
  categoryEditMode = !categoryEditMode;

  applyCategoryEditMode();

  renderCategoryItems();
}


/* -------------------------
   カテゴリー編集画面
------------------------- */

function openCategoryEditor() {
  const category = categories.find(
    category => category.id === currentCategoryId
  );

  if (!category) return;

  document.getElementById(
    "categoryEditName"
  ).value = category.name || "";

  categoryEditSelectedEmoji =
    category.emoji || "📁";

  renderCategoryEditEmojiChoices();

  document
    .getElementById("categoryEditorModal")
    ?.classList.add("show");
}


function closeCategoryEditor() {
  document
    .getElementById("categoryEditorModal")
    ?.classList.remove("show");
}


function renderCategoryEditEmojiChoices() {
  const container =
    document.getElementById(
      "categoryEditEmojiChoices"
    );

  if (!container) return;

  container.innerHTML = "";

  emojiChoices.forEach(emoji => {
    const button =
      document.createElement("button");

    button.type = "button";
    button.textContent = emoji;

    button.className =
      emoji === categoryEditSelectedEmoji
        ? "emoji-option selected"
        : "emoji-option";

    button.onclick = function() {
      categoryEditSelectedEmoji = emoji;
      renderCategoryEditEmojiChoices();
    };

    container.appendChild(button);
  });
}


function saveCategoryEdit() {
  const category = categories.find(
    category => category.id === currentCategoryId
  );

  if (!category) return;

  const name =
    document
      .getElementById("categoryEditName")
      .value.trim();

  if (!name) {
    alert("カテゴリー名を入力してね！");
    return;
  }

  category.name = name;
  category.emoji = categoryEditSelectedEmoji;
  category.updatedAt = Date.now();

  persist();

  closeCategoryEditor();

  document.getElementById(
    "categoryTitle"
  ).textContent =
    `${category.emoji} ${category.name}`;

  renderCategoryItems();
}


/* -------------------------
   カテゴリーを開いた時は閲覧モード
------------------------- */

const openCategoryBeforeV08 =
  openCategory;

openCategory = function(id) {
  categoryEditMode = false;

  openCategoryBeforeV08(id);

  applyCategoryEditMode();
};
/* =========================
   MyScale v0.8
   カテゴリー内 対象並び替え
========================= */

function getCategoryOrderedItems() {
  const category = categories.find(
    category => category.id === currentCategoryId
  );

  if (!category) return [];

  const categoryItems = items.filter(
    item => item.categoryId === currentCategoryId
  );

  if (!Array.isArray(category.itemOrder)) {
    category.itemOrder =
      categoryItems.map(item => item.id);
  }

  const validIds = new Set(
    categoryItems.map(item => item.id)
  );

  category.itemOrder =
    category.itemOrder.filter(
      id => validIds.has(id)
    );

  categoryItems.forEach(item => {
    if (!category.itemOrder.includes(item.id)) {
      category.itemOrder.push(item.id);
    }
  });

  return category.itemOrder
    .map(id =>
      categoryItems.find(item => item.id === id)
    )
    .filter(Boolean);
}
/* -------------------------
   対象カード並び替え表示
------------------------- */

const renderCategoryItemsBeforeOrder =
  renderCategoryItems;

renderCategoryItems = function() {
  const container =
    document.getElementById("categoryItems");

  if (!container) return;

  const categoryItems =
    getCategoryOrderedItems();

  container.innerHTML = "";

  categoryItems.forEach((item, index) => {
    const card =
      document.createElement("button");

    card.className = "item-card";

    card.onclick = () => {
      if (!categoryEditMode) {
        openItem(item.id);
      }
    };

    card.innerHTML = `
      <div class="emoji">
        ${escapeHTML(item.emoji || "⭐")}
      </div>

      <h2>${escapeHTML(item.name)}</h2>

      <div class="count">
        ${
          item.tags?.length
            ? item.tags
                .map(
                  tag =>
                    "#" + escapeHTML(tag)
                )
                .join(" ")
            : "評価はこれから"
        }
      </div>
    `;

        if (categoryEditMode) {
      const handle =
        document.createElement("span");

      handle.className =
        "category-item-drag-handle";

      handle.textContent = "☰";

      handle.setAttribute(
        "aria-label",
        "並び替え"
      );

      card.dataset.itemId = item.id;

      handle.addEventListener(
        "pointerdown",
        event => {
          event.preventDefault();
          event.stopPropagation();

          startCategoryItemDrag(
            event,
            card,
            item.id
          );
        }
      );

      card.appendChild(handle);
    }

    container.appendChild(card);
  });

  const add =
    document.createElement("button");

  add.className =
    "item-card new-card";

  add.onclick = openItemCreator;

  add.innerHTML = `
    <div class="plus">＋</div>
    <h2>対象を追加</h2>
  `;

  container.appendChild(add);
};


/* -------------------------
   対象の順番を移動
------------------------- */

function moveCategoryItem(itemId, direction) {
  const category = categories.find(
    category =>
      category.id === currentCategoryId
  );

  if (!category) return;

  getCategoryOrderedItems();

  const index =
    category.itemOrder.indexOf(itemId);

  const nextIndex =
    index + direction;

  if (
    index < 0 ||
    nextIndex < 0 ||
    nextIndex >= category.itemOrder.length
  ) {
    return;
  }

  [
    category.itemOrder[index],
    category.itemOrder[nextIndex]
  ] = [
    category.itemOrder[nextIndex],
    category.itemOrder[index]
  ];

  category.updatedAt = Date.now();

  persist();

  renderCategoryItems();
}
/* =========================
   v0.8 カテゴリー対象ドラッグ
========================= */

function startCategoryItemDrag(
  event,
  card,
  itemId
) {
  if (!categoryEditMode) return;

  const category = categories.find(
    category =>
      category.id === currentCategoryId
  );

  if (!category) return;

  getCategoryOrderedItems();

  const pointerId = event.pointerId;

  const startX = event.clientX;
  const startY = event.clientY;

  let currentX = startX;
  let currentY = startY;

  card.classList.add("is-dragging");

  document.body.classList.add(
    "category-item-dragging"
  );

  function move(pointerEvent) {
    if (
      pointerEvent.pointerId !== pointerId
    ) {
      return;
    }

    pointerEvent.preventDefault();

    currentX = pointerEvent.clientX;
    currentY = pointerEvent.clientY;

    const deltaX =
      currentX - startX;

    const deltaY =
      currentY - startY;

    card.style.transform =
      `translate(${deltaX}px, ${deltaY}px) scale(1.04)`;

    card.style.zIndex = "100";
    card.style.pointerEvents = "none";
  }

  function end(pointerEvent) {
    if (
      pointerEvent.pointerId !== pointerId
    ) {
      return;
    }

    window.removeEventListener(
      "pointermove",
      move
    );

    window.removeEventListener(
      "pointerup",
      end
    );

    window.removeEventListener(
      "pointercancel",
      end
    );

    const cards = [
      ...document.querySelectorAll(
        "#categoryItems .item-card[data-item-id]"
      )
    ].filter(
      target => target !== card
    );

    let nearestCard = null;
    let nearestDistance = Infinity;

    cards.forEach(target => {
      const rect =
        target.getBoundingClientRect();

      const centerX =
        rect.left + rect.width / 2;

      const centerY =
        rect.top + rect.height / 2;

      const distance =
        Math.hypot(
          currentX - centerX,
          currentY - centerY
        );

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestCard = target;
      }
    });

    card.style.transform = "";
    card.style.zIndex = "";
    card.style.pointerEvents = "";

    card.classList.remove(
      "is-dragging"
    );

    document.body.classList.remove(
      "category-item-dragging"
    );

    if (nearestCard) {
      const targetId =
        nearestCard.dataset.itemId;

      const newOrder = [
        ...category.itemOrder
      ];

      const fromIndex =
        newOrder.indexOf(itemId);

      const targetIndex =
        newOrder.indexOf(targetId);

      if (
        fromIndex >= 0 &&
        targetIndex >= 0 &&
        fromIndex !== targetIndex
      ) {
                [
          newOrder[fromIndex],
          newOrder[targetIndex]
        ] = [
          newOrder[targetIndex],
          newOrder[fromIndex]
        ];

        category.itemOrder =
          newOrder;

        category.updatedAt =
          Date.now();

        persist();
      }
    }

    renderCategoryItems();
  }

  window.addEventListener(
    "pointermove",
    move,
    { passive: false }
  );

  window.addEventListener(
    "pointerup",
    end
  );

  window.addEventListener(
    "pointercancel",
    end
  );
}
/* =========================
   v0.8 詳細カードドラッグ
========================= */

function startSectionDrag(
  event,
  card,
  section
) {
  if (!itemEditMode) return;

  const item = items.find(
    item => item.id === currentItemId
  );

  if (!item) return;

  ensureSectionOrder(item);

  const pointerId = event.pointerId;

  const startX = event.clientX;
  const startY = event.clientY;

  const startScrollY = window.scrollY;

  let currentX = startX;
  let currentY = startY;

  let autoScrollDirection = 0;
  let autoScrollFrame = null;

  card.classList.add(
    "is-section-dragging"
  );

  function updateCardPosition() {
    const deltaX =
      currentX - startX;

    const deltaY =
      currentY -
      startY +
      (window.scrollY - startScrollY);

    card.style.transform =
      `translate(${deltaX}px, ${deltaY}px) scale(1.02)`;

    card.style.zIndex = "100";
    card.style.pointerEvents = "none";
  }

  function runAutoScroll() {
    if (!autoScrollDirection) {
      autoScrollFrame = null;
      return;
    }

    window.scrollBy(
      0,
      autoScrollDirection * 8
    );

    updateCardPosition();

    autoScrollFrame =
      requestAnimationFrame(
        runAutoScroll
      );
  }

  function updateAutoScroll() {
    const edgeSize = 90;

    let nextDirection = 0;

    if (currentY < edgeSize) {
      nextDirection = -1;
    } else if (
      currentY >
      window.innerHeight - edgeSize
    ) {
      nextDirection = 1;
    }

    autoScrollDirection =
      nextDirection;

    if (
      autoScrollDirection &&
      autoScrollFrame === null
    ) {
      autoScrollFrame =
        requestAnimationFrame(
          runAutoScroll
        );
    }
  }

  function stopAutoScroll() {
    autoScrollDirection = 0;

    if (autoScrollFrame !== null) {
      cancelAnimationFrame(
        autoScrollFrame
      );

      autoScrollFrame = null;
    }
  }

  function move(pointerEvent) {
    if (
      pointerEvent.pointerId !== pointerId
    ) {
      return;
    }

    pointerEvent.preventDefault();

    currentX = pointerEvent.clientX;
    currentY = pointerEvent.clientY;

    updateCardPosition();
    updateAutoScroll();
  }

  function end(pointerEvent) {
    if (
      pointerEvent.pointerId !== pointerId
    ) {
      return;
    }

    stopAutoScroll();

    window.removeEventListener(
      "pointermove",
      move
    );

    window.removeEventListener(
      "pointerup",
      end
    );

    window.removeEventListener(
      "pointercancel",
      end
    );

    const cards = [
      ...document.querySelectorAll(
        "#itemView .reorder-card[data-section]"
      )
    ].filter(
      target => target !== card
    );

    let nearestCard = null;
    let nearestDistance = Infinity;

    cards.forEach(target => {
      const rect =
        target.getBoundingClientRect();

      const centerX =
        rect.left + rect.width / 2;

      const centerY =
        rect.top + rect.height / 2;

      const distance =
        Math.hypot(
          currentX - centerX,
          currentY - centerY
        );

      if (
        distance < nearestDistance
      ) {
        nearestDistance = distance;
        nearestCard = target;
      }
    });

    card.style.transform = "";
    card.style.zIndex = "";
    card.style.pointerEvents = "";

    card.classList.remove(
      "is-section-dragging"
    );

    if (nearestCard) {
      const targetSection =
        nearestCard.dataset.section;

      const newOrder = [
        ...item.sectionOrder
      ];

      const fromIndex =
        newOrder.indexOf(section);

      const targetIndex =
        newOrder.indexOf(
          targetSection
        );

      if (
        fromIndex >= 0 &&
        targetIndex >= 0 &&
        fromIndex !== targetIndex
      ) {
        [
          newOrder[fromIndex],
          newOrder[targetIndex]
        ] = [
          newOrder[targetIndex],
          newOrder[fromIndex]
        ];

        item.sectionOrder =
          newOrder;

        item.updatedAt =
          Date.now();

        persist();
      }
    }

    applySectionOrder();
  }

  window.addEventListener(
    "pointermove",
    move,
    { passive: false }
  );

  window.addEventListener(
    "pointerup",
    end
  );

  window.addEventListener(
    "pointercancel",
    end
  );
}
