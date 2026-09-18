import { parseGradeHTML } from "./parser.js";
import { evaluate, DEFAULT_CONFIG, BUCKET_LABELS, REQUIREMENTS_2023 } from "./core.js";

const LS_KEY = "isi-grad-check";

const state = {
  html: "",
  courses: [],
  overrides: {},
  result: null,
};

const $ = id => document.getElementById(id);
const escapeHtml = s => String(s ?? "").replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
const fmt = n => Number.isInteger(n) ? String(n) : n.toFixed(1);
const clamp100 = n => Math.max(0, Math.min(100, n));

function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (saved.html) state.html = saved.html;
    if (saved.overrides) state.overrides = saved.overrides;
  } catch {
    state.html = "";
  }
}

function saveState() {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ html: state.html, overrides: state.overrides }));
  } catch {
    /* storage unavailable */
  }
}

function run() {
  const { courses, error } = parseGradeHTML(state.html);
  if (error) {
    $("parseError").textContent = error;
    $("parseError").hidden = false;
    $("result").hidden = true;
    return;
  }
  $("parseError").hidden = true;
  state.courses = courses;
  state.result = evaluate(courses, DEFAULT_CONFIG, state.overrides);
  $("result").hidden = false;
  renderAll();
  saveState();
}

function renderAll() {
  const r = state.result;
  if (!r) return;
  renderSummary(r);
  renderMissing(r);
  renderProgress(r);
  renderOthers(r);
  renderCourseTable(r);
  renderExcluded(r);
}

function inferSecondLanguage(r) {
  const counts = {};
  for (const e of r.courses) {
    if (e.bucket !== "lang2") continue;
    const lang = detectLanguage(e.course.name);
    counts[lang] = (counts[lang] || 0) + e.course.credits;
  }
  let best = null;
  for (const [lang, credits] of Object.entries(counts)) {
    if (!best || credits > best.credits) best = { lang, credits };
  }
  return best;
}

function detectLanguage(name) {
  const langs = [
    "中国語", "ロシア語", "ドイツ語", "フランス語", "スペイン語", "韓国語", "アラビア語",
    "イタリア語", "ポルトガル語", "ベトナム語", "インドネシア語", "タイ語", "モンゴル語",
    "ヒンディー語", "ラテン語", "ギリシャ語", "トルコ語", "ウクライナ語", "オランダ語",
    "スウェーデン語", "ノルウェー語", "デンマーク語", "フィンランド語", "ポーランド語",
    "チェコ語", "ハンガリー語", "ルーマニア語",
  ];
  for (const lang of langs) if (name.includes(lang)) return lang;
  return "その他の言語";
}

function renderSummary(r) {
  const allOk = r.missing.length === 0;
  const lang2 = inferSecondLanguage(r);
  const lang2Html = lang2 ? `${escapeHtml(lang2.lang)}（${fmt(lang2.credits)}単位）` : "なし";
  $("summary").innerHTML = `
    <div class="row" style="align-items:center">
      <span class="badge ${allOk ? "ok" : "ng"}">${allOk ? "卒業要件を満たしています" : "不足があります"}</span>
    </div>
    <div class="summary-grid">
      <div class="stat"><div class="num">${fmt(r.totalCredits)} / ${r.totalRequired} 単位</div><div class="lbl">総修得単位数（卒業まであと ${fmt(Math.max(0, r.totalRequired - r.totalCredits))} 単位）</div></div>
      <div class="stat"><div class="num">${r.missing.length} 項目</div><div class="lbl">要件別の不足項目（指定科目は優先して履修）</div></div>
      <div class="stat"><div class="num">${fmt(r.totalShort)} 単位</div><div class="lbl">要件別の不足単位の合計</div></div>
      <div class="stat"><div class="num">${escapeHtml(lang2Html)}</div><div class="lbl">第2外国語（データから自動推定）</div></div>
    </div>`;
}

