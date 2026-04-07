# 개발 작업 목록 (TASK)

> PLAN.md 기반 세부 구현 작업 목록. 위에서 아래로 순서대로 진행한다.

---

## Phase 1: 프로젝트 셋업

### 프로젝트 초기화
- [ ] `create-next-app` 실행 — TypeScript, App Router, TailwindCSS v4 선택
- [ ] 불필요한 보일러플레이트 제거 (`page.tsx` 초기화, `globals.css` 정리)
- [ ] `.env.local` 생성 및 `NEXT_PUBLIC_API_URL` 변수 추가

### shadcn/ui 설정
- [ ] `npx shadcn@latest init` 실행
- [ ] 컴포넌트 설치: `button`, `input`, `form`, `dialog`, `badge`, `table`, `tabs`
- [ ] Sonner (Toast) 설치: `npx shadcn@latest add sonner`
- [ ] `Toaster` 컴포넌트를 `layout.tsx`에 등록

### 패키지 설치
- [ ] `axios` 설치
- [ ] `@tanstack/react-query`, `@tanstack/react-query-devtools` 설치
- [ ] `zustand` 설치
- [ ] `react-hook-form`, `zod`, `@hookform/resolvers` 설치
- [ ] `lucide-react` 설치

### 공통 인프라 구성
- [ ] `/lib/axios.ts` — Axios 인스턴스 생성 (`baseURL`, `withCredentials: true`)
- [ ] `/app/providers.tsx` — `QueryClientProvider` 래퍼 컴포넌트 생성
- [ ] `/app/layout.tsx` — `Providers` 등록, `Toaster` 등록, 기본 폰트 설정
- [ ] `/components/layout/nav.tsx` — 공통 네비게이션 컴포넌트 (빈 껍데기)

---

## Phase 2: JWT 인증

### Zustand 인증 스토어
- [ ] `/store/auth.store.ts` 생성
  - [ ] 상태: `accessToken: string | null`, `user: { id, email, role } | null`
  - [ ] 액션: `setAuth(token, user)`, `clearAuth()`

### Axios 인터셉터
- [ ] `/lib/axios.ts` — Request Interceptor 추가
  - [ ] `useAuthStore`에서 `accessToken` 읽어 `Authorization: Bearer <token>` 헤더 첨부
- [ ] `/lib/axios.ts` — Response Interceptor 추가 (Silent Refresh)
  - [ ] 401 수신 시 `POST /api/auth/refresh` 호출
  - [ ] 갱신 성공 → 새 `accessToken` 메모리 저장 → 원래 요청 재시도
  - [ ] 갱신 실패 → `clearAuth()` 호출 → `/login` 리디렉션
  - [ ] 동시 다발 401 처리: 갱신 중 큐 적재 후 완료 시 일괄 재시도

### AuthProvider (초기화 시 토큰 복원)
- [ ] `/components/auth/auth-provider.tsx` 생성
  - [ ] 마운트 시 `POST /api/auth/refresh` 호출
  - [ ] 성공 → `setAuth(token, user)` 로 상태 복원
  - [ ] 실패 → `clearAuth()` (비로그인 상태 유지)
- [ ] `/app/providers.tsx` 에 `AuthProvider` 등록

### 회원가입 페이지 (`/signup`)
- [ ] `/app/(auth)/signup/page.tsx` 생성
- [ ] Zod 스키마 정의: `name`, `email`, `password`, `passwordConfirm`, `department`
  - [ ] `passwordConfirm` 일치 검증 (`.refine`)
- [ ] React Hook Form 연결
- [ ] `POST /api/auth/signup` 호출
- [ ] 성공 시 `/login` 으로 이동, 실패 시 Toast 에러 표시

### 로그인 페이지 (`/login`)
- [ ] `/app/(auth)/login/page.tsx` 생성
- [ ] Zod 스키마 정의: `email`, `password`
- [ ] React Hook Form 연결
- [ ] `POST /api/auth/login` 호출
  - [ ] 응답의 `accessToken` → `setAuth()` 저장 (Refresh Token은 서버가 쿠키로 처리)
  - [ ] `role` 에 따라 리디렉션: `ROLE_USER` → `/`, `ROLE_ADMIN` → `/admin`
