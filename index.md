---
layout: home
---

# 안녕하세요! Zorba의 블로그에 오신 것을 환영합니다.

개인 일상과 개발 및 기술 관련 기록을 남기는 블로그입니다.

## 최근 포스팅

<ul>
  {% for post in site.posts %}
    <li>
      <a href="{{ post.url | relative_url }}">{{ post.title }}</a> ({{ post.date | date: "%Y-%m-%d" }})
    </li>
  {% endfor %}
</ul>
