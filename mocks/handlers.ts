import { http, HttpResponse, delay } from "msw";
import {
  mockUsers,
  initialVehicles,
  initialRooms,
  initialReservations,
  type MockUser,
  type MockReservation,
} from "./data";
import type { Vehicle } from "@/types/vehicle";
import type { AncillaryRoom } from "@/types/room";

// apiClient가 상대경로(same-origin)로 요청하므로 목 핸들러도 상대경로로 매칭한다.
const BASE = "";

// ── 인메모리 상태 ─────────────────────────────────────────────────────────────
// 목 서버 역할: 브라우저 세션 동안만 유지되며, 새로고침 시 초기화됩니다.
let mockSession: { accessToken: string; user: MockUser } | null = null;
let vehicles: Vehicle[] = [...initialVehicles];
let rooms: AncillaryRoom[] = [...initialRooms];
let reservations: MockReservation[] = [...initialReservations];
let nextVehicleId = vehicles.length + 1;
let nextRoomId = rooms.length + 1;
let nextReservationId = reservations.length + 1;

const FAKE_DELAY = 300; // ms — 실제 API 체감을 위한 지연

// ── 인증 ─────────────────────────────────────────────────────────────────────
const authHandlers = [
  http.post(`${BASE}/api/auth/login`, async ({ request }) => {
    await delay(FAKE_DELAY);
    const { email } = (await request.json()) as { email: string; password: string };
    const user = mockUsers.find((u) => u.email === email);

    if (!user) {
      return HttpResponse.json(
        { message: "이메일 또는 비밀번호가 올바르지 않습니다" },
        { status: 401 }
      );
    }

    const accessToken = `mock-token-${user.id}-${Date.now()}`;
    mockSession = { accessToken, user };

    return HttpResponse.json({ accessToken, user });
  }),

  http.post(`${BASE}/api/auth/signup`, async () => {
    await delay(FAKE_DELAY);
    return new HttpResponse(null, { status: 201 });
  }),

  http.post(`${BASE}/api/auth/logout`, async () => {
    await delay(FAKE_DELAY);
    mockSession = null;
    return new HttpResponse(null, { status: 200 });
  }),

  http.post(`${BASE}/api/auth/refresh`, async () => {
    await delay(FAKE_DELAY);
    if (!mockSession) {
      return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const newToken = `mock-token-${mockSession.user.id}-${Date.now()}`;
    mockSession = { ...mockSession, accessToken: newToken };
    return HttpResponse.json({ accessToken: newToken, user: mockSession.user });
  }),
];

// ── 차량 관리 ─────────────────────────────────────────────────────────────────
const vehicleAdminHandlers = [
  http.get(`${BASE}/api/admin/vehicles`, async () => {
    await delay(FAKE_DELAY);
    return HttpResponse.json(vehicles);
  }),

  http.post(`${BASE}/api/admin/vehicles`, async ({ request }) => {
    await delay(FAKE_DELAY);
    const dto = (await request.json()) as Omit<Vehicle, "id" | "status">;
    const newVehicle: Vehicle = { ...dto, id: nextVehicleId++, status: "ACTIVE" };
    vehicles = [...vehicles, newVehicle];
    return HttpResponse.json(newVehicle, { status: 201 });
  }),

  http.put(`${BASE}/api/admin/vehicles/:id`, async ({ params, request }) => {
    await delay(FAKE_DELAY);
    const id = Number(params.id);
    const dto = (await request.json()) as Partial<Vehicle>;
    const idx = vehicles.findIndex((v) => v.id === id);
    if (idx === -1) return HttpResponse.json({ message: "Not found" }, { status: 404 });

    vehicles = vehicles.map((v) => (v.id === id ? { ...v, ...dto } : v));
    return HttpResponse.json(vehicles.find((v) => v.id === id));
  }),

  http.patch(`${BASE}/api/admin/vehicles/:id/status`, async ({ params, request }) => {
    await delay(FAKE_DELAY);
    const id = Number(params.id);
    const { status } = (await request.json()) as { status: "ACTIVE" | "INACTIVE" };
    const idx = vehicles.findIndex((v) => v.id === id);
    if (idx === -1) return HttpResponse.json({ message: "Not found" }, { status: 404 });

    vehicles = vehicles.map((v) => (v.id === id ? { ...v, status } : v));
    return HttpResponse.json(vehicles.find((v) => v.id === id));
  }),
];

// ── 부속실 관리 ───────────────────────────────────────────────────────────────
const roomAdminHandlers = [
  http.get(`${BASE}/api/admin/rooms`, async () => {
    await delay(FAKE_DELAY);
    return HttpResponse.json(rooms);
  }),

  http.post(`${BASE}/api/admin/rooms`, async ({ request }) => {
    await delay(FAKE_DELAY);
    const dto = (await request.json()) as Omit<AncillaryRoom, "id" | "status">;
    const newRoom: AncillaryRoom = { ...dto, id: nextRoomId++, status: "ACTIVE" };
    rooms = [...rooms, newRoom];
    return HttpResponse.json(newRoom, { status: 201 });
  }),

  http.put(`${BASE}/api/admin/rooms/:id`, async ({ params, request }) => {
    await delay(FAKE_DELAY);
    const id = Number(params.id);
    const dto = (await request.json()) as Partial<AncillaryRoom>;
    const idx = rooms.findIndex((r) => r.id === id);
    if (idx === -1) return HttpResponse.json({ message: "Not found" }, { status: 404 });

    rooms = rooms.map((r) => (r.id === id ? { ...r, ...dto } : r));
    return HttpResponse.json(rooms.find((r) => r.id === id));
  }),

  http.patch(`${BASE}/api/admin/rooms/:id/status`, async ({ params, request }) => {
    await delay(FAKE_DELAY);
    const id = Number(params.id);
    const { status } = (await request.json()) as { status: "ACTIVE" | "INACTIVE" };
    const idx = rooms.findIndex((r) => r.id === id);
    if (idx === -1) return HttpResponse.json({ message: "Not found" }, { status: 404 });

    rooms = rooms.map((r) => (r.id === id ? { ...r, status } : r));
    return HttpResponse.json(rooms.find((r) => r.id === id));
  }),
];

// ── 가용성 조회 (Phase 4) ─────────────────────────────────────────────────────
const availabilityHandlers = [
  http.get(`${BASE}/api/vehicles/available`, async ({ request }) => {
    await delay(FAKE_DELAY);
    const url = new URL(request.url);
    const startAt = url.searchParams.get("startAt");
    const endAt = url.searchParams.get("endAt");
    const excludeId = url.searchParams.get("excludeId");

    if (!startAt || !endAt) {
      return HttpResponse.json({ message: "startAt, endAt required" }, { status: 400 });
    }

    const start = new Date(startAt).getTime();
    const end = new Date(endAt).getTime();

    // 해당 시간대에 CONFIRMED 예약이 있는 차량 ID 수집
    const busyVehicleIds = new Set(
      reservations
        .filter(
          (r) =>
            r.resourceType === "VEHICLE" &&
            r.status === "CONFIRMED" &&
            r.id !== Number(excludeId) &&
            new Date(r.startAt).getTime() < end &&
            new Date(r.endAt).getTime() > start
        )
        .map((r) => r.resourceId)
    );

    const available = vehicles.filter(
      (v) => v.status === "ACTIVE" && !busyVehicleIds.has(v.id)
    );
    return HttpResponse.json(available);
  }),

  http.get(`${BASE}/api/rooms/available`, async ({ request }) => {
    await delay(FAKE_DELAY);
    const url = new URL(request.url);
    const startAt = url.searchParams.get("startAt");
    const endAt = url.searchParams.get("endAt");
    const excludeId = url.searchParams.get("excludeId");

    if (!startAt || !endAt) {
      return HttpResponse.json({ message: "startAt, endAt required" }, { status: 400 });
    }

    const start = new Date(startAt).getTime();
    const end = new Date(endAt).getTime();

    const busyRoomIds = new Set(
      reservations
        .filter(
          (r) =>
            r.resourceType === "ROOM" &&
            r.status === "CONFIRMED" &&
            r.id !== Number(excludeId) &&
            new Date(r.startAt).getTime() < end &&
            new Date(r.endAt).getTime() > start
        )
        .map((r) => r.resourceId)
    );

    const available = rooms.filter(
      (rm) => rm.status === "ACTIVE" && !busyRoomIds.has(rm.id)
    );
    return HttpResponse.json(available);
  }),
];

// ── 예약 (Phase 4) ────────────────────────────────────────────────────────────
const reservationHandlers = [
  http.get(`${BASE}/api/reservations`, async ({ request }) => {
    await delay(FAKE_DELAY);
    const url = new URL(request.url);
    const resourceType = url.searchParams.get("resourceType");
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");

    let result = [...reservations];
    if (resourceType) result = result.filter((r) => r.resourceType === resourceType);
    if (startDate) result = result.filter((r) => r.endAt >= startDate);
    if (endDate) result = result.filter((r) => r.startAt <= endDate + "T23:59:59");
    return HttpResponse.json(result);
  }),

  http.get(`${BASE}/api/reservations/my`, async () => {
    await delay(FAKE_DELAY);
    const userId = mockSession?.user.id;
    if (!userId) return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
    const myReservations = reservations
      .filter((r) => r.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return HttpResponse.json(myReservations);
  }),

  http.get(`${BASE}/api/reservations/:id`, async ({ params }) => {
    await delay(FAKE_DELAY);
    const reservation = reservations.find((r) => r.id === Number(params.id));
    if (!reservation) return HttpResponse.json({ message: "Not found" }, { status: 404 });
    return HttpResponse.json(reservation);
  }),

  http.post(`${BASE}/api/reservations`, async ({ request }) => {
    await delay(FAKE_DELAY);
    if (!mockSession) return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });

    const dto = (await request.json()) as {
      resourceType: "VEHICLE" | "ROOM";
      resourceId: number;
      startAt: string;
      endAt: string;
      purpose: string;
      destination?: string;
    };

    // 충돌 검사
    const conflict = reservations.find(
      (r) =>
        r.resourceType === dto.resourceType &&
        r.resourceId === dto.resourceId &&
        r.status === "CONFIRMED" &&
        new Date(r.startAt).getTime() < new Date(dto.endAt).getTime() &&
        new Date(r.endAt).getTime() > new Date(dto.startAt).getTime()
    );
    if (conflict) {
      return HttpResponse.json(
        { message: "해당 시간대에 이미 예약이 존재합니다" },
        { status: 409 }
      );
    }

    const resource =
      dto.resourceType === "VEHICLE"
        ? vehicles.find((v) => v.id === dto.resourceId)
        : rooms.find((r) => r.id === dto.resourceId);

    const resourceName =
      dto.resourceType === "VEHICLE" && resource
        ? `${(resource as Vehicle).model} (${(resource as Vehicle).licensePlate})`
        : (resource as AncillaryRoom)?.name ?? "알 수 없음";

    const newReservation: MockReservation = {
      id: nextReservationId++,
      resourceType: dto.resourceType,
      resourceId: dto.resourceId,
      resourceName,
      userId: mockSession.user.id,
      userName: mockSession.user.name,
      userDepartment: mockSession.user.department,
      startAt: dto.startAt,
      endAt: dto.endAt,
      purpose: dto.purpose,
      destination: dto.destination,
      status: "CONFIRMED",
      createdAt: new Date().toISOString(),
    };

    reservations = [...reservations, newReservation];
    return HttpResponse.json(newReservation, { status: 201 });
  }),

  http.put(`${BASE}/api/reservations/:id`, async ({ params, request }) => {
    await delay(FAKE_DELAY);
    const id = Number(params.id);
    const dto = (await request.json()) as Partial<MockReservation>;
    const idx = reservations.findIndex((r) => r.id === id);
    if (idx === -1) return HttpResponse.json({ message: "Not found" }, { status: 404 });

    reservations = reservations.map((r) => (r.id === id ? { ...r, ...dto } : r));
    return HttpResponse.json(reservations.find((r) => r.id === id));
  }),

  http.delete(`${BASE}/api/reservations/:id`, async ({ params }) => {
    await delay(FAKE_DELAY);
    const id = Number(params.id);
    const idx = reservations.findIndex((r) => r.id === id);
    if (idx === -1) return HttpResponse.json({ message: "Not found" }, { status: 404 });

    reservations = reservations.map((r) =>
      r.id === id ? { ...r, status: "CANCELLED" } : r
    );
    return new HttpResponse(null, { status: 204 });
  }),
];

// ── 사용자 관리 (Phase 5) ─────────────────────────────────────────────────────
const userAdminHandlers = [
  http.get(`${BASE}/api/admin/users`, async () => {
    await delay(FAKE_DELAY);
    return HttpResponse.json(mockUsers);
  }),

  http.patch(`${BASE}/api/admin/users/:id/role`, async ({ params, request }) => {
    await delay(FAKE_DELAY);
    const id = Number(params.id);
    const { role } = (await request.json()) as { role: "ROLE_ADMIN" | "ROLE_USER" };
    const user = mockUsers.find((u) => u.id === id);
    if (!user) return HttpResponse.json({ message: "Not found" }, { status: 404 });
    // 실제 배열 변경 없이 응답만 반환 (목 데이터 단순화)
    return HttpResponse.json({ ...user, role });
  }),
];

// ── 전체 핸들러 내보내기 ──────────────────────────────────────────────────────
export const handlers = [
  ...authHandlers,
  ...vehicleAdminHandlers,
  ...roomAdminHandlers,
  ...availabilityHandlers,
  ...reservationHandlers,
  ...userAdminHandlers,
];
