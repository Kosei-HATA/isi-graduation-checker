import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseGradeHTML } from "../src/parser.js";
import { evaluate, classifyCourse, DEFAULT_CONFIG } from "../src/core.js";

let REAL_HTML = null;
try {
  REAL_HTML = readFileSync(new URL("../Campusmate.html", import.meta.url), "utf-8");
} catch { /* 個人成績HTMLが無い環境では統合テストをスキップ */ }

function C(index, name, credits, code, genre, grade = "S") {
  return { index, name, credits, code, genre, grade };
}

const KIKAN_MIN = [
  C(0, "基幹教育セミナー", 1, "KED-KES1111", "基幹教育セミナー"),
  C(1, "課題協学科目", 2.5, "KED-ICL1131", "課題協学科目"),
  ...Array.from({ length: 4 }, (_, i) => C(2 + i, `文系${i}`, 2, `KED-HSS11${i + 1}`, "文系ディシプリン科目")),
  C(6, "情報科学", 2, "KED-SIS1112", "理系ディシプリン科目"),
  ...Array.from({ length: 6 }, (_, i) => C(7 + i, `理科${i}`, 1, `KED-SBI10${i + 1}`, "理系ディシプリン科目")),
  ...Array.from({ length: 10 }, (_, i) => C(13 + i, `Intensive English: Course ${i}`, 1, `KED-LCB118${i + 1}`, "言語文化基礎科目")),
  ...Array.from({ length: 2 }, (_, i) => C(23 + i, "学術英語・テーマベース", 1, "KED-LCB2113", "言語文化基礎科目")),
  ...Array.from({ length: 4 }, (_, i) => C(25 + i, `中国語${i}`, 1, `KED-LCB141${i + 3}`, "言語文化基礎科目")),
  C(29, "サイバーセキュリティ基礎論", 1, "KED-CSC1111", "サイバーセキュリティ科目"),
  C(30, "健康・スポーツ科学演習", 1, "KED-HSP1211", "健康・スポーツ科目"),
  C(31, "科学の歴史Ａ", 1, "KED-ASC2151", "高年次基幹教育科目"),
  C(32, "科学の歴史Ｂ", 1, "KED-ASC2152", "高年次基幹教育科目"),
];

const SPECIALIZED_MIN = [
  ...Array.from({ length: 7 }, (_, i) => C(40 + i, `共創基礎${i}`, 1, `ISI-ISI130${i + 1}`, "（共創）共創基礎科目")),
  C(47, "レクチャーシリーズ", 2, "ISI-ISI2601", "（共創）レクチャーシリーズ"),
  C(48, "〔人社〕科目１", 1, "ISI-ISI2103", "（共創）アプローチ科目"),
  C(49, "〔人社〕科目２", 1, "ISI-ISI2110", "（共創）アプローチ科目"),
  C(50, "〔自然〕科目１", 1, "ISI-ISI2214", "（共創）アプローチ科目"),
  C(51, "〔自然〕科目２", 1, "ISI-ISI2215", "（共創）アプローチ科目"),
  C(52, "〔学際〕科目１", 1, "ISI-ISI2302", "（共創）アプローチ科目"),
  C(53, "〔学際〕科目２", 1, "ISI-ISI2303", "（共創）アプローチ科目"),
  ...Array.from({ length: 20 }, (_, i) => C(54 + i, `〔学際〕超過${i}`, 1, `ISI-ISI23${String(10 + i).padStart(2, "0")}`, "（共創）アプローチ科目")),
  C(74, "共創基礎プロジェクト", 2, "ISI-ISI2903", "（共創）共創基礎プロジェクト"),
  ...Array.from({ length: 6 }, (_, i) => C(75 + i, "共創プロジェクト", 1, "ISI-ISI3901", "（共創）共創プロジェクト")),
  C(81, "異文化対応 1", 1, "ISI-ISI2604", "（共創）異文化対応"),
  C(82, "異文化対応 2", 1, "ISI-ISI2605", "（共創）異文化対応"),
  C(83, "ディグリープロジェクト１", 2, "ISI-ISI4601", "（共創）ディグリープロジェクト"),
  C(84, "ディグリープロジェクト２", 5, "ISI-ISI4602", "（共創）ディグリープロジェクト"),
  C(85, "ディグリープロジェクト３", 2, "ISI-ISI4603", "（共創）ディグリープロジェクト"),
  C(86, "共創発展演習１", 2, "ISI-ISI4901", "（共創）共創発展演習"),
  C(87, "共創発展演習２", 2, "ISI-ISI4902", "（共創）共創発展演習"),
  ...Array.from({ length: 6 }, (_, i) => C(88 + i, `課題研究${i}`, 1, `ISI-ISI363${i + 1}`, "（共創）課題科目")),
];

