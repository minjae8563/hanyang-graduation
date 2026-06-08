// 한국 위기상담 자원 (2024.1월 자살예방 상담전화 109 통합 기준).
// 자살·자해 신호가 감지될 때 사용자에게 노출한다.
export const CRISIS_LINES: {
  name: string;
  number: string;
  tel: string;
  note: string;
}[] = [
  {
    name: "자살예방 상담전화",
    number: "109",
    tel: "109",
    note: "24시간 · 익명 · 무료",
  },
  {
    name: "정신건강 위기상담",
    number: "1577-0199",
    tel: "1577-0199",
    note: "24시간 · 365일",
  },
  {
    name: "청소년 상담전화",
    number: "1388",
    tel: "1388",
    note: "청소년·청년 상담",
  },
  {
    name: "생명이 위급할 때",
    number: "119",
    tel: "119",
    note: "응급 상황",
  },
];