function renderMissing(r) {
  const items = r.missing.filter(m => m.label !== "総修得単位数");
  if (!items.length) {
    $("missing").innerHTML = `<h3>不足項目</h3><p style="color:var(--ok)">すべての要件を満たしています。</p>`;
    return;
  }
  const rows = items.map(m => `
    <tr>
      <td>${escapeHtml(m.label)}</td>
      <td class="num">${fmt(m.earned)}</td>
      <td class="num">${fmt(m.required)}</td>
      <td class="num" style="color:var(--ng);font-weight:700">${fmt(m.short)}</td>
    </tr>`).join("");
  $("missing").innerHTML = `
    <h3>不足項目（${items.length}項目）</h3>
    <table>
      <thead><tr><th>区分</th><th class="num">修得</th><th class="num">必要</th><th class="num">不足</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr class="total-row">
        <td>新規に取らなければいけない単位数（要件別の不足単位の合計）</td>
        <td class="num">—</td>
        <td class="num">—</td>
        <td class="num"><b>${fmt(r.totalShort)}単位</b></td>
      </tr></tfoot>
    </table>`;
}

function renderProgress(r) {
  const groups = [
    ["基幹教育科目（48単位）", REQUIREMENTS_2023.kikan],
    ["専攻教育科目（76単位）", REQUIREMENTS_2023.specialized],
  ];
  const html = groups.map(([title, reqs]) => `
    <h3>${title}</h3>
    <div class="progress-wrap">
      ${reqs.map(req => {
        const m = r.ok.find(x => x.label === req.label) || r.missing.find(x => x.label === req.label);
        const pct = clamp100((m.earned / m.required) * 100);
        return `
        <div class="progress-row ${m.earned >= m.required ? "" : "ng"}">
          <div class="name">${escapeHtml(req.label)}</div>
          <div class="val">${fmt(m.earned)} / ${fmt(m.required)}</div>
          <div class="track"><div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div></div>
          <div class="val">${m.earned >= m.required ? "OK" : "不足 " + fmt(m.short)}</div>
        </div>`;
      }).join("")}
    </div>`).join("");
  $("progress").innerHTML = html;
}

function renderOthers(r) {
  const k = r.kikanOthers;
  const s = r.specOthers;
  const b = k.breakdown;
  const sb = s.breakdown;
  $("others").innerHTML = `
    <h3>その他（振替）の内訳</h3>
    <div class="others-grid">
      <div class="others-box">
        <h4>基幹教育科目その他（必要 ${fmt(k.required)} 単位 / 修得 ${fmt(k.earned)} 単位 ${k.earned >= k.required ? "✔" : "✘"}）</h4>
        <table>
          <tr><th>区分</th><th class="num">単位</th></tr>
          <tr><td>A（セミナー・課題協学・文理ディシプリンの超過）</td><td class="num">${fmt(b.A)}</td></tr>
          <tr><td>B（言語文化科目の超過）</td><td class="num">${fmt(b.B)}</td></tr>
          <tr><td>C（サイバー・健康スポーツの超過）</td><td class="num">${fmt(b.C)}</td></tr>
          <tr><td>D（総合科目 = 総合/フロンティア/オープン）</td><td class="num">${fmt(b.D)}</td></tr>
          <tr><td>E（高年次基幹教育の超過）</td><td class="num">${fmt(b.E)}</td></tr>
          <tr><td>F（他学部科目 = 上限${REQUIREMENTS_2023.otherDeptCap}単位）</td><td class="num">${fmt(b.F)}</td></tr>
          <tr><td>→ D/E/F から基幹その他への充当</td><td class="num">${fmt(b.dIntoKikan)}</td></tr>
          <tr><td>→ D/E/F から専攻その他への充当</td><td class="num">${fmt(b.specPortion)}</td></tr>
        </table>
      </div>
      <div class="others-box">
        <h4>専攻教育科目その他（必要 ${fmt(s.required)} 単位 / 修得 ${fmt(s.earned)} 単位 ${s.earned >= s.required ? "✔" : "✘"}）</h4>
        <table>
          <tr><th>区分</th><th class="num">単位</th></tr>
          <tr><td>お（構想科目の超過）</td><td class="num">${fmt(sb.o)}</td></tr>
          <tr><td>か（協働科目の超過 = 上限2単位）</td><td class="num">${fmt(sb.ka)}</td></tr>
          <tr><td>き（経験科目の超過）</td><td class="num">${fmt(sb.ki)}</td></tr>
          <tr><td>く（共創科目 = ディグリープロジェクト+演習+課題 の超過）</td><td class="num">${fmt(sb.ku)}</td></tr>
          <tr><td>共創科目（その他）</td><td class="num">${fmt(sb.iic)}</td></tr>
          <tr><td>手動振替（その他・専攻）</td><td class="num">${fmt(sb.othersSpec)}</td></tr>
          <tr><td>D/E/F からの充当</td><td class="num">${fmt(sb.fromFlexible)}</td></tr>
        </table>
      </div>
    </div>`;
}

