# 개발 작업 목록 (TASK)

> PLAN.md 기반 세부 구현 작업 목록. 위에서 아래로 순서대로 진행한다.

---

## Phase 1: 프로젝트 셋업

### 프로젝트 초기화
- [x] `create-next-app` 실행 — TypeScript, App Router, TailwindCSS v4 선택
- [x] 불필요한 보일러플레이트 제거 (`page.tsx` 초기화, `globals.css` 정리)
- [x] `.env.local` 생성 및 `NEXT_PUBLIC_API_URL` 변수 추가

### shadcn/ui 설정
- [x] `npx shadcn@latest init` 실행
- [x] 컴포넌트 설치: `button`, `input`, `form`, `dialog`, `badge`, `table`, `tabs`
- [x] Sonner (Toast) 설치: `npx shadcn@latest add sonner`
- [x] `Toaster` 컴포넌트를 `layout.tsx`에 등록

### 패키지 설치
- [x] `axios` 설치
- [x] `@tanstack/react-query`, `@tanstack/react-query-devtools` 설치
- [x] `zustand` 설치
- [x] `react-hook-form`, `zod`, `@hookform/resolvers` 설치
- [x] `lucide-react` 설치

### 공통 인프라 구성
- [x] `/lib/axios.ts` — Axios 인스턴스 생성 (`baseURL`, `withCredentials: true`)
- [x] `/app/providers.tsx` — `QueryClientProvider` 래퍼 컴포넌트 생성
- [x] `/app/layout.tsx` — `Providers` 등록, `Toaster` 등록, 기본 폰트 설정 (Outfit)
- [x] `/components/layout/nav.tsx` — 공통 네비게이션 컴포넌트

---

## Phase 2: JWT 인증

### Zustand 인증 스토어
- [x] `/store/auth.store.ts` 생성
  - [x] 상태: `accessToken: string | null`, `user: { id, email, role } | null`
  - [x] 액션: `setAuth(token, user)`, `clearAuth()`

### Axios 인터셉터
- [x] `/lib/axios.ts` — Request Interceptor 추가
  - [x] `useAuthStore`에서 `accessToken` 읽어 `Authorization: Bearer <token>` 헤더 첨부
- [x] `/lib/axios.ts` — Response Interceptor 추가 (Silent Refresh)
  - [x] 401 수신 시 `POST /api/auth/refresh` 호출
  - [x] 갱신 성공 → 새 `accessToken` 메모리 저장 → 원래 요청 재시도
  - [x] 갱신 실패 → `clearAuth()` 호출 → `/login` 리디렉션
  - [x] 동시 다발 401 처리: 갱신 중 큐 적재 후 완료 시 일괄 재시도

### AuthProvider (초기화 시 토큰 복원)
- [x] `/components/auth/auth-provider.tsx` 생성
  - [x] 마운트 시 `POST /api/auth/refresh` 호출
  - [x] 성공 → `setAuth(token, user)` 로 상태 복원
  - [x] 실패 → `clearAuth()` (비로그인 상태 유지)
- [x] `/app/providers.tsx` 에 `AuthProvider` 등록

### 회원가입 페이지 (`/signup`)
- [x] `/app/(auth)/signup/page.tsx` 생성
- [x] Zod 스키마 정의: `name`, `email`, `password`, `passwordConfirm`, `department`
  - [x] `passwordConfirm` 일치 검증 (`.superRefine`)
- [x] React Hook Form 연결
- [x] `POST /api/auth/signup` 호출
- [x] 성공 시 `/login` 으로 이동, 실패 시 Toast 에러 표시

### 로그인 페이지 (`/login`)
- [x] `/app/(auth)/login/page.tsx` 생성
- [x] Zod 스키마 정의: `email`, `password`
- [x] React Hook Form 연결
- [x] `POST /api/auth/login` 호출
  - [x] 응답의 `accessToken` → `setAuth()` 저장 (Refresh Token은 서버가 쿠키로 처리)
  - [x] `role` 에 따라 리디렉션: `ROLE_USER` → `/`, `ROLE_ADMIN` → `/admin`