test("統合: 実HTMLの評価結果が期待どおり（不足=構想1/協働1/DP7/演習2）", t => {
  if (!REAL_HTML) return t.skip();
  const { courses } = parseGradeHTML(REAL_HTML);
  const r = evaluate(courses);
  const short = Object.fromEntries(r.missing.map(m => [m.label, m.short]));
  assert.deepEqual(short, {
    "構想科目（合計）": 1,
    "協働科目": 1,
    "ディグリープロジェクト": 7,
    "共創発展演習": 2,
    "総修得単位数": 5.5,
  });
  assert.equal(r.missing.length, 5);
  assert.equal(r.ok.length, 17);
  assert.equal(r.totalCredits, 118.5);
  assert.equal(r.totalRequired, 124);
  assert.equal(r.totalShort, 11);
  assert.equal(r.kikanOthers.earned, 8.5);
  assert.equal(r.specOthers.earned, 17.5);
});

test("統合: バケット別の修得単位数が期待どおり", t => {
  if (!REAL_HTML) return t.skip();
  const { courses } = parseGradeHTML(REAL_HTML);
  const r = evaluate(courses);
  assert.deepEqual(r.buckets, {
    seminar: 1,
    icl: 2.5,
    humanities: 8,
    science: 8,
    lang1: 12,
    lang2: 10,
    cyber: 1,
    health: 1,
    advanced: 2,
    sogo: 13,
    fundamental: 7,
    lectureSeries: 2,
    approachHS: 6,
    approachNS: 6,
    approachID: 13,
    collab: 7,
    experience: 2,
    degreeProject: 2,
    advSeminar: 2,
    issue: 6,
    otherDept: 7,
  });
  assert.equal(r.unknownCourses.length, 0);
});

test("統合: 除外科目（F/W）が5科目・矛盾フラグなし", t => {
  if (!REAL_HTML) return t.skip();
  const { courses } = parseGradeHTML(REAL_HTML);
  const r = evaluate(courses);
  assert.equal(r.excludedCourses.length, 5);
  assert.deepEqual(r.excludedCourses.map(e => e.course.grade).sort(), ["F", "W", "W", "W", "W"]);
  assert.equal(r.courses.filter(c => c.conflicted).length, 0);
  assert.equal(r.courses.filter(c => c.bucket === "unknown").length, 0);
});

test("統合: 基幹その他・専攻その他の内訳（A=0,B=6,D=13,F=7 → 配分2.5/17.5）", t => {
  if (!REAL_HTML) return t.skip();
  const { courses } = parseGradeHTML(REAL_HTML);
  const r = evaluate(courses);
  assert.deepEqual(r.kikanOthers.breakdown, { A: 0, B: 6, C: 0, D: 13, E: 0, F: 7, dIntoKikan: 2.5, specPortion: 17.5 });
  assert.deepEqual(r.specOthers.breakdown, { o: 0, ka: 0, ki: 0, ku: 0, iic: 0, othersSpec: 0, fromFlexible: 17.5 });
});