const OVERRIDE_OPTIONS = Object.entries(BUCKET_LABELS)
  .filter(([k]) => k !== "excluded")
  .map(([k, v]) => `<option value="${k}">${escapeHtml(v)}</option>`).join("");

function renderCourseTable(r) {
  const unknownCount = r.unknownCourses.length;
  const conflictCount = r.courses.filter(c => c.conflicted).length;
  $("courses").innerHTML = `
    <h3>科目別の扱い（全${r.courses.length + r.excludedCourses.length}科目）
      ${unknownCount ? `<span class="badge ng" style="margin-left:8px">判別不能 ${unknownCount} 科目</span>` : ""}
      ${conflictCount ? `<span class="badge ng" style="margin-left:8px">ジャンル不一致 ${conflictCount} 科目</span>` : ""}
    </h3>
    <div class="course-tools">
      <input type="search" id="courseSearch" placeholder="科目名・コードで検索">
      <select id="bucketFilter"><option value="">すべてのジャンル</option>${OVERRIDE_OPTIONS}</select>
    </div>
    <table>
      <thead><tr>
        <th>科目名</th><th>先生</th><th>扱われたジャンル</th>
        <th class="num">単位数</th><th>成績</th><th>科目コード</th><th>振替（手動）</th>
      </tr></thead>
      <tbody id="courseBody"></tbody>
    </table>
    <p style="font-size:.82rem;color:var(--muted)">※ コード無しでもジャンル見出しで分類。不一致はジャンル優先で赤表示。他学部は上限10単位まで。</p>`;
  $("courseSearch").addEventListener("input", renderCourseRows);
  $("bucketFilter").addEventListener("change", renderCourseRows);
  renderCourseRows();
}

