앞서 연결한 Supabase 학생 데이터를 기준으로 출석 관리 기능도 실제 Supabase 데이터베이스와 연결해줘.

현재 React state 또는 mock data로만 관리되는 출석 정보를 제거하고, 출석 기록이 날짜별로 Supabase에 영구 저장되도록 구현해줘.

## 작업 전 확인

Supabase MCP를 사용하여 다음 내용을 먼저 확인해줘.

- 실제 학생 테이블명
- 학생 테이블의 실제 기본키 컬럼명과 데이터 타입
- 기존 출석 관련 테이블 존재 여부
- 기존 외래키와 RLS 정책
- 현재 프로젝트의 Supabase 및 인증 설정

기존 출석 테이블이 있다면 새로 만들지 말고 기존 구조를 검토하여 사용해줘.

출석 테이블이 없다면 아래 요구사항에 맞춰 Supabase migration으로 생성해줘.

## 출석 테이블 구성

테이블명은 기존 데이터베이스의 명명 규칙을 먼저 확인한 후 결정해줘. 별다른 규칙이 없다면 `attendance_records`를 사용해줘.

필요한 컬럼:

- 출석 기록 고유 ID
- 학생 ID
- 출석 날짜
- 출석 상태
- 실제 출석 처리 시간
- 비고
- 생성일시
- 수정일시

권장 구조:

```sql
create table attendance_records (
  id uuid primary key default gen_random_uuid(),
  student_id 학생테이블의_실제_PK타입 not null,
  attendance_date date not null,
  status text not null,
  checked_at timestamptz,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint attendance_records_status_check
    check (status in ('present', 'late', 'absent')),

  constraint attendance_records_student_date_unique
    unique (student_id, attendance_date),

  constraint attendance_records_student_fk
    foreign key (student_id)
    references 실제학생테이블(실제기본키)
    on delete restrict
);
```

위 SQL을 그대로 실행하지 말고, 반드시 MCP로 확인한 실제 학생 테이블명, 기본키 컬럼명, 기본키 타입에 맞춰 작성해줘.

한 학생은 같은 날짜에 출석 기록이 한 건만 존재하도록 유니크 제약조건을 적용해줘.

## 출석 상태 기준

출석 상태는 다음과 같이 관리해줘.

- `present`: 출석
- `late`: 지각
- `absent`: 결석
- 해당 날짜에 출석 레코드가 없음: 미출석

`미출석`은 별도의 출석 기록이 없는 초기 상태로 처리해줘.

미출석 버튼을 눌러 기존 상태를 초기화하는 경우에는 해당 날짜의 출석 기록을 삭제하되, 삭제 전 사용자 확인창을 표시해줘.

## 날짜와 시간 기준

한국에서 사용하는 프로그램이므로 날짜 계산은 한국 시간대인 `Asia/Seoul`을 기준으로 처리해줘.

브라우저와 서버의 UTC 날짜 차이 때문에 출석 날짜가 하루 전이나 다음 날로 저장되지 않도록 해줘.

- `attendance_date`: 한국 기준 날짜
- `checked_at`: 실제 처리 시각을 `timestamptz`로 저장
- 화면 표시: 한국 시간 형식으로 변환
- 단순히 `new Date().toISOString().split("T")[0]`만 사용하여 날짜를 계산하지 말 것

## 출석 저장 방식

출석체크 화면에서 학생의 상태를 누르면 Supabase에 즉시 반영해줘.

- 출석 선택: `present` 저장
- 지각 선택: `late` 저장
- 결석 선택: `absent` 저장
- 이미 해당 날짜의 기록이 있으면 INSERT하지 말고 UPDATE 또는 UPSERT
- 출석이나 지각 선택 시 `checked_at`에 현재 시각 저장
- 결석 선택 시 `checked_at`은 `null`
- 저장 중에는 해당 버튼을 중복 클릭할 수 없게 처리
- 저장 성공 후 화면 상태 즉시 갱신
- 저장 실패 시 이전 상태로 되돌리고 오류 메시지 표시

UPSERT는 학생 ID와 출석 날짜의 유니크 제약조건을 기준으로 처리해줘.

## 출석 조회

출석체크 화면을 열면 다음 데이터를 조회해줘.

1. Supabase 학생 테이블의 실제 재원 학생 목록
2. 선택한 날짜의 출석 기록
3. 학생 ID를 기준으로 두 데이터를 연결
4. 출석 기록이 없는 학생은 미출석으로 표시

