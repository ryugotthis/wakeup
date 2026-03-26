# 📌 WakeUp – Personalized K-Beauty Recommendation Platform

피부 타입 테스트(SKTI)를 통해 자신의 피부 타입을 파악하고,  
이를 기반으로 K-뷰티 제품을 탐색할 수 있는 개인화 웹 서비스입니다.

테스트 결과에 따라 제품을 필터링하고,  
대시보드에서 피부 타입, 테스트 이력, 북마크한 제품을 관리할 수 있도록 구성했습니다.

또한 로그인 전후 흐름이 끊기지 않도록 사용자 행동을 유지·복원하는 구조를 설계해  
자연스러운 사용자 경험을 만드는 데 집중했습니다.

[![🌐 Live Demo](https://img.shields.io/badge/Live_Demo-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://wakeup-nine.vercel.app/)

---

## 🎥 Demo

## 🎬 Demo Preview

### 1. 피부 테스트 → 결과 확인

- SKTI 테스트를 통해 피부 타입을 도출하는 흐름
  <video src="https://github.com/user-attachments/assets/b2e50888-a74f-4c15-ad55-617e12ca6193" autoplay loop muted playsinline width="600"/>

### 2. 상품 탐색 → 필터 적용 → 상세 페이지

- 피부 타입 기반으로 상품을 탐색하고 상세 정보까지 확인하는 흐름
  <video src="https://github.com/user-attachments/assets/2e402375-5ebe-4df9-aec7-448430ac56a3" autoplay loop muted playsinline width="600" />

### 3. 찜 등록 → 대시보드에서 확인

- 상품 페이지에서 저장한 데이터를 대시보드에서 관리하는 흐름
  <video src="https://github.com/user-attachments/assets/64292336-cc86-4745-8d1e-1122b9f49739" autoplay loop muted playsinline width="600" />

### 4. 다국어 지원

- 한국어 / 영어 / 프랑스어 전환
  <video src="https://github.com/user-attachments/assets/2f084c2e-25aa-4efc-bea0-f34f9d2a410d" autoplay loop muted playsinline width="600" />

### 5. 반응형 UI

- Tablet / Mobile 레이아웃 대응
  <video src="https://github.com/user-attachments/assets/399f1ba8-301b-4909-b315-0fa42b15c6b3" autoplay loop muted playsinline width="600" />

  <video src="https://github.com/user-attachments/assets/11463074-9c65-4a85-a2cc-42e7a64bb617" autoplay loop muted playsinline width="600" />

---

## 🧰 Tech Stack

- **Next.js (App Router)**
- **React**
- **TypeScript**
- **Tailwind CSS**
- **Supabase (OAuth + Auth)**
- **PostgreSQL + Prisma ORM**
- **Vercel / AWS S3 + CloudFront**

---

## 🚀 Key Features

### **1. Skin Type 기반 탐색 흐름**

- SKTI 테스트 → 피부 타입 도출
- 결과 기반 제품 필터링
- 대시보드에서 이력 및 북마크 관리

👉 탐색부터 관리까지 이어지는 사용자 흐름 설계

---

### **2. Design-First Architecture**

- User Flow, DB Schema, API Spec 선설계  
  👉 확장성과 유지보수를 고려한 구조

---

### **3. Server / Client 분리 (RSC 기반)**

- Server → 데이터 처리 및 인증
- Client → 인터랙션

👉 책임 분리를 통한 성능 최적화

---

### **4. Authentication Flow (OAuth + Cookie Session)**

- Supabase OAuth 기반 로그인
- Server Component에서도 인증 상태 처리

👉 SSR 환경에서도 일관된 인증 흐름

---

### **5. Seamless UX after Login**

- 사용자 액션 저장 → 로그인 이후 복원

👉 인증 이후에도 흐름이 끊기지 않는 UX

---

## 🚀 Performance Optimization

### **Page Transition Improvement**

> **2705ms → 159ms (≈94% faster)**

---

### **Key Improvements**

- Cached `count` query using `unstable_cache`  
  → **476ms → 13ms (↓97%)**

- Unified server–DB region  
  → Reduced network latency

- Applied Prisma transaction mode  
  → `findMany` **2556ms → 349ms (↓86%)**

- Removed unnecessary data fetching  
  → Optimized locale & relation queries

---

### **Approach**

> Measured each step (auth → DB → render)  
> and solved bottlenecks based on actual execution time

---

## 📁 Folder Structure(요약)

```src
app/
  [locale]/            # 다국어 라우팅 (ko / en / fr)
    products/          # 제품 목록 및 상세 페이지 (필터링 중심)
    dashboard/         # 사용자 데이터 관리 (테스트 결과, 북마크)
    api/               # Route Handler (서버 로직, 인증 처리 등)

components/
  products/            # 제품 관련 UI (Card, List 등)
  dashboard/           # 사용자 인터페이스 (대시보드 UI)
  ui/                  # 공통 UI 컴포넌트 (Button, Modal 등 재사용)

lib/
  prisma/              # DB 접근 레이어 (Prisma client, query)
  supabase/            # 인증 및 세션 처리 (OAuth, cookie)
```

---

## 📝 Learnings

- 성능은 코드보다 **구조와 인프라 설계**에서 결정된다
- Server / Client 분리는 **성능과 유지보수에 직결되는 핵심 설계 요소**
- UX는 기능보다 **사용자 흐름(로그인, 저장 등)**에서 완성된다
- 성능 개선은 추측이 아닌 **측정 기반 접근**이 필수

---

## 👤 Role

> **Frontend Developer 100% 담당**

- Architecture 설계
- Filtering 로직 구현
- Authentication 흐름 설계
- Performance 최적화
- Deployment