test("統合: 全ての科目がジャンル見出しで分類されている", t => {
  if (!REAL_HTML) return t.skip();
  const { courses } = parseGradeHTML(REAL_HTML);
  const r = evaluate(courses);
  for (const c of r.courses) {
    assert.ok(c.course.genre, c.course.name);
  }
});

test("分類: ジャンル見出し→バケット", () => {
  const cases = [
    ["基幹教育セミナー", "KED-KES1111", "seminar"],
    ["課題協学科目", "KED-ICL1131", "icl"],
    ["文系ディシプリン科目", "KED-HSS1121", "humanities"],
    ["理系ディシプリン科目", "KED-SCH1011", "science"],
    ["健康・スポーツ科目", "KED-HSP1211", "health"],
    ["サイバーセキュリティ科目", "KED-CSC1111", "cyber"],
    ["高年次基幹教育科目", "KED-ASC2151", "advanced"],
    ["フロンティア科目", "KED-GES1160", "sogo"],
    ["オープン科目", "KED-GES1211", "sogo"],
    ["総合科目", "KED-GES1221", "sogo"],
    ["（共創）レクチャーシリーズ", "ISI-ISI2601", "lectureSeries"],
    ["（共創）共創基礎プロジェクト", "ISI-ISI2903", "collab"],
    ["（共創）共創プロジェクト", "ISI-ISI3901", "collab"],
    ["（共創）異文化対応", "ISI-ISI2604", "experience"],
    ["（共創）ディグリープロジェクト", "ISI-ISI4601", "degreeProject"],
    ["（共創）課題科目", "ISI-ISI3631", "issue"],
    ["（共創）共創発展演習", "ISI-ISI4901", "advSeminar"],
    ["（共創）共創基礎科目", "ISI-ISI1301", "fundamental"],
  ];
  for (const [genre, code, want] of cases) {
    const r = classifyCourse(C(0, "科目", 1, code, genre));
    assert.equal(r.bucket, want, genre);
    assert.equal(r.evidence, "genre");
    assert.equal(r.conflicted, false);
  }
});

test("分類: 他学部ジャンル（農学部・文学部等）→ otherDept（コード不要）", () => {
  for (const genre of ["（農）専攻教育科目", "（法）専攻教育科目", "（工）専攻教育科目", "（経）専攻教育科目"]) {
    const r = classifyCourse(C(0, "他学部科目", 2, "", genre));
    assert.equal(r.bucket, "otherDept", genre);
    assert.equal(r.evidence, "genre");
  }
  const withCode = classifyCourse(C(1, "情報処理Ⅰ", 2, "ECO-ECB2211", "（経）専攻教育科目"));
  assert.equal(withCode.bucket, "otherDept");
});

test("分類: アプローチ科目は科目名の〔人社〕〔自然〕〔学際〕で分野決定", () => {
  assert.equal(classifyCourse(C(0, "〔人社〕経済学Ａ", 1, "ISI-ISI2118", "（共創）アプローチ科目")).bucket, "approachHS");
  assert.equal(classifyCourse(C(0, "〔自然〕物理学Ａ", 1, "ISI-ISI2214", "（共創）アプローチ科目")).bucket, "approachNS");
  assert.equal(classifyCourse(C(0, "〔学際〕情報学Ｇ", 1, "ISI-ISI3504", "（共創）アプローチ科目")).bucket, "approachID");
  assert.equal(classifyCourse(C(0, "〔学際〕情報学Ｈ", 1, "ISI-ISI3330", "（共創）アプローチ科目")).bucket, "approachID");
});

test("分類: アプローチ科目はコードでもフォールバック判定できる", () => {
  assert.equal(classifyCourse(C(0, "人社科目", 1, "ISI-ISI2103", "（共創）アプローチ科目")).bucket, "approachHS");
  assert.equal(classifyCourse(C(0, "自然科目", 1, "ISI-ISI2219", "（共創）アプローチ科目")).bucket, "approachNS");
  assert.equal(classifyCourse(C(0, "学際科目", 1, "ISI-ISI2302", "（共創）アプローチ科目")).bucket, "approachID");
  assert.equal(classifyCourse(C(0, "例外科目", 1, "ISI-ISI3504", "（共創）アプローチ科目")).bucket, "approachID");
});

