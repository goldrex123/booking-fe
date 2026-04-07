# 차량 및 부속실 예약 관리 시스템 프론트엔드 개발 계획

## 기술 스택

| 역할 | 기술 |
|------|------|
| 프레임워크 | Next.js 16 (App Router) |
| 언어 | TypeScript 5.7+ |
| 스타일링 | TailwindCSS v4 + shadcn/ui |
| 폼 관리 | React Hook Form + Zod |
| 서버 상태 | TanStack Query v5 (React Query) |
| HTTP 클라이언트 | Axios |
| 캘린더 | FullCalendar (React) |
| 아이콘 | Lucide React |
| 인증 토큰 | Access Token (메모리) + Refresh Token (httpOnly Cookie) |
| 배포 | Vercel |

---

## 개발 Phase 개요

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5
 프로젝트    인증/권한   리소스     예약 핵심   캘린더/관리자
  셋업                  관리        기능        & 배포
```

---

## Phase 1: 프로젝트 셋업 및 기반 구성

> **목표**: 개발 환경과 공통 기반을 갖춘다. 빈 화면이지만 앱이 실행되는 상태.

- [ ] `create-next-app`으로 프로젝트 생성 (TypeScript, App Router, TailwindCSS v4)
- [ ] shadcn/ui 초기화 및 기본 컴포넌트 설치
  - Button, Input, Form, Dialog, Toast (Sonner), Badge, Table, Tabs
- [ ] Axios 인스턴스 설정 (`/lib/axios.ts`) — 아래 인증 전략 참고
- [ ] TanStack Query Provider 설정 (`/app/providers.tsx`)
- [ ] 공통 레이아웃 구성 (`/app/layout.tsx`)
  - 인증 상태에 따른 Nav 분기 (일반 사용자 / 관리자 / 비로그인)
- [ ] 환경 변수 설정 (`.env.local` — `NEXT_PUBLIC_API_URL`)

**완료 기준**: Next.js 앱이 실행되고 빈 레이아웃이 렌더링된다

---

## JWT 인증 전략 (Best Practice)

> Spring Boot API와의 인증 통신 방식. Phase 1~2 구현 시 이 설계를 기준으로 한다.

### 토큰 저장 전략

| 토큰 | 저장 위치 | 이유 |
|------|----------|------|
| Access Token | JS 메모리 (Zustand store) | `localStorage`/`sessionStorage`는 XSS로 탈취 가능. 메모리는 탭 닫힘과 함께 소멸 |
| Refresh Token | `httpOnly` Cookie (서버 설정) | JS 접근 불가 → XSS 방어. Spring Boot가 `Set-Cookie`로 발급 |

> **`js-cookie`는 사용하지 않는다.** httpOnly 쿠키는 JS로 읽기/쓰기 불가이므로 Spring Boot가 직접 Set-Cookie 헤더로 관리한다.

### Axios 인스턴스 구성 (`/lib/axios.ts`)

```
Request Interceptor
  └─ Authorization: Bearer <accessToken> 헤더 자동 첨부 (메모리에서 읽음)

Response Interceptor (401 처리 — Silent Refresh)
  └─ 401 수신 시
      ├─ POST /api/auth/refresh 호출 (Refresh Token은 쿠키로 자동 전송)
      ├─ 성공 → 새 Access Token을 메모리에 저장 후 원래 요청 재시도
      └─ 실패 → 로그아웃 처리 후 /login 리디렉션
```

- `withCredentials: true` 설정 필수 — 쿠키를 cross-origin 요청에 포함
- 토큰 갱신 중 동시에 여러 요청이 실패할 경우, 갱신 완료까지 큐에 적재 후 일괄 재시도

### 인증 흐름

```
[로그인]
POST /api/auth/login { email, password }
  └─ 응답: { accessToken }  +  Set-Cookie: refreshToken=...; HttpOnly; Secure; SameSite=Strict
  └─ accessToken → Zustand 메모리 저장

[API 요청]
Authorization: Bearer <accessToken>  (모든 요청에 자동 첨부)

[Access Token 만료 시 — Silent Refresh]
POST /api/auth/refresh  (쿠키 자동 포함)
  └─ 성공: 새 accessToken → 메모리 갱신 → 원래 요청 재시도
  └─ 실패(Refresh Token 만료): 로그아웃 → /login

[로그아웃]
POST /api/auth/logout  (서버에서 Refresh Token 쿠키 무효화)
  └─ 메모리의 accessToken 초기화
```

### 페이지 새로고침 대응

Access Token은 메모리에만 있으므로 새로고침 시 소멸한다.

```
앱 초기화 시 (layout.tsx 또는 AuthProvider)
  └─ POST /api/auth/refresh 자동 호출
      ├─ 성공 → accessToken 메모리 복원, 인증 상태 유지
      └─ 실패 → 비로그인 상태로 처리