출석체크 화면에 날짜 선택 기능도 추가해줘.

- 기본 날짜는 한국 기준 오늘
- 이전 날짜를 선택하면 해당 날짜의 출석 기록 표시
- 날짜를 변경하면 해당 날짜의 데이터 다시 조회
- 과거 날짜의 출석 기록도 수정 가능
- 미래 날짜는 선택하지 못하게 제한

## 대시보드 연결

대시보드는 한국 기준 오늘의 실제 Supabase 출석 기록을 조회해서 표시해줘.

- 전체 재원 학생 수
- 출석 인원
- 지각 인원
- 결석 인원
- 미출석 인원
- 오늘 출석률
- 최근 출석 처리 학생

출석률은 다음 기준으로 계산해줘.

```text
(출석 인원 + 지각 인원) / 전체 재원 학생 수 × 100
```

학생 수가 0명일 경우 출석률은 0%로 표시해서 0으로 나누는 오류가 발생하지 않게 해줘.

출석체크 화면에서 상태를 변경하면 대시보드 통계에도 실제 Supabase 데이터가 반영되게 해줘.

## 학생 삭제와 출석 기록 보호

출석 기록이 존재하는 학생은 실제 학생 정보와 출석 이력이 함께 사라지지 않도록 보호해줘.

- 외래키는 `ON DELETE RESTRICT` 사용
- 학생 테이블에 재원 여부나 활성 여부 컬럼이 있다면 실제 삭제 대신 비활성화 방식 사용
- 관련 컬럼이 없다면 임의로 추가하지 말고 현재 구조에서 가능한 처리 방법을 설명
- 출석 기록을 함께 강제 삭제하지 말 것
- 출석 기록이 있는 학생의 삭제가 실패하면 사용자가 이해할 수 있는 메시지 표시

## 서비스 구조

Supabase 출석 쿼리는 UI 컴포넌트에 직접 반복해서 작성하지 말고 출석 서비스 파일에서 관리해줘.

예시 함수:

```ts
getAttendanceByDate(date);
upsertAttendance(studentId, date, status);
resetAttendance(studentId, date);
getTodayAttendanceSummary();
```

기존 `attendance-service.ts`가 mock data를 사용하고 있다면 실제 Supabase 코드로 교체해줘.

기존 화면 디자인과 반응형 구조는 유지하고, 폴더를 `src/` 구조로 강제로 변경하지 말아줘.

## 보안 및 RLS

- RLS를 무조건 비활성화하지 말 것
- 모든 사용자에게 학생 개인정보와 출석 기록을 공개하는 정책을 만들지 말 것
- Service Role Key를 브라우저 코드에 넣지 말 것
- 기존 Supabase Auth와 RLS가 있다면 해당 구조에 맞는 정책 적용
- 인증 기능이 없어서 안전한 조회·저장 정책을 만들 수 없다면 임의로 전체 공개하지 말고 필요한 인증 구조와 현재 막히는 부분을 설명할 것

## Migration 관리

테이블, 제약조건, 인덱스, RLS 정책 변경은 재실행 가능한 Supabase migration으로 작성해줘.

- 기존 데이터 삭제 금지
- 기존 학생 테이블 구조 변경 금지
- 실제 운영 데이터를 초기화하지 말 것
- 작업 전에 현재 구조 확인
- 작업 후 생성된 테이블과 제약조건 확인

## 최종 검증

다음 흐름을 실제로 테스트해줘.

1. 실제 학생 목록 조회
2. 학생 한 명을 오늘 출석으로 처리
3. Supabase 출석 테이블에 기록 생성 확인
4. 같은 학생을 지각으로 변경
5. 기존 행이 중복 생성되지 않고 수정되는지 확인
6. 새로고침 후 상태 유지 확인
7. 이전 날짜 조회 확인
8. 대시보드 통계 반영 확인
9. PC와 모바일 화면 확인
10. TypeScript 및 빌드 오류 확인

테스트 목적으로 실제 출석 기록을 생성했다면 테스트한 학생과 생성된 기록을 명확히 알려주고, 임의로 운영 데이터를 삭제하지 말아줘.

완료 후 다음 내용을 정리해줘.

- 사용한 학생 테이블과 기본키
- 생성하거나 사용한 출석 테이블
- 출석 테이블의 컬럼과 제약조건
- 적용한 RLS 정책
- 생성 또는 수정한 프로젝트 파일
- 실제 조회·저장·수정 테스트 결과
- 추가 설정이 필요한 사항
