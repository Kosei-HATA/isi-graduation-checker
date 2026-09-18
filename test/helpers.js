import { parseGradeHTML } from "../src/parser.js";

export function makeRow({ name, credits = "1", grade = "S", gpa = "4.0", year = "2025", term = "秋学期", code = "", cls = "", teacher = "山田", date = "2026/02/18" }) {
  return `<tr class="column_odd"><td style="word-break:break-all;">${name}</td><td style="text-align:center">${credits}</td><td style="word-break:break-all;text-align:center;">${grade}</td><td style="padding-left:3px;text-align:center">${gpa}</td><td style="padding-left:3px;text-align:center">${year}</td><td style="word-break:break-all;padding-left:3px;text-align:center">${term}</td><td style="word-break:break-all;padding-left:3px;text-align:center">${code}</td><td style="word-break:break-all;padding-left:3px;text-align:center">${cls}</td><td style="word-break:break-all;padding-left:3px;text-align:center">${teacher}</td><td style="padding-left:3px;text-align:center">${date}</td></tr>`;
}

export function makeHeader(text) {
  return `<tr><td colspan="10" style="">${text}</td></tr>`;
}

export function makeHtml(genres) {
  const parts = [];
  for (const g of genres) {
    if (typeof g === "string") {
      parts.push(makeHeader(g));
    } else {
      parts.push(makeRow(g));
    }
  }
  return `<html><head><title>成績照会</title></head><body><table class="list"><tr class="column_even"><td>分野系列名／科目名</td><td>単位</td><td>評価</td><td>GPA</td><td>年度</td><td>学期</td><td>科目ナンバリング</td><td>クラス</td><td>教員</td><td>修得日</td></tr>${parts.join("\n")}</table></body></html>`;
}

export function makeCourses(rows) {
  return parseGradeHTML(makeHtml(rows)).courses;
}