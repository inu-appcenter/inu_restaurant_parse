# 인천대학교 생협 학식 메뉴 크롤링
### 정보통신공학과 김선일([Seonift](https://github.com/seonift))

인천대학교 생협 홈페이지에서 매주 학식 메뉴를 크롤링해오는 node.js 입니다.

매주 일요일, 월요일에 작동하며(월요일은 수정사항 대비) 긁어와서 DB에 저장합니다. mysql 부분 수정해서 필요한 곳에 쓰세요.

기준 테이블 컬럼은 아래와 같습니다.

date(날짜, date) / name(식당 이름, varchar) / corner(코너, 1코너, 2코너, 중식, 석식 등, varchar) / menu_num(메뉴 순서번호, int) / menu(메뉴, varchar)
