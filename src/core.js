export const PASS_GRADES = new Set(["S", "A", "B", "C", "R", "P"]);
export const EXCLUDED_GRADES = new Set(["F", "W", "D", "IP"]);

export const GRADE_POINTS = { S: 4, A: 3, B: 2, C: 1, F: 0 };

export function calcGPA(courses) {
  let credits = 0;
  let points = 0;
  const byGrade = {};
  for (const c of courses) {
    const p = GRADE_POINTS[c.grade];
    if (p === undefined) continue;
    credits += c.credits;
    points += p * c.credits;
    byGrade[c.grade] = (byGrade[c.grade] || 0) + c.credits;
  }
  return { gpa: credits ? points / credits : 0, credits, points, byGrade };
}

export const DEFAULT_CONFIG = {
  lang1Prefixes: ["KED-LCB11", "KED-LCB21"],
  extraApproachHS: [],
  extraApproachNS: [],
  extraApproachID: ["ISI-ISI3504", "ISI-ISI3330"],
};

const eq = x => n => n === x;
const re = r => n => r.test(n);

export const REQUIREMENTS_2023 = {
  kikan: [
    {
      label: "基幹教育セミナー", buckets: ["seminar"], required: 1,
      named: [{ label: "基幹教育セミナー", required: 1, test: eq("基幹教育セミナー") }],
    },
    {
      label: "課題協学科目", buckets: ["icl"], required: 2.5,
      named: [{ label: "課題協学科目", required: 2.5, test: eq("課題協学科目") }],
    },
    { label: "文系ディシプリン科目", buckets: ["humanities"], required: 8 },
    {
      label: "理系ディシプリン科目", buckets: ["science"], required: 8,
      named: [
        { label: "情報科学", required: 2, test: eq("情報科学") },
        { label: "プログラミング演習", required: 1, test: eq("プログラミング演習") },
      ],
    },
    {
      label: "第1外国語+学術英語", buckets: ["lang1"], required: 12,
      named: [
        { label: "Intensive English（10科目）", required: 10, test: re(/^Intensive English/) },
        { label: "学術英語", required: 2, test: re(/学術英語/) },
      ],
    },
    { label: "第2外国語", buckets: ["lang2"], required: 4 },
    {
      label: "サイバーセキュリティ科目", buckets: ["cyber"], required: 1,
      named: [{ label: "サイバーセキュリティ基礎論", required: 1, test: eq("サイバーセキュリティ基礎論") }],
    },
    {
      label: "健康・スポーツ科目", buckets: ["health"], required: 1,
      named: [{ label: "健康・スポーツ科学演習", required: 1, test: eq("健康・スポーツ科学演習") }],
    },
    { label: "高年次基幹教育科目", buckets: ["advanced"], required: 2 },
  ],
  specialized: [
    {
      label: "共創基礎科目", buckets: ["fundamental"], required: 7,
      named: [
        { label: "学術研究基礎", required: 1, test: eq("学術研究基礎") },
        { label: "課題とイノベーション", required: 1, test: eq("課題とイノベーション") },
        { label: "共創のための数学", required: 1, test: eq("共創のための数学") },
        { label: "システム科学基礎", required: 1, test: eq("システム科学基礎") },
        { label: "データの収集・分析", required: 1, test: eq("データの収集・分析") },
        { label: "世界の様々な哲学", required: 1, test: eq("世界の様々な哲学") },
        { label: "世界を理解するための歴史的視座", required: 1, test: eq("世界を理解するための歴史的視座") },
      ],
    },
    {
      label: "構想科目（合計）", buckets: ["lectureSeries", "approachHS", "approachNS", "approachID", "framingOther"], required: 28,
      named: [{ label: "レクチャーシリーズ", required: 2, test: eq("レクチャーシリーズ") }],
    },
    { label: "アプローチ科目（人社）", buckets: ["approachHS"], required: 2 },
    { label: "アプローチ科目（自然）", buckets: ["approachNS"], required: 2 },
    { label: "アプローチ科目（学際）", buckets: ["approachID"], required: 2 },
    {
      label: "協働科目", buckets: ["collab"], required: 8,
      named: [
        { label: "共創基礎プロジェクト", required: 2, test: eq("共創基礎プロジェクト") },
        { label: "共創プロジェクト", required: 6, test: eq("共創プロジェクト") },
      ],
    },
    {
      label: "経験科目", buckets: ["experience"], required: 2,
      named: [
        { label: "異文化対応1", required: 1, test: re(/^異文化対応\s*1$/) },
        { label: "異文化対応2", required: 1, test: re(/^異文化対応\s*2$/) },
      ],
    },
    {
      label: "ディグリープロジェクト", buckets: ["degreeProject"], required: 9,
      named: [
        { label: "ディグリープロジェクト1", required: 2, test: re(/^ディグリープロジェクト1$/) },
        { label: "ディグリープロジェクト2", required: 5, test: re(/^ディグリープロジェクト2$/) },
        { label: "ディグリープロジェクト3", required: 2, test: re(/^ディグリープロジェクト3$/) },
      ],
    },
    {
      label: "共創発展演習", buckets: ["advSeminar"], required: 4,
      named: [
        { label: "共創発展演習1", required: 2, test: re(/^共創発展演習1$/) },
        { label: "共創発展演習2", required: 2, test: re(/^共創発展演習2$/) },
      ],
    },
    { label: "課題科目", buckets: ["issue"], required: 6 },
  ],
  framingTotal: 28,
  kikanOthersMin: 8.5,
  specOthersMin: 12,
  otherDeptCap: 10,
  totalRequired: 124,
};

