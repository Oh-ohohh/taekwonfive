# 관리자 로그인

로그인 주소는 `/login`, 화면에서 사용하는 아이디는 `admin`입니다. 비밀번호는 Supabase Auth에만 저장하며 소스 코드에 포함하지 않습니다.

Supabase 이메일 인증에는 내부 식별자인 `admin@taekwonfive.internal`을 사용합니다. 실제 수신용 이메일 주소가 아니므로 메일로 비밀번호를 복구할 수 없습니다. 필요하면 Supabase Authentication에서 관리자가 비밀번호를 변경합니다. 다른 이메일을 사용할 때는 서버 환경 변수 `SUPABASE_ADMIN_EMAIL`도 같은 값으로 설정합니다.

## 접근 제어

- Proxy에서 검증된 토큰으로 비로그인 요청을 로그인 페이지로 보냅니다.
- `(protected)` 레이아웃에서 Supabase `getUser()`와 `app_metadata.role === "admin"`을 확인한 뒤 앱과 데이터 공급자를 렌더링합니다.
- 로그인 성공 후에는 검증된 내부 경로로만 돌아갑니다.
- 로그아웃은 현재 세션을 종료하고 쿠키와 라우터 캐시를 갱신합니다.
- 학생·출석 테이블에는 `supabase/migrations/202609110001_admin_access.sql`의 관리자 전용 RLS를 적용합니다. 기존 정책을 보존하면서 restrictive 정책으로 비로그인·일반 계정의 접근을 제한합니다.
- 회원가입으로 사용자가 입력할 수 있는 `user_metadata`는 권한 판단에 사용하지 않습니다.

## 계정 준비 및 검증

프로젝트 루트에서 실행합니다. 서버 관리 토큰은 `SUPABASE_ACCESS_TOKEN` 또는 기존 `.mcp.json` 설정에서 읽습니다. 서비스 키는 실행 중에만 사용하고 브라우저나 출력에 노출하지 않습니다.

```powershell
# 실행할 PowerShell 세션에 초기 비밀번호를 먼저 설정합니다.
$env:ADMIN_INITIAL_PASSWORD = '<설정할 비밀번호>'
node --env-file=.env.local scripts/manage-admin.mjs inspect
node --env-file=.env.local scripts/manage-admin.mjs provision
node --env-file=.env.local scripts/manage-admin.mjs verify

# 로컬 서버 실행 후 실제 웹 폼으로 로그인/로그아웃을 검사합니다.
node scripts/verify-auth.mjs
```

`provision`은 기존 관리자 비밀번호를 덮어쓰지 않습니다. 다른 계정이 내부 이메일을 이미 사용하거나 RLS가 일부만 설치되어 있으면 중단합니다. 마이그레이션은 한 번만 적용합니다.

Supabase의 기존 비밀번호 길이·이메일 확인·회원가입 설정은 변경하지 않습니다.