test("分類: アプローチで名前とコードが矛盾する場合は名前優先+矛盾フラグ", () => {
  const r = classifyCourse(C(0, "〔人社〕経済学Ａ", 1, "ISI-ISI2214", "（共創）アプローチ科目"));
  assert.equal(r.bucket, "approachHS");
  assert.equal(r.conflicted, true);
});

test("分類: 言語科目はコードで第1/第2外国語を分ける", () => {
  assert.equal(classifyCourse(C(0, "Intensive English: RW1", 1, "KED-LCB1181", "言語文化基礎科目")).bucket, "lang1");
  assert.equal(classifyCourse(C(0, "学術英語・テーマベース", 1, "KED-LCB2113", "言語文化基礎科目")).bucket, "lang1");
  assert.equal(classifyCourse(C(0, "中国語ⅠA", 1, "KED-LCB1413", "言語文化基礎科目")).bucket, "lang2");
  assert.equal(classifyCourse(C(0, "中国語Ⅲ", 1, "KED-LCB2411", "言語文化基礎科目")).bucket, "lang2");
  assert.equal(classifyCourse(C(0, "ロシア語ⅠA", 1, "KED-LCB1513", "言語文化基礎科目")).bucket, "lang2");
});

test("分類: 言語科目はコードが無くても科目名で判定できる", () => {
  assert.equal(classifyCourse(C(0, "Intensive English: Global Issues RW1", 1, "", "言語文化基礎科目")).bucket, "lang1");
  assert.equal(classifyCourse(C(0, "Academic English 1", 1, "", "言語文化基礎科目")).bucket, "lang1");
  assert.equal(classifyCourse(C(0, "学術英語・テーマベース", 1, "", "言語文化基礎科目")).bucket, "lang1");
  assert.equal(classifyCourse(C(0, "中国語ⅠA", 1, "", "言語文化基礎科目")).bucket, "lang2");
  assert.equal(classifyCourse(C(0, "ロシア語ⅡB", 1, "", "言語文化基礎科目")).bucket, "lang2");
  assert.equal(classifyCourse(C(0, "ドイツ語ⅠA", 1, "", "言語文化基礎科目")).bucket, "lang2");
});

test("分類: ジャンル無しでもコード規則で判定できる", () => {
  assert.equal(classifyCourse(C(0, "科目", 1, "KED-KES1111", "")).bucket, "seminar");
  assert.equal(classifyCourse(C(0, "科目", 1, "KED-GES1160", "")).bucket, "sogo");
  assert.equal(classifyCourse(C(0, "科目", 1, "ISI-ISI1301", "")).bucket, "fundamental");
  assert.equal(classifyCourse(C(0, "科目", 1, "ISI-ISI3631", "")).bucket, "issue");
  assert.equal(classifyCourse(C(0, "科目", 1, "ECO-ECB2211", "")).bucket, "otherDept");
  assert.equal(classifyCourse(C(0, "科目", 1, "AGR-AGR1001", "")).bucket, "otherDept");
});

test("分類: 傘ジャンル直下の科目はコードで判定される", () => {
  assert.equal(classifyCourse(C(0, "レクチャーシリーズ", 2, "ISI-ISI2601", "（共創）構想科目")).bucket, "lectureSeries");
  assert.equal(classifyCourse(C(0, "共創プロジェクト", 1, "ISI-ISI3901", "（共創）協働科目")).bucket, "collab");
  assert.equal(classifyCourse(C(0, "異文化対応 1", 1, "ISI-ISI2604", "（共創）経験科目")).bucket, "experience");
});