export const BUCKET_LABELS = {
  seminar: "基幹教育セミナー",
  icl: "課題協学科目",
  humanities: "文系ディシプリン",
  science: "理系ディシプリン",
  lang1: "第1外国語+学術英語",
  lang2: "第2外国語",
  cyber: "サイバーセキュリティ",
  health: "健康・スポーツ",
  advanced: "高年次基幹教育",
  sogo: "総合科目（ﾌﾛﾝﾃｨｱ/ｵｰﾌﾟﾝ含む）",
  fundamental: "共創基礎科目",
  lectureSeries: "レクチャーシリーズ",
  framingOther: "構想科目（その他）",
  approachHS: "アプローチ（人社）",
  approachNS: "アプローチ（自然）",
  approachID: "アプローチ（学際）",
  collab: "協働科目",
  experience: "経験科目",
  degreeProject: "ディグリープロジェクト",
  advSeminar: "共創発展演習",
  issue: "課題科目",
  iicOther: "共創科目（その他）",
  otherDept: "他学部科目",
  othersKikan: "その他（基幹）手動",
  othersSpec: "その他（専攻）手動",
  unknown: "判別不能（要確認）",
  excluded: "除外（F/W等）",
};

export const EVIDENCE_LABELS = {
  genre: "ジャンル見出し",
  "genre+code": "ジャンル+コード",
  "genre+name": "ジャンル+科目名",
  code: "科目コード",
  override: "手動変更",
  unknown: "未判定",
};

const GENRE_MAP = {
  "基幹教育セミナー": "seminar",
  "課題協学科目": "icl",
  "文系ディシプリン科目": "humanities",
  "理系ディシプリン科目": "science",
  "言語文化基礎科目": "language",
  "言語文化科目": "language",
  "健康・スポーツ科目": "health",
  "サイバーセキュリティ科目": "cyber",
  "総合科目": "sogo",
  "フロンティア科目": "sogo",
  "オープン科目": "sogo",
  "高年次基幹教育科目": "advanced",
  "（共創）レクチャーシリーズ": "lectureSeries",
  "（共創）アプローチ科目": "approach",
  "（共創）共創基礎プロジェクト": "collab",
  "（共創）共創プロジェクト": "collab",
  "（共創）異文化対応": "experience",
  "（共創）海外活動": "experience",
  "（共創）グローバル・オンライン": "experience",
  "（共創）ディグリープロジェクト": "degreeProject",
  "（共創）課題科目": "issue",
  "（共創）共創発展演習": "advSeminar",
  "（共創）共創基礎科目": "fundamental",
  "（共創）構想科目": "framingUmbrella",
  "（共創）協働科目": "collab",
  "（共創）経験科目": "experience",
  "（共創）共創科目": "iicUmbrella",
};

