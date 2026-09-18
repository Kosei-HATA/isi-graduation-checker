const FULL_TO_HALF_RE = /[\uFF01-\uFF07\uFF0A-\uFF3A\uFF3E-\uFF5E\u3000]/g;

export function normalizeWidth(str) {
  return String(str ?? "").replace(FULL_TO_HALF_RE, ch => {
    if (ch === "\u3000") return " ";
    return String.fromCharCode(ch.charCodeAt(0) - 0xfee0);
  });
}

const GRADE_ALIASES = {
  "合格": "P",
  "認定": "R",
  "履修中": "IP",
  "履修取消": "W",
  "取消": "W",
  "S": "S", "A": "A", "B": "B", "C": "C", "D": "D", "F": "F",
  "W": "W", "R": "R", "P": "P", "*": "*",
};

export function normalizeGrade(raw) {
  const g = normalizeWidth(String(raw ?? "")).trim();
  if (g in GRADE_ALIASES) return GRADE_ALIASES[g];
  return null;
}

const CODE_RE = /^[A-Za-z]{2,4}-[A-Za-z]{2,4}\d{3,5}[A-Za-z]?$/;
const CREDIT_RE = /^\d+(\.\d+)?$/;

function cleanText(s) {
  return normalizeWidth(String(s ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">"))
    .replace(/\s+/g, " ")
    .trim();
}

export function parseGradeHTML(html) {
  const src = String(html ?? "").replace(/^\uFEFF/, "");
  if (!src.trim()) return { courses: [], error: "HTMLが空です。成績照会ページのHTMLを貼り付けてください。" };
  const trs = [...src.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
  if (!trs.length) return { courses: [], error: "表が見つかりません。成績照会ページのHTMLを貼り付けてください。" };
  const courses = [];
  let genre = null;
  let rowIndex = -1;
  for (const m of trs) {
    rowIndex++;
    const tds = [...m[1].matchAll(/<td([^>]*)>([\s\S]*?)<\/td>/gi)];
    if (!tds.length) continue;
    if (tds.some(([, attrs]) => /colspan/i.test(attrs))) {
      const g = cleanText(tds.map(([, , c]) => c).join(" "));
      if (g) genre = g;
      continue;
    }
    const cells = tds.map(([, , c]) => cleanText(c));
    const course = buildCourse(cells, genre, rowIndex);
    if (course) courses.push(course);
  }
  if (!courses.length) return { courses: [], error: "科目データが見つかりません。成績照会ページ（Campusmate）のHTMLを確認してください。" };
  return { courses, error: null };
}

function buildCourse(cells, genre, index) {
  const name = cells[0] ?? "";
  if (/科目ナンバリング|分野系列名/.test(name)) return null;
  if (cells.length < 4) return null;
  let credits = CREDIT_RE.test(cells[1] ?? "") ? parseFloat(cells[1]) : null;
  let grade = normalizeGrade(cells[2]);
  let code = CODE_RE.test(cells[6] ?? "") ? cells[6].toUpperCase() : "";
  if (credits == null) {
    for (const v of cells.slice(2)) {
      if (CREDIT_RE.test(v) && !/^\d\.0$/.test(v) && !/^20\d\d$/.test(v)) { credits = parseFloat(v); break; }
    }
  }
  if (!grade) {
    for (const v of cells.slice(1)) { const g = normalizeGrade(v); if (g) { grade = g; break; } }
  }
  if (!code) {
    for (const v of cells) if (CODE_RE.test(v)) { code = v.toUpperCase(); break; }
  }
  if (!name && !grade && !code) return null;
  return {
    index,
    name,
    credits: credits ?? 0,
    grade: grade ?? "",
    rawGrade: cells[2] ?? "",
    code: code ? code.replace(/[A-Za-z]$/, "") : "",
    rawCode: code,
    genre,
    teacher: cells[8] ?? "",
    year: cells[4] ?? "",
    term: cells[5] ?? "",
  };
}