test("分類: 判定不能はunknownになり、手動オーバーライドが優先される", () => {
  assert.equal(classifyCourse(C(0, "謎の科目", 2, "KED-XXX9999", "")).bucket, "unknown");
  const r = classifyCourse(C(0, "謎の科目", 2, "KED-XXX9999", ""), DEFAULT_CONFIG, { 0: "sogo" });
  assert.equal(r.bucket, "sogo");
  assert.equal(r.evidence, "override");
});

test("評価: 卒業要件を完全に満たす履修パターンは全項目OK（124単位）", () => {
  const sogo = [
    C(33, "総合１", 2, "KED-GES1201", "総合科目"),
    C(34, "総合２", 2, "KED-GES1211", "総合科目"),
    C(35, "総合３", 2, "KED-GES1212", "総合科目"),
    C(36, "総合４", 2, "KED-GES1221", "総合科目"),
    C(37, "総合５", 2.5, "KED-GES1241", "総合科目"),
    ...Array.from({ length: 10 }, (_, i) => C(90 + i, `他学部${i}`, 1, `AGR-AGR10${i + 1}`, "（農）専攻教育科目")),
  ];
  const r = evaluate([...KIKAN_MIN, ...sogo, ...SPECIALIZED_MIN]);
  assert.equal(r.missing.length, 0);
  assert.equal(r.ok.length, 22);
  assert.equal(r.totalCredits, 124);
  assert.equal(r.unknownCourses.length, 0);
});

test("評価: 基幹その他はちょうど8.5でOK、専攻その他は0で不足12", () => {
  const sogo = [C(33, "総合１", 2, "KED-GES1201", "総合科目"), C(34, "総合２", 2, "KED-GES1211", "総合科目"), C(35, "総合３", 2, "KED-GES1212", "総合科目"), C(36, "総合４", 2.5, "KED-GES1221", "総合科目")];
  const r = evaluate([...KIKAN_MIN, ...sogo]);
  const k = r.ok.find(m => m.label === "基幹教育科目その他");
  assert.ok(k);
  assert.equal(k.earned, 8.5);
  const s = r.missing.find(m => m.label === "専攻教育科目その他");
  assert.equal(s.short, 12);
});

test("評価: 配分が最適化される（基幹6+総合12 → 基幹8.5/専攻9.5）", () => {
  const extraLang = Array.from({ length: 6 }, (_, i) => C(40 + i, `ロシア語${i}`, 1, `KED-LCB151${i + 3}`, "言語文化基礎科目"));
  const sogo = Array.from({ length: 12 }, (_, i) => C(50 + i, `総合${i}`, 1, `KED-GES12${i}`, "総合科目"));
  const r = evaluate([...KIKAN_MIN, ...extraLang, ...sogo]);
  assert.equal(r.kikanOthers.earned, 8.5);
  assert.equal(r.specOthers.earned, 9.5);
  assert.equal(r.missing.find(m => m.label === "専攻教育科目その他").short, 2.5);
  assert.equal(r.kikanOthers.breakdown.B, 6);
  assert.equal(r.kikanOthers.breakdown.dIntoKikan, 2.5);
});

test("評価: 配分しても総量不足なら両方とも不足と判定される", () => {
  const sogo = Array.from({ length: 8 }, (_, i) => C(40 + i, `総合${i}`, 1, `KED-GES12${i}`, "総合科目"));
  const r = evaluate([...KIKAN_MIN, ...sogo]);
  assert.equal(r.missing.find(m => m.label === "基幹教育科目その他").short, 0.5);
  assert.equal(r.missing.find(m => m.label === "専攻教育科目その他").short, 12);
});

test("評価: 他学部科目は上限10単位まで・超過分はcapped表示", () => {
  const others = Array.from({ length: 12 }, (_, i) => C(40 + i, `他学部${i}`, 1, `AGR-AGR10${i + 1}`, "（農）専攻教育科目"));
  const r = evaluate(others);
  assert.equal(r.kikanOthers.breakdown.F, 10);
  const capped = r.courses.filter(c => c.capped);
  assert.equal(capped.length, 2);
  assert.equal(r.totalCredits, 10);
});

