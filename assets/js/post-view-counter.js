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

  document.addEventListener('DOMContentLoaded', function () {
    initToc();
  });
})();
