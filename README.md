# insight (우리끼리)

친구·이웃과 관심사 기반으로 채팅방을 만들고 실시간으로 대화할 수 있는 풀스택 웹 서비스입니다.  
React + Node.js + Socket.IO + MySQL을 중심으로 인증, 방 관리, 프로필/아바타, Insight 대시보드, 브라우저 알림 등을 제공합니다.

---

## 1. Tech Stack 상세

| 분야 | 사용 기술 | 비고 |
|------|-----------|------|
| Frontend | Vite + React 18, React Router DOM, Context API, Axios, Socket.IO Client | SPA, Protected Route, 전역 상태/토큰 관리 |
| Styling | CSS Modules(단일 App.css), 커스텀 팔레트, Responsive Grid/Flex, CSS Variables | 라이트톤 그래디언트 UI, 다크/모바일 대응 |
| Backend | Node.js 20, Express 5, TypeScript, Socket.IO Server, Multer, Sequelize(MySQL) | JWT 인증, 멀티 레이어 구조(config → service → controller) |
| Auth & 보안 | JWT + Bearer Token, bcrypt, CORS, cookie-parser, multer 파일 검증 | |
| DB | MySQL 8 (mysql2 + Sequelize) | users, rooms, messages, room_members, room_reads 등 스키마 |
| Docs/Test | Swagger (swagger-jsdoc + swagger-ui-express), Insight summary endpoint | `/api-docs`에서 자동 문서 확인 |

---

## 2. 아키텍처 & 주요 흐름

```
┌──────────┐        REST (Axios)       ┌──────────────┐        ┌───────────┐
│ React UI │ ─────────────────────────▶│ Express API  │──SQL──▶│  MySQL DB │
└────┬─────┘                           └─────┬────────┘        └───────────┘
     │   ▲                              Real-time │
     │   └────────────────────────────── Socket.IO │
     └───────────────────────────────◀─────────────┘
```

1. **JWT 인증**: `/api/v1/auth/login`으로 발급한 토큰을 LocalStorage에 저장 → Axios 인터셉터/공통 headers로 전달.  
2. **채팅 실시간성**: 로그인 시 Socket.IO 연결(`Authorization: Bearer`). `newMessage`, `joinRoom` 등 커스텀 이벤트로 메시지 브로드캐스팅 + 읽음 처리.  
3. **방 관리**: REST로 CRUD (생성, 검색, 삭제, 멤버 초대/권한 변경).  
4. **프로필 & 아바타**: 이미지 업로드는 Multer + `Backend/uploads/avatars` 저장 → 정적 서빙 + URL 정규화.  
5. **Insight**: `/api/v1/insight/summary`에서 rooms/users/messages/todayMessages 집계 → 메인 Hero 카드에 노출.  
6. **브라우저 알림**: Notification API 권한을 요청하여 비활성 탭/다른 방에서 새 메시지를 알림 카드로 표시.

---

## 3. 디렉터리 구조

```
Backend/
├─ src/
│  ├─ app/
│  │  ├─ index.ts               # Express + Socket.IO 부트스트랩
│  │  └─ v1/
│  │     ├─ auth/route.ts       # Auth REST + Swagger
│  │     ├─ rooms/route.ts      # 방/메시지/멤버/읽음 API
│  │     ├─ user/route.ts       # 프로필/아바타/탈퇴 API
│  │     └─ insight/route.ts    # 요약 지표 API
│  ├─ config/                   # mysql.ts, socket.ts, swagger.ts 등 공통 설정
│  ├─ controllers/              # 요청 해석 → service 호출
│  ├─ services/                 # 비즈니스 로직, Sequelize 기반 DB 액세스
│  ├─ models/                   # Sequelize 모델(User, Room, Message, RoomMember, RoomRead…)
│  ├─ middleware/               # auth(JWT), upload(multer), error handler
│  └─ utils/                    # catchAsyncError, JWT/비밀번호 helpers
└─ uploads/
   └─ avatars/…                 # 프로필 이미지 저장소

Frontend/
├─ src/
│  ├─ App.jsx / App.css         # 전역 레이아웃, 컬러 팔레트, routing
│  ├─ main.jsx / index.html     # Vite 엔트리
│  ├─ contexts/AuthContext.jsx  # 토큰 관리, 로그인 상태
│  ├─ lib/api.js                # Axios 인스턴스 + route helper
│  ├─ pages/
│  │  ├─ MainPage.jsx           # Insight 요약, CTA 카드
│  │  ├─ LoginPage.jsx / SignupPage.jsx
│  │  ├─ ChatPage.jsx           # 실시간 채팅 + 알림 버튼
│  │  ├─ RoomsDiscoverPage.jsx  # 공개 방 검색/참여
│  │  ├─ RoomList.jsx           # 방/멤버 관리 (좌-우 패널)
│  │  ├─ ChannelCreatePage.jsx  # 방 생성 위저드
│  │  ├─ ProfilePage.jsx        # 프로필 수정/이미지/탈퇴
│  │  └─ Others… (RoomList, Profile, etc.)
│  └─ components/Navbar.jsx     # 상단 네비게이션
└─ public/                      # Vite 정적 자산
```