test("評価: 協働科目は超過2単位までその他（か）に算入", () => {
  const collabs = Array.from({ length: 12 }, (_, i) => C(40 + i, "共創プロジェクト", 1, "ISI-ISI3901", "（共創）共創プロジェクト"));
  const r = evaluate(collabs);
  assert.equal(r.missing.find(m => m.label === "協働科目"), undefined);
  assert.equal(r.specOthers.breakdown.ka, 2);
  assert.equal(r.totalCredits, 10);
});

test("評価: 超過バケツ A（文理）/C（サイバー健康）/E（高年次）/お（構想）/き（経験）/く（課題）", () => {
  const extras = [
    C(40, "文系超過", 2, "KED-HSS1121", "文系ディシプリン科目"),
    C(41, "サイバー超過", 1, "KED-CSC1111", "サイバーセキュリティ科目"),
    C(42, "高年次超過", 2, "KED-ASC2151", "高年次基幹教育科目"),
    C(43, "〔学際〕科目超過１", 1, "ISI-ISI2301", "（共創）アプローチ科目"),
    C(44, "〔学際〕科目超過２", 1, "ISI-ISI2309", "（共創）アプローチ科目"),
    C(45, "異文化対応 3", 1, "ISI-ISI2606", "（共創）異文化対応"),
    C(46, "異文化対応 4", 1, "ISI-ISI2607", "（共創）異文化対応"),
    C(47, "課題研究超過１", 1, "ISI-ISI3851", "（共創）課題科目"),
    C(48, "課題研究超過２", 1, "ISI-ISI3852", "（共創）課題科目"),
  ];
  const r = evaluate([...KIKAN_MIN, ...SPECIALIZED_MIN, ...extras]);
  const b = r.kikanOthers.breakdown;
  assert.equal(b.A, 2);
  assert.equal(b.C, 1);
  assert.equal(b.E, 2);
  assert.equal(r.specOthers.breakdown.o, 2);
  assert.equal(r.specOthers.breakdown.ki, 2);
  assert.equal(r.specOthers.breakdown.ku, 2);
});

test("評価: 成績 P（合格）は算入、D/IP/空欄は除外", () => {
  const courses = [
    C(0, "合格科目", 1, "ISI-ISI1301", "（共創）共創基礎科目", "P"),
    C(1, "D科目", 1, "ISI-ISI1302", "（共創）共創基礎科目", "D"),
    C(2, "履修中科目", 1, "ISI-ISI1303", "（共創）共創基礎科目", "IP"),
    C(3, "成績不明科目", 1, "ISI-ISI1304", "（共創）共創基礎科目", ""),
  ];
  const r = evaluate(courses);
  assert.equal(r.buckets.fundamental, 1);
  assert.equal(r.excludedCourses.length, 3);
  assert.equal(r.totalCredits, 1);
});

test("評価: unknown科目は算入されず一覧に残る", () => {
  const courses = [
    C(0, "謎の科目", 2, "KED-XXX9999", ""),
    C(1, "農学部科目", 2, "AGR-AGR1001", "（農）専攻教育科目"),
  ];
  const r = evaluate(courses);
  assert.equal(r.unknownCourses.length, 1);
  assert.equal(r.buckets.otherDept, 2);
  assert.equal(r.totalCredits, 2);
});

test("評価: 手動バケット（その他（基幹）/その他（専攻））が振替集計される", () => {
  const courses = [
    C(0, "謎の科目", 3, "KED-XXX9999", ""),
    C(1, "謎の科目２", 2, "KED-XXX9998", ""),
  ];
  const r = evaluate(courses, DEFAULT_CONFIG, { 0: "othersKikan", 1: "othersSpec" });
  assert.equal(r.unknownCourses.length, 0);
  assert.equal(r.kikanOthers.earned, 3);
  assert.equal(r.specOthers.breakdown.othersSpec, 2);
  assert.equal(r.totalCredits, 5);
});

