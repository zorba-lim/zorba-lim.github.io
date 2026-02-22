(function () {
  function initToc() {
    if (typeof window.tocbot === 'undefined') return;

    window.tocbot.init({
      tocSelector: '#toc',
      contentSelector: '.content',
      ignoreSelector: '[data-toc-skip]',
      headingSelector: 'h2, h3, h4, h5, h6',
      collapseDepth: 6,
      orderedList: false,
      scrollSmooth: false,
      headingsOffset: 32
    });
  }

  function isPostDetailPage() {
    var ogType = document.querySelector('meta[property="og:type"]');
    var isArticle = ogType && ogType.getAttribute('content') === 'article';
    var hasArticleContent = Boolean(document.querySelector('article .content'));

    return Boolean(isArticle && hasArticleContent);
  }

  function findCounterMountPoint() {
    var selectors = [
      'article header .post-meta',
      'article .post-meta.text-muted',
      'article .post-meta',
      '.post-meta.text-muted',
      '.post-meta',
      'article header',
      'article .content',
      'article'
    ];

    for (var i = 0; i < selectors.length; i += 1) {
      var node = document.querySelector(selectors[i]);
      if (node) return node;
    }

    return null;
  }

  function mountCounter() {
    if (document.getElementById('post_view_counter')) return;

    var mountPoint = findCounterMountPoint();
    if (!mountPoint) return;

    var counter = document.createElement('span');
    counter.id = 'post_view_counter';
    counter.className = 'post-view-counter';
    counter.innerHTML = '👁 조회수 <span id="busuanzi_value_page_pv">-</span>';

    if (mountPoint.classList.contains('post-meta')) {
      mountPoint.appendChild(document.createTextNode(' · '));
      mountPoint.appendChild(counter);
    } else {
      counter.style.display = 'inline-block';
      counter.style.marginTop = '0.5rem';
      counter.style.color = 'var(--text-muted-color, #6c757d)';
      mountPoint.insertBefore(counter, mountPoint.firstChild);
    }
  }

  function loadBusuanzi() {
    if (document.querySelector('script[data-busuanzi]')) return;

    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js';
    script.setAttribute('data-busuanzi', 'true');
    script.onload = function () {
      if (window.BUSUANZI && typeof window.BUSUANZI.fetch === 'function') {
        window.BUSUANZI.fetch();
      }
    };

    document.body.appendChild(script);
  }

  document.addEventListener('DOMContentLoaded', function () {
    initToc();
    if (!isPostDetailPage()) return;
    mountCounter();
    loadBusuanzi();
  });
})();