- [x] 실패 시 Toast 에러 표시

### 로그아웃
- [x] `/lib/auth.ts` — `logout()` 함수 구현
  - [x] `POST /api/auth/logout` 호출 (서버에서 Refresh Token 쿠키 무효화)
  - [x] `clearAuth()` 호출
  - [x] `/login` 으로 리디렉션
- [x] Nav 컴포넌트에 로그아웃 버튼 연결

### 미들웨어 & 라우트 보호
- [x] `/proxy.ts` 생성 (Next.js 16 — middleware → proxy 명칭 변경)
  - [x] `refreshToken` 쿠키 없으면 `/login` 리디렉션 (보호 경로에 한해)
  - [x] `/admin/**` 경로: JWT payload `role` 클레임 디코딩 후 `ROLE_ADMIN` 아니면 `/` 리디렉션
  - [x] `matcher` 설정: 정적 파일, `/login`, `/signup` 제외
- [x] `/hooks/use-auth.ts` — 현재 인증 상태/유저 정보 편의 훅

### 네비게이션 완성
- [x] `/components/layout/nav.tsx` — 인증 상태에 따라 메뉴 분기
  - [x] 비로그인: 로그인 / 회원가입 링크
  - [x] 일반 사용자: 예약 현황, 내 예약, 로그아웃
  - [x] 관리자: 대시보드, 차량 관리, 부속실 관리, 사용자 관리, 로그아웃

---

## Phase 2.5: MSW 목 데이터 셋업

> 백엔드 없이 프론트엔드를 테스트하기 위한 Mock Service Worker 설정.
> 개발 환경에서만 활성화되며, 실제 API 코드는 변경하지 않는다.

### MSW 설치 및 초기화
- [x] `msw` 패키지 설치 (`npm install msw --save-dev`)
- [x] `npx msw init public/ --save` — 서비스 워커 파일 생성

### 목 핸들러 작성 (`/mocks/handlers.ts`)
- [x] **인증** 핸들러
  - [x] `POST /api/auth/login` — 이메일/비밀번호 검증 후 `accessToken` + `user` 반환
  - [x] `POST /api/auth/signup` — 201 응답
  - [x] `POST /api/auth/logout` — 200 응답
  - [x] `POST /api/auth/refresh` — 인메모리 세션 기반 토큰 재발급
- [x] **차량** 핸들러
  - [x] `GET /api/admin/vehicles` — 샘플 차량 목록 반환
  - [x] `POST /api/admin/vehicles` — 새 차량 추가 후 반환
  - [x] `PUT /api/admin/vehicles/:id` — 차량 정보 수정 후 반환
  - [x] `PATCH /api/admin/vehicles/:id/status` — 상태 토글 후 반환
- [x] **부속실** 핸들러
  - [x] `GET /api/admin/rooms` — 샘플 부속실 목록 반환
  - [x] `POST /api/admin/rooms` — 새 부속실 추가 후 반환
  - [x] `PUT /api/admin/rooms/:id` — 부속실 수정 후 반환
  - [x] `PATCH /api/admin/rooms/:id/status` — 상태 토글 후 반환
- [x] **예약 (Phase 4 대비)** 핸들러
  - [x] `GET /api/vehicles/available` — 시간대 충돌 검사 후 가용 차량 반환
  - [x] `GET /api/rooms/available` — 시간대 충돌 검사 후 가용 부속실 반환
  - [x] `GET /api/reservations` — 전체 예약 목록 반환 (필터 지원)
  - [x] `GET /api/reservations/my` — 내 예약 목록 반환
  - [x] `GET /api/reservations/:id` — 예약 상세 반환
  - [x] `POST /api/reservations` — 시간 충돌 검사 후 예약 생성
  - [x] `PUT /api/reservations/:id` — 예약 수정 후 반환
  - [x] `DELETE /api/reservations/:id` — 예약 취소 (상태 CANCELLED 변경)
- [x] **사용자 관리 (Phase 5 대비)** 핸들러
  - [x] `GET /api/admin/users` — 샘플 사용자 목록 반환
  - [x] `PATCH /api/admin/users/:id/role` — 역할 변경 후 반환