test("分類: 構想科目の区分でコード不明な科目は構想その他として計上", () => {
  const r = classifyCourse(C(0, "共創基礎演習", 2, "KED-XXX9999", "（共創）構想科目"));
  assert.equal(r.bucket, "framingOther");
  assert.equal(r.evidence, "genre");
  const withKnownCode = classifyCourse(C(1, "レクチャーシリーズ", 2, "ISI-ISI2601", "（共創）構想科目"));
  assert.equal(withKnownCode.bucket, "lectureSeries");
});

test("分類: アプローチ科目で分野もコードも不明でも構想その他として計上", () => {
  const r = classifyCourse(C(0, "演習科目", 2, "", "（共創）アプローチ科目"));
  assert.equal(r.bucket, "framingOther");
});

test("分類: 海外活動・グローバル・オンラインも経験科目として扱われる", () => {
  const cases = [
    ["海外活動A", "ISI-ISI2606", "（共創）経験科目"],
    ["海外活動B", "ISI-ISI2607", "（共創）異文化対応"],
    ["グローバル・オンラインA", "ISI-ISI2608", "（共創）経験科目"],
    ["グローバル・オンラインB", "ISI-ISI2609", "（共創）異文化対応"],
    ["海外活動A", "ISI-ISI2606", "（共創）海外活動"],
    ["グローバル・オンラインA", "ISI-ISI2608", "（共創）グローバル・オンライン"],
    ["海外活動A", "ISI-ISI2606", ""],
    ["グローバル・オンラインA", "ISI-ISI2608", ""],
  ];
  for (const [name, code, genre] of cases) {
    const r = classifyCourse(C(0, name, 1, code, genre));
    assert.equal(r.bucket, "experience", `${genre || "(genre無し)"} ${name}`);
  }
  const ls = classifyCourse(C(1, "レクチャーシリーズ", 2, "ISI-ISI2601", "（共創）レクチャーシリーズ"));
  assert.equal(ls.bucket, "lectureSeries");
});

test("評価: 構想その他も構想科目28に算入され、超過はその他（お）に", () => {
  const courses = [
    C(0, "レクチャーシリーズ", 2, "ISI-ISI2601", "（共創）構想科目"),
    C(1, "共創基礎演習", 2, "KED-XXX9999", "（共創）構想科目"),
    ...Array.from({ length: 24 }, (_, i) => C(2 + i, `〔人社〕科目${i}`, 1, `ISI-ISI21${String(10 + i).padStart(2, "0")}`, "（共創）アプローチ科目")),
  ];
  const r = evaluate(courses);
  assert.equal(r.missing.find(m => m.label === "構想科目（合計）"), undefined);
  assert.equal(r.buckets.framingOther, 2);
  assert.equal(r.specOthers.breakdown.o, 0);

  const over = evaluate([...courses, C(30, "構想その他超過", 2, "KED-XXX9998", "（共創）構想科目")]);
  assert.equal(over.specOthers.breakdown.o, 2);
});

test("分類: 傘ジャンル直下でコード不明でも協働・経験・共創科目として計上", () => {
  assert.equal(classifyCourse(C(0, "協働系科目", 2, "KED-XXX9999", "（共創）協働科目")).bucket, "collab");
  assert.equal(classifyCourse(C(1, "経験系科目", 2, "KED-XXX9998", "（共創）経験科目")).bucket, "experience");
  const iic = classifyCourse(C(2, "共創系科目", 2, "KED-XXX9997", "（共創）共創科目"));
  assert.equal(iic.bucket, "iicOther");
  const iicCode = classifyCourse(C(3, "ディグリープロジェクト１", 2, "ISI-ISI4601", "（共創）共創科目"));
  assert.equal(iicCode.bucket, "degreeProject");
});