function renderCourseRows() {
  const r = state.result;
  const q = ($("courseSearch")?.value || "").trim().toLowerCase();
  const filter = $("bucketFilter")?.value || "";
  const rows = [...r.courses, ...r.excludedCourses.map(e => ({ course: e.course, bucket: "excluded", evidence: "genre", conflicted: false, excluded: true, reason: e.reason }))];
  const filtered = rows.filter(e => {
    const name = e.course.name.toLowerCase();
    const code = (e.course.code || "").toLowerCase();
    const okQ = !q || name.includes(q) || code.includes(q);
    const okF = !filter || e.bucket === filter;
    return okQ && okF;
  });
  $("courseBody").innerHTML = filtered.map(e => {
    const c = e.course;
    const cls = e.bucket === "unknown" ? "row-unknown" : e.conflicted ? "row-conflict" : e.capped ? "row-capped" : "";
    const tagCls = e.bucket === "unknown" ? "ng" : e.bucket === "excluded" ? "ng" : e.conflicted ? "warn" : "";
    const overrideVal = state.overrides[c.index] || "";
    const select = e.bucket === "excluded"
      ? `<span style="color:var(--muted);font-size:.8rem">${escapeHtml(e.reason)}</span>`
      : `<select data-idx="${c.index}">
           <option value="">自動</option>
           ${OVERRIDE_OPTIONS}
         </select>`;
    return `
      <tr class="${cls}">
        <td>${escapeHtml(c.name)}</td>
        <td>${escapeHtml(c.teacher || "—")}</td>
        <td><span class="bucket-tag ${tagCls}">${escapeHtml(BUCKET_LABELS[e.bucket] || e.bucket)}</span>${e.capped ? " <span class='evidence'>上限超過（一部未算入）</span>" : ""}${e.conflicted ? " <span class='evidence'>不一致</span>" : ""}</td>
        <td class="num">${fmt(c.credits)}</td>
        <td>${escapeHtml(c.rawGrade || "—")}</td>
        <td>${escapeHtml(c.code || "—")}</td>
        <td>${select}</td>
      </tr>`;
  }).join("");
  document.querySelectorAll("#courseBody select").forEach(sel => {
    const idx = Number(sel.dataset.idx);
    sel.value = state.overrides[idx] || "";
    sel.addEventListener("change", () => {
      if (sel.value) state.overrides[idx] = sel.value;
      else delete state.overrides[idx];
      state.result = evaluate(state.courses, DEFAULT_CONFIG, state.overrides);
      renderAll();
      saveState();
    });
  });
}

function renderExcluded(r) {
  if (!r.excludedCourses.length) return;
  $("excluded").innerHTML = `
    <h3>除外された科目（F/W など ${r.excludedCourses.length} 科目）</h3>
    <table>
      <thead><tr><th>科目名</th><th>成績</th><th class="num">単位数</th><th>科目コード</th><th>ジャンル</th></tr></thead>
      <tbody>
        ${r.excludedCourses.map(e => `
          <tr><td>${escapeHtml(e.course.name)}</td><td>${escapeHtml(e.course.rawGrade || "—")}</td>
          <td class="num">${fmt(e.course.credits)}</td><td>${escapeHtml(e.course.code || "—")}</td>
          <td>${escapeHtml(e.course.genre || "—")}</td></tr>`).join("")}
      </tbody>
    </table>`;
}

function onHtmlLoaded() {
  run();
}

$("fileInput").addEventListener("change", ev => {
  const file = ev.target.files[0];
  if (!file) return;
  file.text().then(text => {
    state.html = text;
    onHtmlLoaded();
  });
});

$("pickBtn").addEventListener("click", ev => {
  ev.stopPropagation();
  $("fileInput").click();
});

const dz = $("dropzone");
dz.addEventListener("click", () => $("fileInput").click());
dz.addEventListener("keydown", ev => {
  if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); $("fileInput").click(); }
});
["dragover", "dragenter"].forEach(t => dz.addEventListener(t, ev => {
  ev.preventDefault();
  dz.classList.add("dragover");
}));
["dragleave", "drop"].forEach(t => dz.addEventListener(t, ev => {
  ev.preventDefault();
  dz.classList.remove("dragover");
}));
dz.addEventListener("drop", ev => {
  const file = ev.dataTransfer.files[0];
  if (!file) return;
  file.text().then(text => {
    state.html = text;
    onHtmlLoaded();
  });
});

$("runBtn").addEventListener("click", () => {
  state.html = $("pasteArea").value;
  onHtmlLoaded();
});

$("clearBtn").addEventListener("click", () => {
  state.html = "";
  state.courses = [];
  state.overrides = {};
  state.result = null;
  $("pasteArea").value = "";
  $("result").hidden = true;
  $("parseError").hidden = true;
  try { localStorage.removeItem(LS_KEY); } catch { /* noop */ }
});

loadState();
if (state.html) onHtmlLoaded();