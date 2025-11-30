# Nano Banana Pro API 키 설정 가이드

## 1단계: API 키 발급받기

1. [Nano Banana Pro API 웹사이트](https://nanobananaproapi.com)에 접속합니다
2. 회원가입 또는 로그인을 진행합니다
3. 대시보드에서 API 키를 발급받습니다
4. 발급받은 API 키를 복사해둡니다

## 2단계: .env 파일 설정

프로젝트 루트 디렉토리에 `.env` 파일이 이미 생성되어 있습니다.

### 방법 1: 텍스트 에디터로 직접 수정

1. 프로젝트 루트 디렉토리에서 `.env` 파일을 엽니다
2. 다음 내용을 찾습니다:
   ```
   VITE_NANOBANANA_API_KEY=your_api_key_here
   ```
3. `your_api_key_here`를 발급받은 실제 API 키로 교체합니다
   ```
   VITE_NANOBANANA_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxx
   ```
4. 파일을 저장합니다

### 방법 2: 터미널에서 직접 수정

```bash
# .env 파일 편집
nano .env
# 또는
code .env
```

그리고 `your_api_key_here`를 실제 API 키로 교체하세요.

## 3단계: 개발 서버 재시작

환경 변수는 개발 서버 시작 시 로드되므로, 변경 후 반드시 재시작해야 합니다:

```bash
# 현재 실행 중인 서버를 중지 (Ctrl+C)
# 그 다음 다시 시작
npm run dev
```

## 확인 방법

API 키가 제대로 설정되었는지 확인하려면:

1. 브라우저 개발자 도구를 엽니다 (F12)
2. Console 탭으로 이동합니다
3. AI 생성 요청을 시도합니다
4. API 키가 설정되지 않았다면 에러 메시지가 표시됩니다:
   ```
   Nano Banana Pro API key is not configured. Please set VITE_NANOBANANA_API_KEY in your .env file.
   ```

## 문제 해결

### API 키가 인식되지 않는 경우

1. `.env` 파일이 프로젝트 루트에 있는지 확인
2. 파일 이름이 정확히 `.env`인지 확인 (`.env.txt` 아님)
3. 개발 서버를 재시작했는지 확인
4. 환경 변수 이름이 정확한지 확인: `VITE_NANOBANANA_API_KEY`
5. API 키 앞뒤에 공백이나 따옴표가 없는지 확인

### API 요청이 실패하는 경우

1. API 키가 유효한지 확인
2. API 사용량/크레딧이 남아있는지 확인
3. 네트워크 연결 상태 확인
4. 브라우저 콘솔에서 에러 메시지 확인

## 보안 주의사항

⚠️ **중요**: `.env` 파일은 절대 Git에 커밋하지 마세요!

- `.env` 파일은 이미 `.gitignore`에 추가되어 있습니다
- API 키가 GitHub 등에 노출되면 즉시 키를 재발급받으세요
- `.env.example` 파일은 템플릿용이므로 실제 키를 넣지 마세요

## 추가 정보

- API 문서: [Nano Banana Pro API Documentation](https://nanobananaproapi.com/docs)
- 지원: API 관련 문의는 Nano Banana Pro 지원팀에 연락하세요