### MSW 브라우저 연동 (`/mocks/browser.ts`)
- [x] `setupWorker(handlers)` 로 worker 인스턴스 생성 및 export

### 앱에 MSW 주입 (`/components/msw-provider.tsx`)
- [x] `"use client"` 컴포넌트로 생성
- [x] `NEXT_PUBLIC_MSW_ENABLED=true` 일 때만 worker 시작 (초기화 중 로딩 스피너 표시)
- [x] `/app/providers.tsx` 에 `MswProvider` 등록
- [x] `proxy.ts` — MSW 활성화 시 라우트 보호 우회
- [x] `.env.local` — `NEXT_PUBLIC_MSW_ENABLED=true` 추가

---

## Phase 3: 리소스 관리 (차량 & 부속실)

### API 타입 정의
- [x] `/types/vehicle.ts` — `Vehicle`, `CreateVehicleDto`, `UpdateVehicleDto` 타입 정의
- [x] `/types/room.ts` — `AncillaryRoom`, `CreateRoomDto`, `UpdateRoomDto` 타입 정의

### 차량 API 훅
- [x] `/hooks/use-vehicles.ts`
  - [x] `useVehicles()` — `GET /api/admin/vehicles` (TanStack Query)
  - [x] `useCreateVehicle()` — `POST /api/admin/vehicles` (mutation, 성공 시 목록 invalidate)
  - [x] `useUpdateVehicle()` — `PUT /api/admin/vehicles/{id}` (mutation)
  - [x] `useToggleVehicleStatus()` — `PATCH /api/admin/vehicles/{id}/status` (mutation)

### 부속실 API 훅
- [x] `/hooks/use-rooms.ts`
  - [x] `useRooms()` — `GET /api/admin/rooms`
  - [x] `useCreateRoom()` — `POST /api/admin/rooms` (mutation)
  - [x] `useUpdateRoom()` — `PUT /api/admin/rooms/{id}` (mutation)
  - [x] `useToggleRoomStatus()` — `PATCH /api/admin/rooms/{id}/status` (mutation)

### 차량 관리 페이지 (`/admin/vehicles`)
- [x] `/app/admin/vehicles/page.tsx` 생성
- [x] 차량 목록 테이블 구현
  - [x] 컬럼: 차종, 번호판, 좌석 수, 상태(활성/비활성 Badge), 액션
  - [x] 비활성 행 시각적 구분 (흐림 처리 또는 회색)
- [x] 차량 등록 다이얼로그 (`/components/vehicles/vehicle-form-dialog.tsx`)
  - [x] Zod 스키마: `model`, `licensePlate`, `seats`, `note`
  - [x] React Hook Form 연결
  - [x] 성공/실패 Toast
- [x] 수정 다이얼로그 — 등록 다이얼로그 재사용 (초기값 주입)
- [x] 활성/비활성 토글 버튼 + 확인 모달

### 부속실 관리 페이지 (`/admin/rooms`)
- [x] `/app/admin/rooms/page.tsx` 생성
- [x] 부속실 목록 테이블 구현
  - [x] 컬럼: 이름, 위치, 수용 인원, 상태(Badge), 액션
- [x] 부속실 등록 다이얼로그 (`/components/rooms/room-form-dialog.tsx`)
  - [x] Zod 스키마: `name`, `location`, `capacity`, `description`
- [x] 수정 다이얼로그 — 등록 다이얼로그 재사용
- [x] 활성/비활성 토글 버튼 + 확인 모달

---

## Phase 4: 예약 핵심 기능

### API 타입 정의
- [x] `/types/reservation.ts` — `Reservation`, `CreateReservationDto`, `UpdateReservationDto`, `ResourceType`, `ReservationStatus` 타입 정의

### 가용성 조회 훅
- [x] `/hooks/use-available-vehicles.ts` — `useAvailableVehicles(startAt, endAt)`
  - [x] `GET /api/vehicles/available?startAt=&endAt=`
  - [x] `startAt`, `endAt` 값이 없으면 쿼리 비활성화 (`enabled: !!startAt && !!endAt`)