test("分類: 言語文化科目で非LCBコードでも科目名で判定され、nullにならない", () => {
  assert.equal(classifyCourse(C(0, "Intensive English: Global Issues RW1", 1, "KED-XXX9999", "言語文化科目")).bucket, "lang1");
  assert.equal(classifyCourse(C(1, "中国語ⅠA", 1, "KED-XXX9998", "言語文化基礎科目")).bucket, "lang2");
  const r = evaluate([C(2, "言語系科目", 2, "KED-XXX9997", "言語文化基礎科目")]);
  assert.equal(r.unknownCourses.length, 0);
  assert.equal(r.buckets.lang2, 2);
});

test("評価: その他（く）は共創科目（DP+演習+課題）の19単位超過で計算される", () => {
  const courses = [
    ...Array.from({ length: 9 }, (_, i) => C(i, `DP${i}`, 1, `ISI-ISI46${String(10 + i).padStart(2, "0")}`, "（共創）ディグリープロジェクト")),
    ...Array.from({ length: 4 }, (_, i) => C(9 + i, `演習${i}`, 1, `ISI-ISI49${String(10 + i).padStart(2, "0")}`, "（共創）共創発展演習")),
    ...Array.from({ length: 9 }, (_, i) => C(13 + i, `課題${i}`, 1, `ISI-ISI363${i + 1}`, "（共創）課題科目")),
  ];
  const r = evaluate(courses);
  assert.equal(r.missing.find(m => m.label === "ディグリープロジェクト"), undefined);
  assert.equal(r.specOthers.breakdown.ku, 3);
});

test("評価: 共創科目（その他）が専攻その他に算入される", () => {
  const courses = [
    C(0, "共創系科目", 2, "KED-XXX9999", "（共創）共創科目"),
    C(1, "構想系科目", 2, "KED-XXX9998", "（共創）構想科目"),
  ];
  const r = evaluate(courses);
  assert.equal(r.buckets.iicOther, 2);
  assert.equal(r.buckets.framingOther, 2);
  assert.equal(r.specOthers.breakdown.iic, 2);
  assert.equal(r.missing.find(m => m.label === "構想科目（合計）").short, 26);
});

test("評価: 構想科目が構想その他だけで満たせる", () => {
  const courses = Array.from({ length: 28 }, (_, i) => C(i, `共創基礎演習${i}`, 1, "KED-XXX9999", "（共創）構想科目"));
  const r = evaluate(courses);
  assert.equal(r.missing.find(m => m.label === "構想科目（合計）"), undefined);
  assert.equal(r.buckets.framingOther, 28);
});

test("評価: レクチャーシリーズとアプローチだけで構想科目28を満たす", () => {
  const courses = [
    C(0, "レクチャーシリーズ", 2, "ISI-ISI2601", "（共創）レクチャーシリーズ"),
    ...Array.from({ length: 26 }, (_, i) => C(1 + i, `〔人社〕科目${i}`, 1, `ISI-ISI21${String(10 + i).padStart(2, "0")}`, "（共創）アプローチ科目")),
  ];
  const r = evaluate(courses);
  assert.equal(r.missing.find(m => m.label === "構想科目（合計）"), undefined);
  assert.equal(r.buckets.approachHS, 26);
  assert.equal(r.specOthers.breakdown.o, 0);
});

test("分類: 第1外国語不足は第2外国語で穴埋めできない", () => {
  const courses = [
    ...Array.from({ length: 16 }, (_, i) => C(i, `中国語${i}`, 1, `KED-LCB141${i}`, "言語文化基礎科目")),
  ];
  const r = evaluate(courses);
  assert.equal(r.missing.find(m => m.label === "第1外国語+学術英語").short, 12);
  assert.equal(r.missing.find(m => m.label === "第2外国語"), undefined);
  assert.equal(r.kikanOthers.breakdown.B, 12);
});