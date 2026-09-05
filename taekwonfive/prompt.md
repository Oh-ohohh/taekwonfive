현재 Supabase MCP가 연결되어 있다.
태권도 학생 정보를 저장할 테이블을 생성하고, 아래 데이터를 저장할 수 있도록 작업해줘.

[테이블 요구사항]

학생 테이블의 컬럼은 아래만 만든다.

- name : 이름
- birth_date : 생년월일
- school : 학교
- gender : 성별
- grade : 급
- poom : 품
- guardian_name : 보호자 이름
- notes : 특이사항

조건:

1. 필수 컬럼은 name(이름)만 설정한다.
2. 나머지 컬럼은 NULL 허용한다.
3. 현재 제공하는 데이터에서 값이 없는 경우에는 우선 "-" 문자열로 입력한다.
4. 현재 데이터에는 생년월일, 학교, 성별, 보호자 이름 정보가 없으므로 모두 "-"로 저장한다.
5. 연락처 관련 컬럼은 만들지 않는다.
6. 개인정보인 전화번호 데이터도 저장하지 않는다.
7. 기존 테이블이 없다면 적절한 이름으로 새 테이블을 생성한다. 추천 테이블명은 students.
8. 테이블에 id 컬럼이 필요하다면 UUID 또는 bigint primary key 형태로 자동 생성되게 구성해도 된다.
9. created_at 컬럼이 필요하다면 자동 생성 컬럼으로 추가해도 된다.
10. grade 컬럼에는 "급" 숫자만 저장하고, poom 컬럼에는 "품" 숫자만 저장한다.
    예:

- 4품 1급 → poom = "4", grade = "1"
- 3품 16급 → poom = "3", grade = "16"
- 빨간띠 → poom = "-", grade = "-"

11. 단, 현재 데이터 중 "4단"은 poom에 "4단"으로 저장하지 말고 notes에 "4단"이라고 적고 poom은 "-"로 처리한다.
12. 띠 정보도 poom이나 grade에 넣지 말고 notes에 기록한다.
    예:

- 빨간띠 → notes = "빨간띠"
- 노란띠 → notes = "노란띠"
- 주황띠 → notes = "주황띠"
- 흰띠 → notes = "흰띠"

13. 기존 비고에 "확인 필요"가 있는 경우 해당 내용을 notes에 같이 넣는다.
14. "국3"처럼 판독이 불분명한 값은 임의로 해석하지 말고 notes에 원문 그대로 기록한다.
15. 이승현은 중복 제거 후 "빨간띠 이승현" 1건만 입력한다.

[입력 데이터]

1. 천서현
   birth_date: -
   school: -
   gender: -
   grade: -
   poom: -
   guardian_name: -
   notes: 4단

2. 김도현
   birth_date: -
   school: -
   gender: -
   grade: 1
   poom: 4
   guardian_name: -
   notes: -

3. 좌규윤
   birth_date: -
   school: -
   gender: -
   grade: 1
   poom: 4
   guardian_name: -
   notes: 이름 판독 확인 필요

4. 전하연
   birth_date: -
   school: -
   gender: -
   grade: 3
   poom: 4
   guardian_name: -
   notes: -

5. 지동현
   birth_date: -
   school: -
   gender: -
   grade: 8
   poom: 4
   guardian_name: -
   notes: -

6. 지서준
   birth_date: -
   school: -
   gender: -
   grade: 12
   poom: 4
   guardian_name: -
   notes: -

7. 우승인
   birth_date: -
   school: -
   gender: -
   grade: 17
   poom: 4
   guardian_name: -
   notes: -

8. 이준
   birth_date: -
   school: -
   gender: -
   grade: 17
   poom: 4
   guardian_name: -
   notes: -

9. 이가랑
   birth_date: -
   school: -
   gender: -
   grade: 21
   poom: 4
   guardian_name: -
   notes: -

10. 김현서
    birth_date: -
    school: -
    gender: -
    grade: 22
    poom: 4
    guardian_name: -
    notes: -

11. 안영민
    birth_date: -
    school: -
    gender: -
    grade: 22
    poom: 4
    guardian_name: -
    notes: -

12. 조효찬
    birth_date: -
    school: -
    gender: -
    grade: 22
    poom: 4
    guardian_name: -
    notes: -

13. 원종윤
    birth_date: -
    school: -
    gender: -
    grade: -
    poom: 4
    guardian_name: -
    notes: 급수 판독 확인 필요

