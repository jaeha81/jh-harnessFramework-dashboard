# 세션 핸드오프 — 2026-04-26

## 마지막 커밋
`ebb3868` feat: 완성본 — PWA 설치버튼, Drive OAuth 수정, history E2E, SW 전체 페이지 캐시

## 완료된 작업 (이번 세션)

1. **saveToHistory() 버그 수정**
   - `app/output/page.tsx` — `useRef` 기반 중복 방지 후 `useEffect`에서 자동 저장
   - 기존에는 history가 항상 비어있었음 (치명적 버그)

2. **Google Drive OAuth 개선**
   - `lib/googleDrive.ts` — `prompt:"consent"` 제거 (매번 동의창 팝업 방지)
   - `sessionStorage` 토큰 캐시 (페이지 이동해도 재인증 불필요)
   - 401 응답 시 자동 토큰 초기화
   - "Obsidian Vault" 부모 레이어 제거 → Drive root에 "JH 하네스 대시보드" 단일 폴더

3. **PWA 설치 버튼**
   - `components/PwaInstallButton.tsx` 신규 — `beforeinstallprompt` 이벤트 감지
   - 데스크탑(Chrome/Edge)/Android에서 하단 우측 "앱으로 설치" 버튼 표시
   - 이미 설치됐으면 자동 숨김

4. **iOS 뷰포트 수정**
   - `app/layout.tsx` — `maximumScale=1, userScalable=false` 추가 (입력 포커스 시 자동 줌 방지)
   - PWA 전용 meta 태그 완비 (`apple-mobile-web-app-capable`, `mobile-web-app-capable`)

5. **PWA manifest 완성**
   - `id`, `scope`, `lang:"ko"`, `orientation:"any"`, `categories`, `shortcuts` 추가

6. **Service Worker v2**
   - `public/sw.js` — 전 페이지 precache (`/`, `/new-project`, `/recommendation`, `/review`, `/output`, `/history`, `/frameworks`)
   - `_next/static/` 캐시-퍼스트 전략
   - Google API 요청 SW bypass
   - 오프라인 폴백 (/ 루트로 서빙)

7. **History 페이지 완성**
   - `app/history/page.tsx` — Drive import 탭뷰(프롬프트/Codex/Handoff/Wiki)
   - "이 요청으로 재분석" 버튼 (formData → store → /new-project)
   - 로컬 기록도 탭뷰 + 재분석 버튼

## 알려진 환경 제약
- `next/og` — Windows 한글 경로 폰트 버그. 사용 불가.
- `drive.file` scope — 이 앱이 생성한 파일/폴더만 접근 가능 (의도된 제한)
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` — `.env.local`에 실제 클라이언트 ID 입력 필요

## 실행
```bash
cd D:/ai프로젝트/jh-harnessFramework-dashboard
npm run dev  # http://localhost:3000
```

## 다음에 할 수 있는 작업
- [ ] Vercel 배포 + 프로덕션 Google OAuth redirect URI 등록
- [ ] iOS Safari에서 홈화면 추가 실기기 테스트
- [ ] Google Cloud Console에서 OAuth 클라이언트 설정 가이드 제공
