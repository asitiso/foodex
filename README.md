# Foodex V3

식사 사진을 기록이 아닌 수집으로 바꾸는 모바일 우선 음식 도감입니다. 로그인 화면 없이 바로 시작하며, 연결이 불안정해도 기록은 먼저 현재 기기에 저장됩니다.

## V3 기능

- 사진 기반 식사 기록과 음식 카드 생성
- 카드 희귀도, 경험치, 레벨, 연속 기록, 일일 퀘스트
- 지역 음식 세계지도와 계절 한정 발견
- 음식 세트 도감과 컬렉션 보상
- 원본 카드를 보존하는 음식 퓨전
- 카드 스킨과 배경 꾸미기
- IndexedDB 로컬 우선 저장과 Supabase 백그라운드 동기화
- 선택형 이메일 연결을 통한 도감 보호

## 로컬 실행

Node.js 22 이상이 필요합니다.

```bash
npm ci
npm run dev
```

`.env.local`에는 브라우저에서 공개되어도 되는 값만 넣습니다.

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

두 변수가 없거나 익명 인증을 사용할 수 없으면 앱은 로컬 전용 모드로 계속 작동합니다. 이 경우 브라우저 사이트 데이터를 삭제하면 복구할 수 없으므로, 장기 보관이 필요하면 앱 안에서 이메일을 연결해야 합니다. 이메일 확인이 끝나기 전에는 다른 기기 복구가 완료된 것으로 안내하지 않습니다.

## Supabase 준비

1. `supabase/migrations/20260729233047_foodex_v3_schema.sql`을 Supabase migration으로 적용합니다.
2. Auth에서 Anonymous Sign-Ins와 이메일 확인을 활성화합니다.
3. 운영 도메인과 허용할 Preview 콜백 URL을 Auth URL 설정에 추가합니다.
4. 공개 전 CAPTCHA 또는 Cloudflare Turnstile과 Custom SMTP를 설정합니다.
5. `meal-photos` 버킷이 private인지, 각 테이블의 RLS가 활성화되어 있는지 확인합니다.

브라우저에는 publishable key만 전달합니다. `service_role`, secret key, 데이터베이스 비밀번호는 Vite 환경 변수에 넣지 않습니다.

## 검증

```bash
npm run test:run
npm run build
rg -n 'sb_secret_[A-Za-z0-9_-]{20,}|service_role[[:space:]]*[:=]' src .env.example dist
```

테스트는 카드 규칙, V3 진행도, IndexedDB, 동기화 재시도, Supabase 저장소, 주요 화면과 접근성 흐름을 포함합니다.

## Vercel 배포

GitHub 저장소를 Vercel 프로젝트에 연결하면 브랜치 push는 Preview, 운영 브랜치 push는 Production으로 자동 배포됩니다.

Project Settings에서 다음을 확인합니다.

- Framework Preset: Vite
- Node.js: 22
- Install Command: `npm ci`
- Build Command: `npm run build`
- Output Directory: `dist`
- Preview/Production 환경 변수: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`

Supabase secret 또는 service-role key를 Vercel의 `VITE_` 변수로 등록하면 안 됩니다.