- [ ] 실패 시 Toast 에러 표시

### 로그아웃
- [ ] `/lib/auth.ts` — `logout()` 함수 구현
  - [ ] `POST /api/auth/logout` 호출 (서버에서 Refresh Token 쿠키 무효화)
  - [ ] `clearAuth()` 호출
  - [ ] `/login` 으로 리디렉션
- [ ] Nav 컴포넌트에 로그아웃 버튼 연결

### 미들웨어 & 라우트 보호
- [ ] `/middleware.ts` 생성
  - [ ] `refreshToken` 쿠키 없으면 `/login` 리디렉션 (보호 경로에 한해)
  - [ ] `/admin/**` 경로: JWT payload `role` 클레임 디코딩 후 `ROLE_ADMIN` 아니면 `/` 리디렉션
  - [ ] `matcher` 설정: 정적 파일, `/login`, `/signup` 제외
- [ ] `/hooks/use-auth.ts` — 현재 인증 상태/유저 정보 편의 훅

### 네비게이션 완성
- [ ] `/components/layout/nav.tsx` — 인증 상태에 따라 메뉴 분기
  - [ ] 비로그인: 로그인 / 회원가입 링크
  - [ ] 일반 사용자: 예약 현황, 내 예약, 로그아웃
  - [ ] 관리자: 대시보드, 차량 관리, 부속실 관리, 사용자 관리, 로그아웃

---

## Phase 3: 리소스 관리 (차량 & 부속실)

### API 타입 정의
- [ ] `/types/vehicle.ts` — `Vehicle`, `CreateVehicleDto`, `UpdateVehicleDto` 타입 정의
- [ ] `/types/room.ts` — `AncillaryRoom`, `CreateRoomDto`, `UpdateRoomDto` 타입 정의

### 차량 API 훅
- [ ] `/hooks/use-vehicles.ts`
  - [ ] `useVehicles()` — `GET /api/admin/vehicles` (TanStack Query)
  - [ ] `useCreateVehicle()` — `POST /api/admin/vehicles` (mutation, 성공 시 목록 invalidate)
  - [ ] `useUpdateVehicle()` — `PUT /api/admin/vehicles/{id}` (mutation)
  - [ ] `useToggleVehicleStatus()` — `PATCH /api/admin/vehicles/{id}/status` (mutation)

### 부속실 API 훅
- [ ] `/hooks/use-rooms.ts`
  - [ ] `useRooms()` — `GET /api/admin/rooms`
  - [ ] `useCreateRoom()` — `POST /api/admin/rooms` (mutation)
  - [ ] `useUpdateRoom()` — `PUT /api/admin/rooms/{id}` (mutation)
  - [ ] `useToggleRoomStatus()` — `PATCH /api/admin/rooms/{id}/status` (mutation)

### 차량 관리 페이지 (`/admin/vehicles`)
- [ ] `/app/admin/vehicles/page.tsx` 생성
- [ ] 차량 목록 테이블 구현
  - [ ] 컬럼: 차종, 번호판, 좌석 수, 상태(활성/비활성 Badge), 액션
  - [ ] 비활성 행 시각적 구분 (흐림 처리 또는 회색)
- [ ] 차량 등록 다이얼로그 (`/components/vehicles/vehicle-form-dialog.tsx`)
  - [ ] Zod 스키마: `model`, `licensePlate`, `seats`, `note`
  - [ ] React Hook Form 연결
  - [ ] 성공/실패 Toast
- [ ] 수정 다이얼로그 — 등록 다이얼로그 재사용 (초기값 주입)
- [ ] 활성/비활성 토글 버튼 + 확인 모달

### 부속실 관리 페이지 (`/admin/rooms`)
- [ ] `/app/admin/rooms/page.tsx` 생성
- [ ] 부속실 목록 테이블 구현
  - [ ] 컬럼: 이름, 위치, 수용 인원, 상태(Badge), 액션
