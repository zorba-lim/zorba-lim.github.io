# 게시물 조회수 표시(가장 쉬운 방법)

GitHub Pages + Jekyll(Chirpy) 블로그에서 **가장 쉽게** 조회수를 표시하려면,
외부 카운터 서비스 중 **Busuanzi**를 붙이는 방식이 가장 간단합니다.

- 장점: 가입/백엔드 없이 스크립트 1개 + 표시용 HTML만 추가하면 됨
- 단점: 서드파티 서비스 의존

---

## 1) 추적 스크립트 추가

`_includes/metadata-hook.html` 파일 하단에 아래 스크립트를 추가하세요.

```html
<script async src="//busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js"></script>
```

---

## 2) 포스트에 조회수 출력

각 게시물마다 조회수를 보이려면 포스트 메타 영역(또는 원하는 위치)에 아래 HTML을 넣으면 됩니다.

```html
<span id="busuanzi_container_page_pv" style="display:none;">
  조회수 <span id="busuanzi_value_page_pv"></span>
</span>
```

- `page_pv`는 현재 페이지 조회수입니다.
- 값이 로드되면 자동으로 숫자가 채워집니다.

---

## 3) 홈/목록에서 사이트 전체 방문자도 표시 가능(선택)

```html
<span id="busuanzi_container_site_uv" style="display:none;">
  방문자 <span id="busuanzi_value_site_uv"></span>
</span>
```

---

## 4) 확인 방법

1. 로컬 실행 또는 배포 후 포스트 페이지 접속
2. 페이지 소스/개발자 도구에서 `busuanzi_value_page_pv` 값이 채워지는지 확인
3. 첫 로딩 직후 잠시 비었다가 표시될 수 있음(정상)

---

## 참고

- GA4는 수집은 쉽지만, **포스트별 조회수를 페이지에 바로 출력**하려면
  API/서버리스 연동이 필요해 구현 난이도가 올라갑니다.
- 그래서 “가장 쉬운 방법” 기준으로는 Busuanzi 방식이 적합합니다.