const FACULTY_GENRE_RE = /^[(（].+[)）]専攻教育科目$/;
const APPROACH_FIELD_RE = /^〔(人社|自然|学際)〕/;
const APPROACH_FIELD_TO = { "人社": "HS", "自然": "NS", "学際": "ID" };
const FRAMING_FAMILY = new Set(["lectureSeries", "approachHS", "approachNS", "approachID"]);
const IIC_FAMILY = new Set(["degreeProject", "advSeminar", "issue"]);
const LANG2_NAME_RE = /中国語|ロシア語|ドイツ語|フランス語|スペイン語|韓国語|アラビア語|イタリア語|ポルトガル語|ベトナム語|インドネシア語|タイ語|モンゴル語|ヒンディー語|ラテン語|ギリシャ語|トルコ語|ウクライナ語|オランダ語|スウェーデン語|ノルウェー語|デンマーク語|フィンランド語|ポーランド語|チェコ語|ハンガリー語|ルーマニア語/;

function starts(s, p) {
  return typeof s === "string" && s.startsWith(p);
}

const GENRE_KEYS = Object.keys(GENRE_MAP);

function parenVariant(s) {
  return s.replace(/[（）]/g, ch => (ch === "（" ? "(" : ")"));
}

function resolveGenre(genre) {
  if (!genre) return null;
  const g = genre.trim();
  const variants = [g, parenVariant(g)];
  for (const v of variants) {
    if (v in GENRE_MAP) return GENRE_MAP[v];
    if (FACULTY_GENRE_RE.test(v)) return "otherDept";
  }
  const keys = GENRE_KEYS.slice().sort((a, b) => b.length - a.length);
  for (const k of keys) {
    if (g.includes(k) || g.includes(parenVariant(k))) return GENRE_MAP[k];
  }
  return null;
}

export function resolveCode(code, cfg = DEFAULT_CONFIG) {
  if (typeof code !== "string" || !code) return null;
  if (starts(code, "KED-KES1")) return "seminar";
  if (starts(code, "KED-ICL1")) return "icl";
  if (starts(code, "KED-HSS1")) return "humanities";
  if (/^KED-S(C|B|G|I|O)/.test(code)) return "science";
  if (cfg.lang1Prefixes.some(p => starts(code, p))) return "lang1";
  if (starts(code, "KED-LCB")) return "lang2";
  if (starts(code, "KED-CSC1")) return "cyber";
  if (starts(code, "KED-HSP1")) return "health";
  if (starts(code, "KED-ASC2")) return "advanced";
  if (starts(code, "KED-GES")) return "sogo";
  if (starts(code, "ISI-ISI13")) return "fundamental";
  if (starts(code, "ISI-ISI2601")) return "lectureSeries";
  if (/^ISI-ISI260[45]/.test(code)) return "experience";
  if (starts(code, "ISI-ISI2903") || starts(code, "ISI-ISI3901")) return "collab";
  if (starts(code, "ISI-ISI46")) return "degreeProject";
  if (starts(code, "ISI-ISI49")) return "advSeminar";
  if (/^ISI-ISI3(6|7|8)/.test(code)) return "issue";
  if (starts(code, "ISI-ISI21") || cfg.extraApproachHS.includes(code)) return "approachHS";
  if (starts(code, "ISI-ISI22") || cfg.extraApproachNS.includes(code)) return "approachNS";
  if (starts(code, "ISI-ISI23") || cfg.extraApproachID.includes(code)) return "approachID";
  if (!starts(code, "KED") && !starts(code, "ISI")) return "otherDept";
  return null;
}

function splitLanguage(course, cfg) {
  const n = course.name || "";
  const byName = /english|intensive english|academic english|学術英語/i.test(n)
    ? "lang1"
    : LANG2_NAME_RE.test(n)
      ? "lang2"
      : null;
  if (course.code) {
    if (cfg.lang1Prefixes.some(p => starts(course.code, p))) return "lang1";
    if (starts(course.code, "KED-LCB")) return "lang2";
    return byName || "lang2";
  }
  return byName || "lang2";
}