- [ ] 부속실 등록 다이얼로그 (`/components/rooms/room-form-dialog.tsx`)
  - [ ] Zod 스키마: `name`, `location`, `capacity`, `description`
- [ ] 수정 다이얼로그 — 등록 다이얼로그 재사용
- [ ] 활성/비활성 토글 버튼 + 확인 모달

---

## Phase 4: 예약 핵심 기능

### API 타입 정의
- [ ] `/types/reservation.ts` — `Reservation`, `CreateReservationDto`, `UpdateReservationDto`, `ResourceType`, `ReservationStatus` 타입 정의

### 가용성 조회 훅
- [ ] `/hooks/use-available-vehicles.ts` — `useAvailableVehicles(startAt, endAt)`
  - [ ] `GET /api/vehicles/available?startAt=&endAt=`
  - [ ] `startAt`, `endAt` 값이 없으면 쿼리 비활성화 (`enabled: !!startAt && !!endAt`)
- [ ] `/hooks/use-available-rooms.ts` — `useAvailableRooms(startAt, endAt)`

### 예약 API 훅
- [ ] `/hooks/use-reservations.ts`
  - [ ] `useAllReservations(params)` — `GET /api/reservations` (캘린더용, 날짜 범위 파라미터)
  - [ ] `useMyReservations()` — `GET /api/reservations/my`
  - [ ] `useReservation(id)` — `GET /api/reservations/{id}`
  - [ ] `useCreateReservation()` — `POST /api/reservations` (mutation)
  - [ ] `useUpdateReservation()` — `PUT /api/reservations/{id}` (mutation)
  - [ ] `useCancelReservation()` — `DELETE /api/reservations/{id}` (mutation)

### 차량 예약 생성 페이지 (`/reservations/vehicle/new`)
- [ ] `/app/(user)/reservations/vehicle/new/page.tsx` 생성
- [ ] 날짜/시간 범위 입력 (시작일시, 종료일시)
- [ ] 입력 완료 시 `useAvailableVehicles` 로 가용 차량 목록 자동 조회
- [ ] 차량 선택 카드 UI (차종, 번호판, 좌석 수 표시)
- [ ] 목적지, 이용 목적 텍스트 입력
- [ ] 예약 확정 버튼 → `useCreateReservation` mutation 호출
- [ ] 성공 시 `/` (캘린더)로 이동, 실패(409) 시 "이미 예약된 차량입니다" Toast

### 부속실 예약 생성 페이지 (`/reservations/room/new`)
- [ ] `/app/(user)/reservations/room/new/page.tsx` 생성
- [ ] 날짜/시간 범위 입력
- [ ] 입력 완료 시 `useAvailableRooms` 로 가용 부속실 목록 자동 조회
- [ ] 부속실 선택 카드 UI (이름, 위치, 수용 인원 표시)
- [ ] 이용 목적 텍스트 입력
- [ ] 예약 확정 버튼 → mutation 호출
- [ ] 성공 시 `/` 로 이동, 실패(409) 시 Toast

### 내 예약 목록 페이지 (`/reservations/my`)
- [ ] `/app/(user)/reservations/my/page.tsx` 생성
- [ ] 차량 예약 / 부속실 예약 탭 분리 (shadcn/ui `Tabs`)
- [ ] 예약 목록 최신순 렌더링
- [ ] 상태 Badge: `CONFIRMED` → "예약 완료", `CANCELLED` → "취소됨"
- [ ] 목록 항목 클릭 → `/reservations/[id]` 이동

### 예약 상세 페이지 (`/reservations/[id]`)
- [ ] `/app/(user)/reservations/[id]/page.tsx` 생성
- [ ] `useReservation(id)` 로 상세 정보 표시 (리소스명, 날짜/시간, 목적, 예약일시)
- [ ] 예약 시작 전 + `CONFIRMED` 상태일 때만 수정/취소 버튼 노출
- [ ] 취소 버튼 → `AlertDialog` (shadcn/ui) → 확인 시 `useCancelReservation` 호출
- [ ] 취소 성공 시 `/reservations/my` 로 이동

