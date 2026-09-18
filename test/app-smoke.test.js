import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const els = new Map();

function makeEl(id) {
  return {
    id,
    value: "",
    textContent: "",
    innerHTML: "",
    hidden: false,
    dataset: {},
    classList: { add() {}, remove() {} },
    listeners: {},
    addEventListener(type, fn) { this.listeners[type] = fn; },
    dispatch(type, ev = {}) { this.listeners[type]?.(ev); },
    click() {},
  };
}

globalThis.document = {
  getElementById: id => {
    if (!els.has(id)) els.set(id, makeEl(id));
    return els.get(id);
  },
  querySelectorAll: () => [],
  addEventListener() {},
};
globalThis.localStorage = {
  getItem: () => null,
  setItem() {},
  removeItem() {},
};

test("app.js: DOMスタブ上で起動し、実HTMLのチェックが一連のレンダリングを実行できる", async t => {
  await import("../src/app.js?smoke=" + Date.now());
  let html;
  try {
    html = readFileSync(new URL("../Campusmate.html", import.meta.url), "utf-8");
  } catch {
    return t.skip();
  }
  document.getElementById("pasteArea").value = html;
  els.get("runBtn").dispatch("click");

  assert.match(els.get("summary").innerHTML, /118\.5 \/ 124 単位/);
  assert.match(els.get("summary").innerHTML, /第2外国語（データから自動推定）/);
  assert.match(els.get("summary").innerHTML, /中国語（6単位）/);
  assert.match(els.get("missing").innerHTML, /ディグリープロジェクト/);
  assert.match(els.get("missing").innerHTML, /<th class="num">不足<\/th>/);
  assert.match(els.get("missing").innerHTML, /新規に取らなければいけない単位数（要件別の不足単位の合計）/);
  assert.match(els.get("missing").innerHTML, /<b>11単位<\/b>/);
  assert.match(els.get("missing").innerHTML, /必須科目/);
  assert.match(els.get("missing").innerHTML, /ディグリープロジェクト2（5単位）/);
  assert.match(els.get("missing").innerHTML, /共創発展演習2（2単位）/);
  assert.match(els.get("missing").innerHTML, /共創プロジェクト（6単位）/);
  assert.match(els.get("progress").innerHTML, /基幹教育科目（48単位）/);
  assert.match(els.get("progress").innerHTML, /専攻教育科目（76単位）/);
  assert.match(els.get("others").innerHTML, /基幹教育科目その他/);
  assert.match(els.get("others").innerHTML, /専攻教育科目その他/);
  assert.match(els.get("courses").innerHTML, /科目別の扱い/);
  assert.match(els.get("courses").innerHTML, /106科目/);
  assert.match(els.get("excluded").innerHTML, /除外された科目/);
  assert.match(els.get("excluded").innerHTML, /環境ガバナンス/);
});

test("app.js: 未知の区分とコードの科目は判別不能として警告表示される", async () => {
  const html = `<table>${`<tr><td colspan="10">（共創）新設区分</td></tr><tr><td>謎の科目</td><td>1</td><td>Ｓ</td><td>4.0</td><td>2025</td><td>秋学期</td><td>KED-XXX9999</td><td></td><td></td><td></td></tr>`}</table>`;
  document.getElementById("pasteArea").value = html;
  els.get("runBtn").dispatch("click");
  assert.match(els.get("courses").innerHTML, /判別不能 1 科目/);
});