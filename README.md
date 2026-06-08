# 마음로그 (MindLog)

텍스트 기록을 통해 마음의 흐름을 함께 살펴보고 돌보는 웹 서비스.
졸업 프로젝트용 프로토타입 — Next.js + Supabase + OpenAI.

> 이 0단계 버전은 **익명 로그인 + 일기 기록/저장**까지 동작합니다.
> 2.1 LLM 분석 · 2.2 PHQ-9 예측 · 2.3 케어 추천 · 2.4 피드백은 이후 단계에서 추가됩니다.

---

## 1. 사전 준비

- Node.js 18.18 이상 (권장 20+)
- Supabase 계정 (무료) — https://supabase.com
- LUXIA(Saltlux) API 키 (2.1 단계부터 필요) — https://platform.luxiacloud.com

## 2. 설치

```bash
npm install
```

## 3. Supabase 프로젝트 설정

1. https://supabase.com → **New project** 생성 (지역은 `Northeast Asia (Seoul)` 권장).
2. 좌측 **SQL Editor** → `supabase/schema.sql` 내용을 전체 복사해 붙여넣고 **Run**.
   (테이블 4개 + RLS 정책이 만들어집니다.)
3. 좌측 **Authentication → Sign In / Providers** → **Anonymous sign-ins** 를 **Enable**.
   ⚠️ 이걸 켜지 않으면 로그인 없이 기록이 저장되지 않습니다.
4. **Project Settings → API** 에서 아래 두 값을 복사:
   - `Project URL`
   - `anon` `public` key

## 4. 환경변수 설정

```bash
cp .env.local.example .env.local
```

`.env.local` 을 열어 값을 채웁니다:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
LUXIA_API_KEY=...                 # 2.1 분석부터 필요 (서버 전용)
LUXIA_MODEL=luxia3-llm-8b-0731
```

> 키 이름은 신규 `PUBLISHABLE_KEY`와 구버전 `ANON_KEY` 둘 다 지원합니다.
> `service_role`(secret) 키는 절대 넣지 마세요.

## 5. 실행

```bash
npm run dev
```

→ http://localhost:3000 접속. 글을 적고 **기록 담기** 를 누르면 저장되고,
아래 **지난 기록** 에 나타납니다. (브라우저를 새로고침해도 유지됩니다.)

## 6. 배포 (Vercel)

1. 이 폴더를 GitHub 레포로 push.
   ```bash
   git init && git add . && git commit -m "init: 마음로그 0단계"
   git branch -M main
   git remote add origin <your-repo-url>
   git push -u origin main
   ```
2. https://vercel.com → **Add New → Project** → 방금 만든 레포 **Import**.
3. **Environment Variables** 에 `.env.local` 의 세 값을 그대로 입력 → **Deploy**.

---

## 폴더 구조

```
app/
  layout.tsx          루트 레이아웃 (폰트 · 익명 세션 보장)
  page.tsx            기록 화면 (입력 → 저장 → 목록)
  globals.css         전역 스타일 · 팔레트
components/
  ensure-session.tsx  진입 시 익명 세션 자동 발급
lib/supabase/
  client.ts           브라우저용 Supabase 클라이언트
  server.ts           서버용 Supabase 클라이언트
middleware.ts         요청마다 세션 토큰 갱신
supabase/
  schema.sql          테이블 + RLS 정의
```

## 데이터 모델 요약

| 테이블 | 용도 |
| --- | --- |
| `entries` | 일기 기록 + (이후) LLM 분석 결과 |
| `phq9_responses` | PHQ-9 자가설문 = 예측 모델의 정답지 |
| `predictions` | 14일 특징 → 다음 PHQ-9 예측 결과 |
| `feedback` | UI/프롬프트 고도화용 사용자 피드백 |

## 다음 단계 로드맵

- **2.1** 기록 저장 시 LUXIA로 감정·증상축·활동·위험도 분석 → `entries`에 저장 ✅
- **2.2** 14일 누적 특징으로 선형회귀 → 다음 PHQ-9 예측 (14일치 쌓이면 활성화)
- **2.3** 좋아진 구간의 활동을 모아 "내게 효과 있던 활동" 카드 추천
- **2.4** 추세 시각화 · 위기 배너 · 피드백 수집

> ⚠️ 본 서비스는 의료적 진단·치료를 대신하지 않습니다.