14. 홍해인
    birth_date: -
    school: -
    gender: -
    grade: -
    poom: 4
    guardian_name: -
    notes: 급수 판독 확인 필요

15. 이찬희
    birth_date: -
    school: -
    gender: -
    grade: 1
    poom: 3
    guardian_name: -
    notes: 급수 표기 확인 필요

16. 송승유
    birth_date: -
    school: -
    gender: -
    grade: 6
    poom: 3
    guardian_name: -
    notes: 이름 판독 확인 필요

17. 송우진
    birth_date: -
    school: -
    gender: -
    grade: 6
    poom: 3
    guardian_name: -
    notes: -

18. 김서윤
    birth_date: -
    school: -
    gender: -
    grade: 7
    poom: 3
    guardian_name: -
    notes: -

19. 김시후
    birth_date: -
    school: -
    gender: -
    grade: 7
    poom: 3
    guardian_name: -
    notes: -

20. 안소연
    birth_date: -
    school: -
    gender: -
    grade: 7
    poom: 3
    guardian_name: -
    notes: -

21. 최예슬
    birth_date: -
    school: -
    gender: -
    grade: 7
    poom: 3
    guardian_name: -
    notes: -

22. 윤지아
    birth_date: -
    school: -
    gender: -
    grade: 12
    poom: 3
    guardian_name: -
    notes: -

23. 윤하선
    birth_date: -
    school: -
    gender: -
    grade: 12
    poom: 3
    guardian_name: -
    notes: -

24. 강현종
    birth_date: -
    school: -
    gender: -
    grade: 13
    poom: 3
    guardian_name: -
    notes: -

25. 박건하
    birth_date: -
    school: -
    gender: -
    grade: 13
    poom: 3
    guardian_name: -
    notes: -

26. 이다윤
    birth_date: -
    school: -
    gender: -
    grade: 13
    poom: 3
    guardian_name: -
    notes: -

27. 이주원
    birth_date: -
    school: -
    gender: -
    grade: 13
    poom: 3
    guardian_name: -
    notes: -

28. 최승현
    birth_date: -
    school: -
    gender: -
    grade: 14
    poom: 3
    guardian_name: -
    notes: -

29. 곽의파
    birth_date: -
    school: -
    gender: -
    grade: 16
    poom: 3
    guardian_name: -
    notes: 이름 판독 확인 필요

30. 김명진
    birth_date: -
    school: -
    gender: -
    grade: 16
    poom: 3
    guardian_name: -
    notes: -

31. 나용성
    birth_date: -
    school: -
    gender: -
    grade: 16
    poom: 3
    guardian_name: -
    notes: -

32. 박하준
    birth_date: -
    school: -
    gender: -
    grade: 16
    poom: 3
    guardian_name: -
    notes: -

33. 윤효재
    birth_date: -
    school: -
    gender: -
    grade: 16
    poom: 3
    guardian_name: -
    notes: 이름 판독 확인 필요

34. 김석
    birth_date: -
    school: -
    gender: -
    grade: 18
    poom: 3
    guardian_name: -
    notes: 이름 판독 확인 필요

35. 김유진
    birth_date: -
    school: -
    gender: -
    grade: 18
    poom: 3
    guardian_name: -
    notes: -

36. 문성인
    birth_date: -
    school: -
    gender: -
    grade: 18
    poom: 3
    guardian_name: -
    notes: -

37. 박태건
    birth_date: -
    school: -
    gender: -
    grade: 18
    poom: 3
    guardian_name: -
    notes: -

38. 오윤
    birth_date: -
    school: -
    gender: -
    grade: 18
    poom: 3
    guardian_name: -
    notes: 이름 판독 확인 필요

39. 박서후
    birth_date: -
    school: -
    gender: -
    grade: 3
    poom: 2
    guardian_name: -
    notes: -

40. 정지윤
    birth_date: -
    school: -
    gender: -
    grade: 3
    poom: 2
    guardian_name: -
    notes: -

41. 정지훈
    birth_date: -
    school: -
    gender: -
    grade: 3
    poom: 2
    guardian_name: -
    notes: -

42. 김도희
    birth_date: -
    school: -
    gender: -
    grade: 7
    poom: 2
    guardian_name: -
    notes: -