```

### middleware.ts 라우트 보호

Next.js middleware는 Edge Runtime에서 실행되므로 메모리의 accessToken에 접근 불가.

```
middleware.ts 전략
  └─ refreshToken 쿠키 존재 여부로 로그인 상태 1차 판단
      ├─ 쿠키 없음 → /login 리디렉션 (비로그인 확실)
      └─ 쿠키 있음 → 통과 (실제 유효성은 API 호출 시 Silent Refresh로 검증)
```

역할(ADMIN/USER) 기반 접근 제어는 JWT payload의 `role` 클레임을 디코딩하여 판단한다 (서명 검증 제외, Edge에서 검증 불가). 실질적 권한 검증은 Spring Boot API가 담당한다.

---

## Phase 2: 인증 및 사용자 관리

> **목표**: 회원가입, 로그인, 로그아웃이 동작하고 역할(Role) 기반 접근 제어가 작동한다.

**인증 상태 관리**
- [ ] `useAuthStore` (Zustand) — Access Token, 사용자 정보(id, role) 메모리 보관
  - `accessToken: string | null`
  - `user: { id, email, role } | null`
  - `setAuth(token, user)` / `clearAuth()` 액션
- [ ] `AuthProvider` (`/app/providers.tsx`) — 앱 초기화 시 `/api/auth/refresh` 호출하여 Access Token 복원
- [ ] Axios 인스턴스 구성 (`/lib/axios.ts`) — 상단 JWT 인증 전략 기준으로 구현
  - Request Interceptor: `Authorization: Bearer <accessToken>` 자동 첨부
  - Response Interceptor: 401 → Silent Refresh → 원래 요청 재시도, 실패 시 로그아웃
  - `withCredentials: true` 설정 (Refresh Token 쿠키 포함)

**페이지 구현**
- [ ] `/login` — 로그인 페이지
  - React Hook Form + Zod 유효성 검사
  - 역할에 따른 리디렉션 (USER → `/`, ADMIN → `/admin`)
- [ ] `/signup` — 회원가입 페이지
  - 이름, 이메일, 비밀번호, 비밀번호 확인, 부서 입력

**페이지 구현**
- [ ] `/login` — 로그인 페이지
  - React Hook Form + Zod 유효성 검사
  - 로그인 성공 시 `accessToken` → Zustand 저장, Refresh Token은 서버가 httpOnly 쿠키로 설정
  - role에 따른 리디렉션 (USER → `/`, ADMIN → `/admin`)
- [ ] `/signup` — 회원가입 페이지
  - 이름, 이메일, 비밀번호, 비밀번호 확인, 부서 입력

**라우트 보호**
- [ ] `middleware.ts` — refreshToken 쿠키 존재 여부로 로그인 상태 1차 판단, 없으면 `/login` 리디렉션
- [ ] 관리자 전용 경로(`/admin/**`): JWT payload의 `role` 클레임 디코딩으로 1차 판단 (실질 권한은 API가 보장)

**완료 기준**: 로그인 후 Access Token이 메모리에만 존재하고, 새로고침 시 Silent Refresh로 인증 상태가 복원된다. 역할에 따라 접근 가능한 페이지가 분리된다

---

## Phase 3: 리소스 관리 (차량 & 부속실)

> **목표**: 관리자가 차량과 부속실을 등록하고 관리할 수 있다.

**API 훅**
- [ ] `useVehicles()` — 차량 목록 조회 (TanStack Query)
- [ ] `useRooms()` — 부속실 목록 조회

**페이지 구현**
- [ ] `/admin/vehicles` — 차량 관리 페이지
  - 목록 테이블 (차종, 번호판, 좌석 수, 상태, 액션)
  - 차량 등록 다이얼로그 (React Hook Form)
  - 수정 다이얼로그
  - 활성/비활성 토글 버튼
- [ ] `/admin/rooms` — 부속실 관리 페이지
  - 목록 테이블 (이름, 위치, 수용 인원, 상태, 액션)
  - 부속실 등록 다이얼로그
  - 수정 다이얼로그
  - 활성/비활성 토글 버튼

**완료 기준**: 관리자가 차량과 부속실을 CRUD 할 수 있고, 비활성 리소스는 상태가 구분되어 표시된다

---

## Phase 4: 예약 핵심 기능

> **목표**: 사용자가 차량/부속실을 예약하고, 조회하고, 수정/취소할 수 있다. 서비스의 핵심 가치 구현.

**API 훅**
- [ ] `useAvailableVehicles(startAt, endAt)` — 가용 차량 조회
- [ ] `useAvailableRooms(startAt, endAt)` — 가용 부속실 조회
- [ ] `useMyReservations()` — 내 예약 목록
- [ ] `useReservation(id)` — 예약 상세
- [ ] `useCreateReservation()` — 예약 생성 mutation
- [ ] `useUpdateReservation(id)` — 예약 수정 mutation
- [ ] `useCancelReservation(id)` — 예약 취소 mutation

**페이지 구현**
- [ ] `/reservations/vehicle/new` — 차량 예약 생성 페이지
  - 날짜/시간 입력 → 가용 차량 목록 실시간 조회
  - 차량 선택 카드 UI
  - 목적지, 이용 목적 입력
  - 예약 확정 버튼
- [ ] `/reservations/room/new` — 부속실 예약 생성 페이지
  - 날짜/시간 입력 → 가용 부속실 목록 실시간 조회
  - 부속실 선택 카드 UI (이름, 위치, 수용 인원)
  - 이용 목적 입력
  - 예약 확정 버튼
- [ ] `/reservations/my` — 내 예약 목록 페이지
  - 차량 / 부속실 탭 분리
  - 예약 상태 배지 (예약 완료 / 취소됨)
  - 최신순 정렬
- [ ] `/reservations/[id]` — 예약 상세 페이지
  - 상세 정보 표시
  - 시작 전 예약만 수정/취소 버튼 노출
  - 취소 확인 모달 (shadcn/ui AlertDialog)
- [ ] `/reservations/[id]/edit` — 예약 수정 페이지
  - 기존 정보 Pre-fill
  - 날짜/시간 변경 시 가용성 재확인 (현재 예약 제외)

**완료 기준**: 가용 차량/부속실을 확인하고 예약할 수 있다. 중복 예약 시 에러 메시지가 표시되고, 본인 예약만 수정/취소 가능하다

---

## Phase 5: 캘린더 뷰, 관리자 대시보드 및 배포

> **목표**: 예약 현황을 시각적으로 확인하고, 관리자가 전체 예약을 통제할 수 있다. 운영 환경 배포 완료.

**캘린더 구현**
- [ ] FullCalendar 설치 및 설정 (`@fullcalendar/react`, `@fullcalendar/daygrid`, `@fullcalendar/timegrid`)
- [ ] `/` — 예약 현황 페이지 (메인 캘린더 뷰)
  - 월/주/일 뷰 전환 버튼
  - 차량 / 부속실 탭으로 필터링
  - 예약 블록 클릭 시 툴팁 (예약자, 리소스명, 시간)
  - 차량 예약하기 / 부속실 예약하기 버튼

**관리자 대시보드**
- [ ] `/admin` — 관리자 대시보드
  - 전체 예약 목록 테이블 (날짜 / 리소스 / 사용자 필터)
  - 강제 취소 버튼 + 확인 모달
  - 차량 관리 / 부속실 관리 이동 버튼
- [ ] 관리자 네비게이션 메뉴 (대시보드, 차량 관리, 부속실 관리, 사용자 관리)
- [ ] `/admin/users` — 사용자 관리 페이지 (목록 + 역할 변경)

**품질 마무리**
- [ ] 반응형 UI 점검 (모바일 / 태블릿 / 데스크톱 3 브레이크포인트)
- [ ] 공통 Toast 에러 메시지 처리 (Axios 인터셉터 → Sonner)
- [ ] 로딩 상태 처리 (Skeleton UI, 버튼 비활성화)
- [ ] 빈 상태 처리 (예약 없음, 가용 리소스 없음 등 Empty State 컴포넌트)
- [ ] 폼 유효성 에러 메시지 한국어 통일

**배포**
- [ ] Vercel 배포 (환경 변수: `NEXT_PUBLIC_API_URL` — 백엔드 운영 주소)

**완료 기준**: 캘린더에서 예약 현황이 시각적으로 표시되고, 운영 환경에서 전체 플로우가 정상 동작한다

---

## Phase별 요약

| Phase | 핵심 산출물 |
|-------|------------|
| **1. 셋업** | 실행 가능한 빈 앱, 공통 인프라 |
| **2. 인증** | 로그인 / 회원가입 / 역할 기반 접근 제어 |
| **3. 리소스 관리** | 차량 / 부속실 CRUD (관리자) |
| **4. 예약 기능** | 예약 생성 / 조회 / 수정 / 취소 |
| **5. 캘린더 & 배포** | 캘린더 뷰, 관리자 대시보드, 운영 배포 |

> Phase 4 완료 시점에 서비스 핵심 가치(예약 충돌 방지)가 동작한다.