- [x] `/hooks/use-available-rooms.ts` — `useAvailableRooms(startAt, endAt)`

### 예약 API 훅
- [x] `/hooks/use-reservations.ts`
  - [x] `useAllReservations(params)` — `GET /api/reservations` (캘린더용, 날짜 범위 파라미터)
  - [x] `useMyReservations()` — `GET /api/reservations/my`
  - [x] `useReservation(id)` — `GET /api/reservations/{id}`
  - [x] `useCreateReservation()` — `POST /api/reservations` (mutation)
  - [x] `useUpdateReservation()` — `PUT /api/reservations/{id}` (mutation)
  - [x] `useCancelReservation()` — `DELETE /api/reservations/{id}` (mutation)

### 차량 예약 생성 페이지 (`/reservations/vehicle/new`)
- [x] `/app/(user)/reservations/vehicle/new/page.tsx` 생성
- [x] 날짜/시간 범위 입력 (시작일시, 종료일시)
- [x] 입력 완료 시 `useAvailableVehicles` 로 가용 차량 목록 자동 조회
- [x] 차량 선택 카드 UI (차종, 번호판, 좌석 수 표시)
- [x] 목적지, 이용 목적 텍스트 입력
- [x] 예약 확정 버튼 → `useCreateReservation` mutation 호출
- [x] 성공 시 `/` (캘린더)로 이동, 실패(409) 시 "이미 예약된 차량입니다" Toast

### 부속실 예약 생성 페이지 (`/reservations/room/new`)
- [x] `/app/(user)/reservations/room/new/page.tsx` 생성
- [x] 날짜/시간 범위 입력
- [x] 입력 완료 시 `useAvailableRooms` 로 가용 부속실 목록 자동 조회
- [x] 부속실 선택 카드 UI (이름, 위치, 수용 인원 표시)
- [x] 이용 목적 텍스트 입력
- [x] 예약 확정 버튼 → mutation 호출
- [x] 성공 시 `/` 로 이동, 실패(409) 시 Toast

### 내 예약 목록 페이지 (`/reservations/my`)
- [x] `/app/(user)/reservations/my/page.tsx` 생성
- [x] 차량 예약 / 부속실 예약 탭 분리 (shadcn/ui `Tabs`)
- [x] 예약 목록 최신순 렌더링
- [x] 상태 Badge: `CONFIRMED` → "예약 완료", `CANCELLED` → "취소됨"
- [x] 목록 항목 클릭 → `/reservations/[id]` 이동

### 예약 상세 페이지 (`/reservations/[id]`)
- [x] `/app/(user)/reservations/[id]/page.tsx` 생성
- [x] `useReservation(id)` 로 상세 정보 표시 (리소스명, 날짜/시간, 목적, 예약일시)
- [x] 예약 시작 전 + `CONFIRMED` 상태일 때만 수정/취소 버튼 노출
- [x] 취소 버튼 → `AlertDialog` (shadcn/ui) → 확인 시 `useCancelReservation` 호출
- [x] 취소 성공 시 `/reservations/my` 로 이동

### 예약 수정 페이지 (`/reservations/[id]/edit`)
- [x] `/app/(user)/reservations/[id]/edit/page.tsx` 생성
- [x] 기존 예약 정보 Pre-fill (날짜/시간, 목적, 목적지)
- [x] 날짜/시간 변경 시 가용성 재조회 (현재 예약 제외 — `excludeId` 파라미터 전달)
- [x] 저장 버튼 → `useUpdateReservation` 호출
- [x] 성공 시 `/reservations/[id]` 로 이동

---

## Phase 5: 캘린더 뷰 & 관리자 대시보드 & 배포

### FullCalendar 설정
- [x] 패키지 설치: `@fullcalendar/react`, `@fullcalendar/daygrid`, `@fullcalendar/timegrid`, `@fullcalendar/interaction`
- [x] `/components/calendar/reservation-calendar.tsx` — FullCalendar 래퍼 컴포넌트 생성

