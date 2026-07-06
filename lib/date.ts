// 백엔드는 LocalDateTime(ISO_LOCAL_DATE_TIME, 예: "2026-06-28T09:00:00")을 기대한다.
// Date#toISOString()은 UTC로 변환하고 밀리초와 "Z"를 붙이므로 그대로 보내면 안 되고,
// 로컬 시각 그대로를 초 단위까지만 문자열로 만들어 전달해야 한다.
export function toLocalDateTimeString(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
