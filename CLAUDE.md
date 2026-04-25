# JH-하네스 프레임워크 대시보드

## 프로젝트 개요
Superpowers / GSD / gstack 세 가지 Claude Code 프레임워크를 분석·추천하고,
Claude Code 착수 프롬프트를 자동 생성하는 선택형 개발 대시보드.

**API 키 불필요** — 룰 기반 분석 엔진으로 동작. Claude Code 구독만으로 완전 동작.

## 기술 스택
- Frontend: Next.js 14 (App Router) + TypeScript
- Styling: Tailwind CSS
- 상태 관리: Zustand (localStorage 영속)
- 분석: 룰 기반 엔진 (lib/framework-router.ts)
- 생성: 템플릿 기반 (lib/prompt-generator.ts)

## 실행
```bash
npm install
npm run dev
# → http://localhost:3000
```

## 파일 구조
```
app/
  page.tsx                    # 홈
  new-project/page.tsx        # 입력 폼 (12개 필드)
  recommendation/page.tsx     # 분석 결과 + 추천
  review/page.tsx             # 검토 및 승인
  output/page.tsx             # 프롬프트 출력 4탭
  history/page.tsx            # 기록 목록
  frameworks/page.tsx         # 프레임워크 가이드
  api/
    analyze/route.ts          # 룰 기반 프레임워크 분석
    generate/route.ts         # 템플릿 기반 프롬프트 생성

lib/
  types.ts                    # 공통 타입
  framework-data.ts           # 실제 레포 기반 프레임워크 데이터
  framework-router.ts         # 룰 기반 추천 엔진 (핵심)
  prompt-generator.ts         # 템플릿 기반 생성기 (핵심)
  store.ts                    # Zustand 전역 상태

components/
  StepBar.tsx / CopyButton.tsx
```

## 개발 규칙
- named export만 사용
- any/unknown 타입 금지
- 컴포넌트당 단일 책임
- 중복 엔드포인트 금지