---

## 4. 구현 기능 (요약)

| 구분 | 상세 |
|------|------|
| 인증 | 회원가입/로그인/로그아웃, JWT 발급 및 만료 처리 |
| 프로필 | 사용자 정보 조회/수정, 위치/관심사/소개, Multer 기반 아바타 업로드, 회원 탈퇴 |
| 채팅 | Socket.IO 실시간 메시지, 읽음 카운트, 메시지 히스토리, 방 검색/필터 |
| 방 관리 | 방 생성/삭제, 멤버 초대, 역할(member/moderator/owner) 변경, 멤버 추방 |
| 검색/발견 | 공개 방 검색, 참여/미참여 상태 뱃지, 참여 중 여부 표시 |
| Insight | `/api/v1/insight/summary`로 총 방/유저/메시지 수와 당일 메시지 수 확인 |
| 알림 | Notification API 권한 요청, 비활성 상태에서도 새 메시지 브라우저 알림 |
| UI/UX | 그래디언트 테마, 반응형 레이아웃, 채팅 창 내부 스크롤, 상태 배지 노출 |

---

## 5. 실행 방법

### 5.1 필수 요구사항
- Node.js 20+
- MySQL 8 (또는 호환 RDS)

### 5.2 Backend
```bash
cd Backend
npm install
cp .env.example .env   # DB 접속, JWT_SECRET, CLIENT_ORIGIN 등 설정
npm run dev            # http://localhost:4000
```

주요 환경 변수
```
PORT=4000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=*****
DB_NAME=insight
JWT_SECRET=*****
CLIENT_ORIGIN=http://localhost:5173
```

Swagger 문서: `http://localhost:4000/api-docs`

### 5.3 Frontend
```bash
cd Frontend
npm install
cp .env.example .env   # VITE_API_BASE_URL, VITE_API_PREFIX, VITE_SOCKET_URL 등
npm run dev            # http://localhost:5173
```

---

## 6. 개발 Tips & 테스트

| 체크리스트 | 설명 |
|------------|------|
| Auth 흐름 | `/login` → 토큰 저장 → 보호된 라우트 진입 시 `AuthContext` 확인 |
| 프로필 | 닉네임/지역 수정 후 상태 메시지 확인, 이미지 업로드 시 미리보기·업데이트 URL 정상화 |
| 방 관리 | 새 방 생성 → 좌측 목록에서 선택 → 우측 멤버 패널에서 초대/권한 변경/제거 |
| 채팅 | 두 브라우저로 같은 방 접속 → 메시지 전송 → 실시간 갱신 + 읽음 처리 + 알림 확인 |
| Insight | DB에서 방/유저/메시지를 추가 후 `/api/v1/insight/summary` 값 변화를 확인 |

---

## 7. 향후 개선 아이디어

1. E2E 테스트 (Playwright/Cypress) 및 통합 테스트 도입  
2. 메시지/방 검색을 태그·필터 기반으로 확장  
3. 파일/이미지 전송, 멀티미디어 미리보기  
4. PWA + 푸시 알림(FCM)으로 모바일 경험 강화  
5. 관리자 대시보드(사용자/방 모니터링) 추가

---

## 8. Author
- 홍건우 (2025.09 ~ 2025.10)  
- 문의: honggunwoo.dev@gmail.com (예시)

