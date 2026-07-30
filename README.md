# Foodex V4

식사 사진을 기록이 아닌 수집으로 바꾸는 모바일 우선 음식 도감이자 동료 성장 게임입니다. 로그인 화면 없이 바로 시작하며, 연결이 불안정해도 기록은 먼저 현재 기기에 저장됩니다.

## V4 기능

- 사진 기반 식사 기록과 음식 카드 생성
- 카드 희귀도, 경험치, 레벨, 연속 기록, 일일 퀘스트
- 지역 음식 세계지도와 계절 한정 발견
- 음식 세트 도감과 컬렉션 보상
- 원본 카드를 보존하는 음식 퓨전
- 카드 스킨과 배경 꾸미기
- 식사 시간·연속 기록·새 발견을 기억하는 AI 동료
- 오늘의 식사 일기와 월간 회고
- 동료 방 꾸미기와 레벨별 장식 해금
- 카드 획득 효과음, 화면 효과, 진동과 접근성 설정
- IndexedDB 로컬 우선 저장과 Supabase 백그라운드 동기화
- 선택형 이메일 연결을 통한 도감 보호

## 화면 구성

하단 메뉴는 홈, 도감, 중앙 기록 버튼, 모험, 동료의 다섯 영역으로 나뉜다.

- **홈**: AI 캐릭터, 레벨, 오늘의 카드, 오늘의 도전, 연속 기록만 짧게 보여 준다.
- **도감**: 카드, 음식 세트, 퓨전, 스킨과 배경을 관리한다.
- **모험**: 일일 퀘스트, 업적, 시즌 이벤트와 보물상자를 모은다.
- **동료**: 식사 일기, 월간 리포트, 동료 방과 효과 설정을 관리한다.

현재 동료 대화와 카드 문구는 유료 AI API 없이 동작한다. 음식명, 시간대, 기록 횟수, 연속 기록, 희귀도 같은 실제 앱 상태를 조합하는 결정형 규칙 엔진을 사용하며, 같은 상황의 반복 문구를 줄이기 위해 대화 이력도 저장한다.

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

1. `supabase/migrations/20260729233047_foodex_v3_schema.sql`과 `supabase/migrations/20260730032008_foodex_v4_companion.sql`을 순서대로 적용합니다.
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

테스트는 카드 규칙, V4 동료·대화 규칙, 진행도, IndexedDB, 동기화 재시도, Supabase 저장소, 네이티브 연결점, 주요 화면과 접근성 흐름을 포함합니다.

## Android 앱

Foodex는 Capacitor 기반 Android 앱을 우선 지원한다.

```bash
npm run android:sync
npm run android:open
```

디버그 APK를 명령줄에서 만들려면 Android SDK와 JDK 17을 준비한 뒤 실행한다.

```bash
npm run android:build
```

서명, AAB 생성, 실제 기기 점검 방법은 [Android 빌드·출시 가이드](docs/android-release.md)를 참고한다.

## 건강 정보 안내

Foodex의 음식 설명과 식사 리포트는 수집과 회고를 돕는 게임 콘텐츠다. 의료·영양 진단이나 치료 조언을 제공하지 않으며, 건강상 판단이 필요하면 자격을 갖춘 전문가와 상의해야 한다.

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