43. 고민
    birth_date: -
    school: -
    gender: -
    grade: 8
    poom: 2
    guardian_name: -
    notes: 이름 판독 확인 필요

44. 김하찬
    birth_date: -
    school: -
    gender: -
    grade: 8
    poom: 2
    guardian_name: -
    notes: -

45. 윤서아
    birth_date: -
    school: -
    gender: -
    grade: 8
    poom: 2
    guardian_name: -
    notes: -

46. 이윤수
    birth_date: -
    school: -
    gender: -
    grade: 8
    poom: 2
    guardian_name: -
    notes: -

47. 김서준
    birth_date: -
    school: -
    gender: -
    grade: 12
    poom: 2
    guardian_name: -
    notes: -

48. 박서인
    birth_date: -
    school: -
    gender: -
    grade: 12
    poom: 2
    guardian_name: -
    notes: -

49. 박서준
    birth_date: -
    school: -
    gender: -
    grade: 12
    poom: 2
    guardian_name: -
    notes: -

50. 최종인
    birth_date: -
    school: -
    gender: -
    grade: 12
    poom: 2
    guardian_name: -
    notes: -

51. 김성인
    birth_date: -
    school: -
    gender: -
    grade: -
    poom: 2
    guardian_name: -
    notes: 급수 미기재

52. 박서윤
    birth_date: -
    school: -
    gender: -
    grade: 1
    poom: 1
    guardian_name: -
    notes: -

53. 윤예린
    birth_date: -
    school: -
    gender: -
    grade: 1
    poom: 1
    guardian_name: -
    notes: -

54. 지율
    birth_date: -
    school: -
    gender: -
    grade: 1
    poom: 1
    guardian_name: -
    notes: -

55. 유정연
    birth_date: -
    school: -
    gender: -
    grade: 3
    poom: 1
    guardian_name: -
    notes: -

56. 이주아
    birth_date: -
    school: -
    gender: -
    grade: 3
    poom: 1
    guardian_name: -
    notes: -

57. 하성현
    birth_date: -
    school: -
    gender: -
    grade: 3
    poom: 1
    guardian_name: -
    notes: -

58. 한세현
    birth_date: -
    school: -
    gender: -
    grade: 3
    poom: 1
    guardian_name: -
    notes: 이름 판독 확인 필요

59. 강윤이
    birth_date: -
    school: -
    gender: -
    grade: 4
    poom: 1
    guardian_name: -
    notes: 이름 판독 확인 필요

60. 이자현
    birth_date: -
    school: -
    gender: -
    grade: 4
    poom: 1
    guardian_name: -
    notes: -

61. 서승현
    birth_date: -
    school: -
    gender: -
    grade: -
    poom: -
    guardian_name: -
    notes: 원본 표기 "국3" 확인 필요

62. 양하결
    birth_date: -
    school: -
    gender: -
    grade: -
    poom: -
    guardian_name: -
    notes: 흰띠 / 이름 판독 확인 필요

63. 윤지안
    birth_date: -
    school: -
    gender: -
    grade: -
    poom: -
    guardian_name: -
    notes: 노란띠

64. 윤하진
    birth_date: -
    school: -
    gender: -
    grade: -
    poom: -
    guardian_name: -
    notes: 빨간띠

65. 이승현
    birth_date: -
    school: -
    gender: -
    grade: -
    poom: -
    guardian_name: -
    notes: 빨간띠

66. 이유나
    birth_date: -
    school: -
    gender: -
    grade: -
    poom: -
    guardian_name: -
    notes: 노란띠

67. 최지당
    birth_date: -
    school: -
    gender: -
    grade: -
    poom: -
    guardian_name: -
    notes: 주황띠 / 이름 판독 확인 필요

[실행 방식]

먼저:

1. 테이블 생성 SQL을 작성한다.
2. 생성 전 기존 students 테이블 존재 여부를 확인한다.
3. 기존 테이블이 있으면 구조를 보여주고 충돌 여부를 확인한다.
4. 새로 만들어야 하면 위 컬럼 구조대로 생성한다.
5. 그 다음 위 67명의 데이터를 INSERT한다.
6. INSERT 후 총 건수와 삽입된 학생 이름 목록을 확인한다.
7. 동일 이름이 이미 존재하면 중복 INSERT하지 말고 어떤 이름이 중복인지 알려준다.

가능하면 모든 작업은 Supabase MCP를 사용해서 직접 수행해줘.
