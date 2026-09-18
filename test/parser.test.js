import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseGradeHTML, normalizeWidth, normalizeGrade } from "../src/parser.js";
import { makeHtml, makeRow, makeCourses } from "./helpers.js";

let REAL_HTML = null;
try {
  REAL_HTML = readFileSync(new URL("../Campusmate.html", import.meta.url), "utf-8");
} catch { /* 個人成績HTMLが無い環境では統合テストをスキップ */ }

test("実HTML: 106科目をパースしエラーなし", t => {
  if (!REAL_HTML) return t.skip();
  const { courses, error } = parseGradeHTML(REAL_HTML);
  assert.equal(error, null);
  assert.equal(courses.length, 106);
});

test("実HTML: ジャンルごとの科目数が期待どおり", t => {
  if (!REAL_HTML) return t.skip();
  const { courses } = parseGradeHTML(REAL_HTML);
  const byGenre = {};
  for (const c of courses) byGenre[c.genre] = (byGenre[c.genre] || 0) + 1;
  assert.deepEqual(byGenre, {
    "基幹教育セミナー": 1,
    "課題協学科目": 1,
    "言語文化基礎科目": 22,
    "文系ディシプリン科目": 4,
    "理系ディシプリン科目": 7,
    "健康・スポーツ科目": 1,
    "フロンティア科目": 3,
    "オープン科目": 6,
    "高年次基幹教育科目": 2,
    "サイバーセキュリティ科目": 1,
    "（文）専攻教育科目": 2,
    "（教）専攻教育科目": 1,
    "（経）専攻教育科目": 1,
    "（共創）レクチャーシリーズ": 1,
    "（共創）アプローチ科目": 27,
    "（共創）共創基礎プロジェクト": 1,
    "（共創）共創プロジェクト": 5,
    "（共創）異文化対応": 2,
    "（共創）ディグリープロジェクト": 1,
    "（共創）課題科目": 9,
    "（共創）共創発展演習": 1,
    "（共創）共創基礎科目": 7,
  });
});

test("実HTML: 成績が全角→半角に正規化され分布が一致", t => {
  if (!REAL_HTML) return t.skip();
  const { courses } = parseGradeHTML(REAL_HTML);
  const grades = {};
  for (const c of courses) grades[c.grade] = (grades[c.grade] || 0) + 1;
  assert.deepEqual(grades, { S: 73, A: 18, B: 4, C: 1, R: 5, W: 4, F: 1 });
  for (const c of courses) assert.ok(c.grade in { S: 1, A: 1, B: 1, C: 1, R: 1, W: 1, F: 1 });
});

test("実HTML: 科目コードから接尾辞 J/W/E が除去される", t => {
  if (!REAL_HTML) return t.skip();
  const { courses } = parseGradeHTML(REAL_HTML);
  for (const c of courses) {
    if (!c.code) continue;
    assert.match(c.code, /^[A-Z]{3}-[A-Z]{3}\d{4}$/, c.code);
  }
  const codes = courses.map(c => c.code);
  assert.ok(codes.includes("ISI-ISI3504"));
  assert.ok(codes.includes("ISI-ISI3330"));
  assert.ok(codes.includes("KED-LCB1181"));
  assert.ok(codes.includes("ECO-ECB2211"));
});

test("実HTML: コード空欄の科目が3科目ありジャンルが保持される", t => {
  if (!REAL_HTML) return t.skip();
  const { courses } = parseGradeHTML(REAL_HTML);
  const noCode = courses.filter(c => !c.code);
  assert.equal(noCode.length, 3);
  assert.deepEqual(noCode.map(c => c.genre), ["（文）専攻教育科目", "（文）専攻教育科目", "（教）専攻教育科目"]);
});

test("実HTML: 同コード複数行が保持される（学術英語×2・共創プロジェクト×5）", t => {
  if (!REAL_HTML) return t.skip();
  const { courses } = parseGradeHTML(REAL_HTML);
  assert.equal(courses.filter(c => c.code === "KED-LCB2113").length, 2);
  assert.equal(courses.filter(c => c.code === "ISI-ISI3901").length, 5);
});

test("実HTML: 単位数が正しくパースされる（2.5と情報科学2単位含む）", t => {
  if (!REAL_HTML) return t.skip();
  const { courses } = parseGradeHTML(REAL_HTML);
  const icl = courses.find(c => c.code === "KED-ICL1131");
  assert.equal(icl.credits, 2.5);
  const info = courses.find(c => c.code === "KED-SIS1112");
  assert.equal(info.credits, 2);
});

test("合成: 見出し行と科目行の基本パース", () => {
  const courses = makeCourses([
    "（共創）アプローチ科目",
    { name: "〔人社〕思想・倫理・哲学Ｃ", code: "ISI-ISI2103W", grade: "Ｓ" },
    { name: "〔学際〕情報学Ｇ", code: "ISI-ISI3504W", grade: "Ａ" },
  ]);
  assert.equal(courses.length, 2);
  assert.equal(courses[0].code, "ISI-ISI2103");
  assert.equal(courses[0].grade, "S");
  assert.equal(courses[0].genre, "（共創）アプローチ科目");
  assert.equal(courses[1].name, "〔学際〕情報学G");
});

test("合成: 見出しが重複しても直前のジャンルが正しく付く", () => {
  const courses = makeCourses([
    "（共創）アプローチ科目",
    "（共創）アプローチ科目",
    { name: "〔自然〕物理学Ａ", code: "ISI-ISI2214W" },
  ]);
  assert.equal(courses.length, 1);
  assert.equal(courses[0].genre, "（共創）アプローチ科目");
});

