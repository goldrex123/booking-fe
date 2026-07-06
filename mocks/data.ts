import type { Vehicle } from "@/types/vehicle";
import type { AncillaryRoom } from "@/types/room";

// ── 테스트 계정 ──────────────────────────────────────────────────────────────
// admin@company.com  → 관리자 (비밀번호 무관)
// user@company.com   → 일반 사용자 (비밀번호 무관)

export type MockUser = {
  id: number;
  email: string;
  name: string;
  department: string;
  role: "ROLE_ADMIN" | "ROLE_USER";
};

export const mockUsers: MockUser[] = [
  { id: 1, email: "admin@company.com", name: "관리자", department: "IT팀", role: "ROLE_ADMIN" },
  { id: 2, email: "user@company.com",  name: "홍길동", department: "개발팀", role: "ROLE_USER" },
  { id: 3, email: "kim@company.com",   name: "김영희", department: "마케팅팀", role: "ROLE_USER" },
  { id: 4, email: "lee@company.com",   name: "이철수", department: "영업팀", role: "ROLE_USER" },
  { id: 5, email: "park@company.com",  name: "박민지", department: "인사팀", role: "ROLE_USER" },
];

// ── 차량 ─────────────────────────────────────────────────────────────────────
export const initialVehicles: Vehicle[] = [
  { id: 1, model: "소나타 2.0",   licensePlate: "12가 3456", seats: 5,  status: "ACTIVE",   note: "주차 B1 3번" },
  { id: 2, model: "그랜저 3.0",   licensePlate: "34나 5678", seats: 5,  status: "ACTIVE" },
  { id: 3, model: "스타렉스 2.5", licensePlate: "56다 7890", seats: 11, status: "ACTIVE",   note: "대형 행사 전용" },
  { id: 4, model: "아반떼 1.6",   licensePlate: "78라 1234", seats: 5,  status: "INACTIVE", note: "정비 중 (~ 4/15)" },
  { id: 5, model: "카니발 2.2",   licensePlate: "90마 5678", seats: 9,  status: "ACTIVE" },
];

// ── 부속실 ───────────────────────────────────────────────────────────────────
export const initialRooms: AncillaryRoom[] = [
  { id: 1, name: "회의실 A",  location: "3층 301호", capacity: 8,  status: "ACTIVE",   description: "빔프로젝터, 화이트보드 2개" },
  { id: 2, name: "회의실 B",  location: "3층 302호", capacity: 4,  status: "ACTIVE" },
  { id: 3, name: "대회의실",  location: "5층 501호", capacity: 20, status: "ACTIVE",   description: "대형 스크린, 음향 시스템" },
  { id: 4, name: "소회의실",  location: "2층 201호", capacity: 2,  status: "INACTIVE", description: "리모델링 중 (4월 말 완료 예정)" },
];

// ── 예약 (Phase 4 대비) ───────────────────────────────────────────────────────
export type MockReservation = {
  id: number;
  resourceType: "VEHICLE" | "ROOM";
  resourceId: number;
  resourceName: string;
  userId: number;
  userName: string;
  userDepartment: string;
  startAt: string;  // ISO 8601
  endAt: string;
  purpose: string;
  destination?: string;  // 차량 전용
  status: "CONFIRMED" | "CANCELLED";
  createdAt: string;
};

const today = new Date();
const d = (offsetDays: number, h: number, m = 0) => {
  const dt = new Date(today);
  dt.setDate(dt.getDate() + offsetDays);
  dt.setHours(h, m, 0, 0);
  return dt.toISOString();
};

export const initialReservations: MockReservation[] = [
  // ── 진행 예정 ─────────────────────────────────────────────────────
  {
    id: 1, resourceType: "VEHICLE", resourceId: 1, resourceName: "소나타 2.0 (12가 3456)",
    userId: 2, userName: "홍길동", userDepartment: "개발팀",
    startAt: d(1, 9), endAt: d(1, 12),
    purpose: "고객사 미팅", destination: "강남구 테헤란로",
    status: "CONFIRMED", createdAt: d(-1, 14),
  },
  {
    id: 2, resourceType: "ROOM", resourceId: 1, resourceName: "회의실 A",
    userId: 3, userName: "김영희", userDepartment: "마케팅팀",
    startAt: d(1, 14), endAt: d(1, 16),
    purpose: "마케팅 전략 회의",
    status: "CONFIRMED", createdAt: d(-2, 10),
  },
  {
    id: 3, resourceType: "VEHICLE", resourceId: 2, resourceName: "그랜저 3.0 (34나 5678)",
    userId: 4, userName: "이철수", userDepartment: "영업팀",
    startAt: d(2, 10), endAt: d(2, 18),
    purpose: "부산 출장", destination: "부산 해운대구",
    status: "CONFIRMED", createdAt: d(-1, 9),
  },
  {
    id: 4, resourceType: "ROOM", resourceId: 3, resourceName: "대회의실",
    userId: 1, userName: "관리자", userDepartment: "IT팀",
    startAt: d(3, 9), endAt: d(3, 11),
    purpose: "전사 타운홀 미팅",
    status: "CONFIRMED", createdAt: d(-3, 15),
  },
  {
    id: 5, resourceType: "VEHICLE", resourceId: 5, resourceName: "카니발 2.2 (90마 5678)",
    userId: 5, userName: "박민지", userDepartment: "인사팀",
    startAt: d(5, 13), endAt: d(5, 17),
    purpose: "신규 입사자 오리엔테이션 장소 답사", destination: "서울 중구",
    status: "CONFIRMED", createdAt: d(-1, 11),
  },
  // ── 오늘 ─────────────────────────────────────────────────────────
  {
    id: 6, resourceType: "ROOM", resourceId: 2, resourceName: "회의실 B",
    userId: 2, userName: "홍길동", userDepartment: "개발팀",
    startAt: d(0, 10), endAt: d(0, 11),
    purpose: "스프린트 계획 회의",
    status: "CONFIRMED", createdAt: d(-1, 16),
  },
  // ── 과거 (완료) ───────────────────────────────────────────────────
  {
    id: 7, resourceType: "VEHICLE", resourceId: 1, resourceName: "소나타 2.0 (12가 3456)",
    userId: 3, userName: "김영희", userDepartment: "마케팅팀",
    startAt: d(-3, 9), endAt: d(-3, 13),
    purpose: "광고 촬영 장소 섭외", destination: "경기 성남시",
    status: "CONFIRMED", createdAt: d(-5, 10),
  },
  {
    id: 8, resourceType: "ROOM", resourceId: 1, resourceName: "회의실 A",
    userId: 4, userName: "이철수", userDepartment: "영업팀",
    startAt: d(-2, 15), endAt: d(-2, 17),
    purpose: "분기 실적 보고",
    status: "CANCELLED", createdAt: d(-7, 9),
  },
  {
    id: 9, resourceType: "VEHICLE", resourceId: 3, resourceName: "스타렉스 2.5 (56다 7890)",
    userId: 2, userName: "홍길동", userDepartment: "개발팀",
    startAt: d(-5, 8), endAt: d(-5, 20),
    purpose: "팀 워크숍 이동", destination: "강원도 춘천시",
    status: "CONFIRMED", createdAt: d(-10, 14),
  },
  {
    id: 10, resourceType: "ROOM", resourceId: 3, resourceName: "대회의실",
    userId: 5, userName: "박민지", userDepartment: "인사팀",
    startAt: d(-7, 10), endAt: d(-7, 12),
    purpose: "2024 하반기 채용 면접",
    status: "CONFIRMED", createdAt: d(-14, 9),
  },
];