### 예약 현황 페이지 (`/`) — 캘린더 메인
- [x] `/app/page.tsx` 업데이트 (캘린더 메인으로 교체)
- [x] 차량 / 부속실 탭 전환 시 `useAllReservations` 파라미터 변경
- [x] 예약 데이터를 FullCalendar `events` 형식으로 변환 (title, start, end, color)
- [x] 월/주/일 뷰 전환 버튼 (`headerToolbar` 설정)
- [x] 예약 블록 클릭 시 팝오버 표시 (예약자, 리소스명, 시간)
- [x] 차량 예약하기 / 부속실 예약하기 버튼

### 관리자 대시보드 (`/admin`)
- [x] `/app/admin/page.tsx` 생성
- [x] 전체 예약 목록 테이블 (날짜 / 리소스 / 사용자 필터)
- [x] 강제 취소 버튼 + `AlertDialog` 확인 모달 → `useCancelReservation` 호출
- [x] 차량 관리 / 부속실 관리 페이지 이동 버튼

### 사용자 관리 페이지 (`/admin/users`)
- [x] `/hooks/use-admin-users.ts`
  - [x] `useAdminUsers()` — `GET /api/admin/users`
  - [x] `useUpdateUserRole()` — `PATCH /api/admin/users/{id}/role` (mutation)
- [x] `/app/admin/users/page.tsx` 생성
  - [x] 사용자 목록 테이블 (이름, 이메일, 부서, 역할, 액션)
  - [x] 역할 변경 셀렉트 + 확인 모달

### 품질 마무리
- [x] 반응형 점검: 모바일(`< 768px`), 태블릿(`< 1024px`), 데스크톱 3 브레이크포인트
- [x] Axios Response Interceptor에서 공통 에러 → Sonner Toast 자동 표시
- [x] 데이터 로딩 중 Skeleton UI 적용 (테이블, 카드 영역)
- [x] 빈 상태(Empty State) 컴포넌트 공통화 — 예약 없음, 가용 리소스 없음 등
- [x] 폼 에러 메시지 한국어 통일 (`zod` 메시지 커스터마이징)

### 배포
- [ ] Vercel 프로젝트 생성 및 GitHub 저장소 연결
- [ ] Vercel 환경 변수 설정: `NEXT_PUBLIC_API_URL` (Spring Boot 운영 서버 주소)
- [ ] CORS 도메인 확인 (Spring Boot 서버 측 허용 도메인 확인)
- [ ] 배포 후 전체 플로우 동작 확인

---

## 공통 컴포넌트 체크리스트

> 개발 중 필요 시 추출하여 공통화한다.

- [x] `/components/ui/empty-state.tsx` — 빈 상태 안내 컴포넌트
- [x] `/components/ui/confirm-dialog.tsx` — 재사용 확인 모달 (AlertDialog 래퍼)
- [x] `/components/ui/status-badge.tsx` — 예약 상태 / 리소스 활성화 상태 Badge
- [x] `/components/ui/data-table.tsx` — 공통 테이블 컴포넌트 (선택)


---

## 수정 사항 리스트

> 직접 테스트 하며 수정할 내용들을 정리함

- [x] API를 기본적으로 두 번씩 요청하는 것을 한번만 요청하도록
- [x] 최초 접속 시 인증 정보(JWT)가 없다면 로그인 페이지로 이동
- [x] 다크/일반 모드 전환 기능
- [x] 달력에서 연/월 선택하여 한번에 이동할 수 있는 기능 추가
- [x] 차량/부속실 예약시 날짜 선택 검증 기능 추가 (종료일이 시작일보다 과거일 수 없음)
- [x] 예약시 차량 혹은 부속실 선택 안하고 예약 확정 클릭하면 영어로 에러 메세지 출력 (사진첨부))
- [x] 로그인 페이지는 헤더 삭제 및 예약충돌, 실시간 현황 컴포넌트 삭제
- [x] 관리자 사용자 관리 페이지에서 역할 변경과 selectbox 정렬이 맞지 않음