test("合成: 見出し直後に次の見出しが来るとジャンルが更新される", () => {
  const courses = makeCourses([
    "（共創）アプローチ科目",
    { name: "〔人社〕経済学Ａ", code: "ISI-ISI2118J" },
    "（共創）課題科目",
    { name: "課題研究（国家と地域領域）〔ロシア経済論〕", code: "ISI-ISI3639J" },
  ]);
  assert.equal(courses[0].genre, "（共創）アプローチ科目");
  assert.equal(courses[1].genre, "（共創）課題科目");
});

test("合成: 列順が入れ替わっても内容パターンで復元できる", () => {
  const html = `<table><tr><td>科目A</td><td>Ｓ</td><td>1</td><td>4.0</td><td>2025</td><td>秋学期</td><td>KED-KES1111J</td></tr></table>`;
  const { courses } = parseGradeHTML(html);
  assert.equal(courses.length, 1);
  assert.equal(courses[0].credits, 1);
  assert.equal(courses[0].grade, "S");
  assert.equal(courses[0].code, "KED-KES1111");
});

test("合成: td欠損（9セル）でもコード・成績が取れる", () => {
  const html = `<table><tr><td>科目A</td><td>1</td><td>Ａ</td><td>3.0</td><td>2025</td><td>前</td><td>KED-HSS1121J</td></tr></table>`;
  const { courses } = parseGradeHTML(html);
  assert.equal(courses.length, 1);
  assert.equal(courses[0].grade, "A");
  assert.equal(courses[0].code, "KED-HSS1121");
});

test("合成: コード欄がダッシュ記号でも空欄扱いになる", () => {
  const courses = makeCourses([{ name: "アラビア語Ⅰ", code: "－" }]);
  assert.equal(courses[0].code, "");
});

test("合成: 成績表記のバリエーションが正規化される", () => {
  const cases = [["合格", "P"], ["認定", "R"], ["履修中", "IP"], ["＊", "*"], ["Ｒ", "R"], ["Ｄ", "D"], ["Ｆ", "F"]];
  for (const [raw, want] of cases) {
    const courses = makeCourses([{ name: `科目${raw}`, grade: raw }]);
    assert.equal(courses[0].grade, want, raw);
  }
});

test("合成: 単位数のバリエーション（2.5・0・ダッシュ・空）", () => {
  const c1 = makeCourses([{ name: "A", credits: "2.5" }]);
  assert.equal(c1[0].credits, 2.5);
  const c2 = makeCourses([{ name: "B", credits: "－" }]);
  assert.equal(c2[0].credits, 0);
  const c3 = makeCourses([{ name: "C", credits: "" }]);
  assert.equal(c3[0].credits, 0);
});

test("合成: &nbsp;・全角スペース・前後の空白が除去される", () => {
  const courses = makeCourses([{ name: "&nbsp;心理学入門　(集中)", code: "  KED-HSS1311J " }]);
  assert.equal(courses[0].name, "心理学入門 (集中)");
  assert.equal(courses[0].code, "KED-HSS1311");
});

test("合成: BOM・CRLF・改行が混ざってもパースできる", () => {
  const html = `\uFEFF<html>\r\n<body>\r\n<table>\r\n<tr><td colspan="10">総合科目</td></tr>\r\n${makeRow({ name: "情報学へのとびら", code: "KED-GES1221J" })}\r\n</table>\r\n</body>\r\n</html>`;
  const { courses, error } = parseGradeHTML(html);
  assert.equal(error, null);
  assert.equal(courses.length, 1);
  assert.equal(courses[0].genre, "総合科目");
});

test("合成: テーブル断片だけのコピペでもパースできる", () => {
  const html = makeRow({ name: "共創プロジェクト", code: "ISI-ISI3901E" });
  const { courses, error } = parseGradeHTML(html);
  assert.equal(error, null);
  assert.equal(courses.length, 1);
});

test("合成: 無関係な行（div・script・リンク）が混入しても無視される", () => {
  const html = `<html><head><script>var x = "<tr><td>fake</td></tr>";</script></head><body><div>ナビ</div><a href="#">link</a>${makeRow({ name: "共創基礎プロジェクト", code: "ISI-ISI2903E" })}</body></html>`;
  const { courses, error } = parseGradeHTML(html);
  assert.equal(error, null);
  assert.equal(courses.length, 1);
});

test("合成: 科目行が0件ならエラーメッセージを返す", () => {
  const r1 = parseGradeHTML("");
  assert.ok(r1.error);
  const r2 = parseGradeHTML("<html><body>成績データなし</body></html>");
  assert.ok(r2.error);
  const r3 = parseGradeHTML("<html><body><table><tr><td>1</td></tr></table></body></html>");
  assert.ok(r3.error);
});

test("合成: 見出しにしか存在しない未知のジャンルでも科目がパースされる", () => {
  const courses = makeCourses([
    "（共創）新設科目",
    { name: "新しい科目", code: "KED-NEW1001" },
  ]);
  assert.equal(courses.length, 1);
  assert.equal(courses[0].genre, "（共創）新設科目");
});

test("normalizeWidth: 全角英数字・記号・空白を半角化", () => {
  assert.equal(normalizeWidth("ＳＡＢＣＦＷＲＰ＊０９．"), "SABCFWRP*09.");
  assert.equal(normalizeWidth("　全角　空白　"), " 全角 空白 ");
});

test("normalizeGrade: 認識できない成績はnull", () => {
  assert.equal(normalizeGrade("？？"), null);
  assert.equal(normalizeGrade(""), null);
});