### 예약 수정 페이지 (`/reservations/[id]/edit`)
- [ ] `/app/(user)/reservations/[id]/edit/page.tsx` 생성
- [ ] 기존 예약 정보 Pre-fill (날짜/시간, 목적, 목적지)
- [ ] 날짜/시간 변경 시 가용성 재조회 (현재 예약 제외 — `excludeId` 파라미터 전달)
- [ ] 저장 버튼 → `useUpdateReservation` 호출
- [ ] 성공 시 `/reservations/[id]` 로 이동

---

## Phase 5: 캘린더 뷰 & 관리자 대시보드 & 배포

### FullCalendar 설정
- [ ] 패키지 설치: `@fullcalendar/react`, `@fullcalendar/daygrid`, `@fullcalendar/timegrid`, `@fullcalendar/interaction`
- [ ] `/components/calendar/reservation-calendar.tsx` — FullCalendar 래퍼 컴포넌트 생성

### 예약 현황 페이지 (`/`) — 캘린더 메인
- [ ] `/app/(user)/page.tsx` 생성
- [ ] 차량 / 부속실 탭 전환 시 `useAllReservations` 파라미터 변경
- [ ] 예약 데이터를 FullCalendar `events` 형식으로 변환 (title, start, end, color)
- [ ] 월/주/일 뷰 전환 버튼 (`headerToolbar` 설정)
- [ ] 예약 블록 클릭 시 툴팁 표시 (예약자, 리소스명, 시간)
- [ ] 차량 예약하기 / 부속실 예약하기 버튼

### 관리자 대시보드 (`/admin`)
- [ ] `/app/admin/page.tsx` 생성
- [ ] 전체 예약 목록 테이블 (날짜 / 리소스 / 사용자 필터)
- [ ] 강제 취소 버튼 + `AlertDialog` 확인 모달 → `useCancelReservation` 호출
- [ ] 차량 관리 / 부속실 관리 페이지 이동 버튼

### 사용자 관리 페이지 (`/admin/users`)
- [ ] `/hooks/use-admin-users.ts`
  - [ ] `useAdminUsers()` — `GET /api/admin/users`
  - [ ] `useUpdateUserRole()` — `PATCH /api/admin/users/{id}/role` (mutation)
- [ ] `/app/admin/users/page.tsx` 생성
  - [ ] 사용자 목록 테이블 (이름, 이메일, 부서, 역할, 액션)
  - [ ] 역할 변경 셀렉트 + 확인 모달

### 품질 마무리
- [ ] 반응형 점검: 모바일(`< 768px`), 태블릿(`< 1024px`), 데스크톱 3 브레이크포인트
- [ ] Axios Response Interceptor에서 공통 에러 → Sonner Toast 자동 표시
- [ ] 데이터 로딩 중 Skeleton UI 적용 (테이블, 카드 영역)
- [ ] 빈 상태(Empty State) 컴포넌트 공통화 — 예약 없음, 가용 리소스 없음 등
- [ ] 폼 에러 메시지 한국어 통일 (`zod` 메시지 커스터마이징)

### 배포
- [ ] Vercel 프로젝트 생성 및 GitHub 저장소 연결
- [ ] Vercel 환경 변수 설정: `NEXT_PUBLIC_API_URL` (Spring Boot 운영 서버 주소)
- [ ] CORS 도메인 확인 (Spring Boot 서버 측 허용 도메인 확인)
- [ ] 배포 후 전체 플로우 동작 확인

---

## 공통 컴포넌트 체크리스트

> 개발 중 필요 시 추출하여 공통화한다.

- [ ] `/components/ui/empty-state.tsx` — 빈 상태 안내 컴포넌트
- [ ] `/components/ui/confirm-dialog.tsx` — 재사용 확인 모달 (AlertDialog 래퍼)
- [ ] `/components/ui/status-badge.tsx` — 예약 상태 / 리소스 활성화 상태 Badge
- [ ] `/components/ui/data-table.tsx` — 공통 테이블 컴포넌트 (선택)
