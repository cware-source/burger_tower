# 버거 타워 (Notion 랭킹 버전)

## 폴더 구성
```
public/index.html 게임 화면
api/scores.js     랭킹 저장/조회 API (Notion DB 연결)
vercel.json       배포 설정 (public 폴더를 화면으로 사용)
package.json      Node 버전 지정
```

## Notion 데이터베이스 열 (이름이 정확히 같아야 합니다)
- 닉네임 (제목)
- 기록 (숫자)
- 플레이어ID (텍스트)

## 환경변수 (Vercel에 입력)
- NOTION_TOKEN : Notion API 토큰
- NOTION_DB_ID : 데이터베이스 ID (32자리)

## 배포 순서 (Vercel)
1. GitHub에서 새 저장소를 만들고 이 폴더의 파일을 그대로 올립니다. (api 폴더 구조 유지)
2. vercel.com에 GitHub 계정으로 로그인하고 "Add New → Project"에서 그 저장소를 Import 합니다.
3. Environment Variables에 위 두 값을 넣고 Deploy 를 누릅니다.
4. 나온 주소(예: https://xxxx.vercel.app)를 공유하면 같은 랭킹을 함께 봅니다.

환경변수를 나중에 바꾸면 Vercel에서 Redeploy 해야 적용됩니다.

## 참고
- 점수는 로그인 없이 받으므로 조작 방지는 1~500개 범위 확인뿐입니다.
- Notion API는 초당 3건 정도로 제한됩니다.