function splitApproach(course, cfg) {
  const m = (course.name || "").match(APPROACH_FIELD_RE);
  if (m) return "approach" + APPROACH_FIELD_TO[m[1]];
  if (course.code) {
    if (starts(course.code, "ISI-ISI21") || cfg.extraApproachHS.includes(course.code)) return "approachHS";
    if (starts(course.code, "ISI-ISI22") || cfg.extraApproachNS.includes(course.code)) return "approachNS";
    if (starts(course.code, "ISI-ISI23") || cfg.extraApproachID.includes(course.code)) return "approachID";
  }
  return null;
}

export function classifyCourse(course, cfg = DEFAULT_CONFIG, overrides = {}) {
  if (overrides && course.index in overrides && overrides[course.index]) {
    return { bucket: overrides[course.index], evidence: "override", conflicted: false };
  }
  const genreBucket = resolveGenre(course.genre);
  const codeBucket = resolveCode(course.code, cfg);
  let bucket = null;
  let evidence = null;
  if (genreBucket === "language") {
    bucket = splitLanguage(course, cfg);
    evidence = course.code ? "genre+code" : "genre+name";
  } else if (genreBucket === "approach") {
    bucket = splitApproach(course, cfg);
    evidence = bucket && APPROACH_FIELD_RE.test(course.name || "") ? "genre+name" : "genre+code";
    if (!bucket) {
      bucket = "framingOther";
      evidence = "genre";
    }
  } else if (genreBucket === "framingUmbrella") {
    bucket = FRAMING_FAMILY.has(codeBucket) ? codeBucket : "framingOther";
    evidence = FRAMING_FAMILY.has(codeBucket) ? "code" : "genre";
  } else if (genreBucket === "iicUmbrella") {
    bucket = IIC_FAMILY.has(codeBucket) ? codeBucket : "iicOther";
    evidence = IIC_FAMILY.has(codeBucket) ? "code" : "genre";
  } else if (genreBucket) {
    bucket = genreBucket;
    evidence = "genre";
  } else if (codeBucket) {
    bucket = codeBucket;
    evidence = "code";
  } else {
    bucket = "unknown";
    evidence = "unknown";
  }
  const conflicted = !!(bucket && codeBucket && bucket !== codeBucket);
  return { bucket, evidence, conflicted };
}

const sum = (buckets, key) => (buckets.get(key) || []).reduce((s, e) => s + e.course.credits, 0);
const sumNamed = (buckets, key, test) => (buckets.get(key) || []).reduce((s, e) => (test(e.course.name) ? s + e.course.credits : s), 0);
const excess = (buckets, key, min) => Math.max(0, sum(buckets, key) - min);

export function evaluate(courses, cfg = DEFAULT_CONFIG, overrides = {}) {
  const R = REQUIREMENTS_2023;
  const buckets = new Map();
  const excluded = [];
  for (const course of courses) {
    if (!PASS_GRADES.has(course.grade)) {
      excluded.push({ course, reason: course.grade ? `${course.grade}（未修得）` : "成績不明" });
      continue;
    }
    const { bucket, evidence, conflicted } = classifyCourse(course, cfg, overrides);
    const entry = { course, bucket, evidence, conflicted };
    buckets.set(bucket, [...(buckets.get(bucket) || []), entry]);
  }

  const otherDeptEntries = buckets.get("otherDept") || [];
  let otherDeptCounted = 0;
  const otherDeptDetails = otherDeptEntries.map(e => {
    const take = Math.min(e.course.credits, Math.max(0, R.otherDeptCap - otherDeptCounted));
    otherDeptCounted += take;
    return { ...e, countedCredits: take, capped: take < e.course.credits };
  });

  const ok = [];
  const missing = [];
  const check = (label, earned, required, namedShort = 0, named = []) => {
    const item = { label, earned, required, short: Math.max(0, required - earned, namedShort), named };
    ((earned >= required && namedShort === 0) ? ok : missing).push(item);
    return item;
  };

  const checkReq = r => {
    const earned = r.buckets.reduce((s, k) => s + sum(buckets, k), 0);
    let namedShort = 0;
    const named = (r.named || []).map(nm => {
      const ne = r.buckets.reduce((s, k) => s + sumNamed(buckets, k, nm.test), 0);
      const ns = Math.max(0, nm.required - ne);
      namedShort += ns;
      return { label: nm.label, earned: ne, required: nm.required, short: ns };
    });
    check(r.label, earned, r.required, namedShort, named);
  };

  for (const r of R.kikan) checkReq(r);
  for (const r of R.specialized) checkReq(r);

  const framing = sum(buckets, "lectureSeries") + sum(buckets, "approachHS") + sum(buckets, "approachNS") + sum(buckets, "approachID") + sum(buckets, "framingOther");

  const A = excess(buckets, "seminar", 1) + excess(buckets, "icl", 2.5) + excess(buckets, "humanities", 8) + excess(buckets, "science", 8);
  const B = excess(buckets, "lang1", 12) + excess(buckets, "lang2", 4);
  const C = excess(buckets, "cyber", 1) + excess(buckets, "health", 1);
  const D = sum(buckets, "sogo");
  const E = excess(buckets, "advanced", 2);
  const F = otherDeptCounted;
  const kikanFixed = A + B + C + sum(buckets, "othersKikan");
  const flexible = D + E + F;
  const dIntoKikan = Math.min(flexible, Math.max(0, R.kikanOthersMin - kikanFixed));
  const kikanOthers = kikanFixed + dIntoKikan;

  const o = Math.max(0, framing - R.framingTotal);
  const ka = Math.min(Math.max(0, sum(buckets, "collab") - 8), 2);
  const ki = Math.max(0, sum(buckets, "experience") - 2);
  const ku = Math.max(0, (sum(buckets, "degreeProject") + sum(buckets, "advSeminar") + sum(buckets, "issue")) - 19);
  const iic = sum(buckets, "iicOther");
  const specFixed = o + ka + ki + ku + iic + sum(buckets, "othersSpec");
  const specOthers = specFixed + (flexible - dIntoKikan);

  check("基幹教育科目その他", kikanOthers, R.kikanOthersMin);
  check("専攻教育科目その他", specOthers, R.specOthersMin);

  const collabCapped = Math.min(sum(buckets, "collab"), 10);
  let totalCredits = 0;
  for (const [b, entries] of buckets) {
    if (b === "unknown") continue;
    if (b === "otherDept") { totalCredits += otherDeptCounted; continue; }
    if (b === "collab") { totalCredits += collabCapped; continue; }
    totalCredits += sum(buckets, b);
  }
  const totalItem = check("総修得単位数", totalCredits, R.totalRequired);

  return {
    ok,
    missing,
    totalShort: missing.filter(m => m.label !== "総修得単位数").reduce((s, m) => s + m.short, 0),
    totalCredits,
    totalRequired: R.totalRequired,
    kikanOthers: {
      earned: kikanOthers,
      required: R.kikanOthersMin,
      breakdown: { A, B, C, D, E, F, dIntoKikan, specPortion: flexible - dIntoKikan },
    },
    specOthers: {
      earned: specOthers,
      required: R.specOthersMin,
      breakdown: { o, ka, ki, ku, iic, othersSpec: sum(buckets, "othersSpec"), fromFlexible: flexible - dIntoKikan },
    },
    buckets: Object.fromEntries([...buckets].map(([k, v]) => [k, sum(buckets, k)])),
    courses: [...buckets].flatMap(([, v]) => v).map(e => {
      const od = e.bucket === "otherDept" ? otherDeptDetails.find(x => x.course === e.course) : null;
      return { ...e, countedCredits: od ? od.countedCredits : e.course.credits, capped: od ? od.capped : false };
    }),
    unknownCourses: buckets.get("unknown") || [],
    excludedCourses: excluded,
  };
}