// assets/js/shop/shop-media-guard.js
// 설담화(說談花) 사진 및 영상 저장 방지 (쇼핑몰 전용)
// 미디어(img, video) 및 사진 뷰어 모달(#modal-review-photo)의 우클릭 메뉴와 드래그를 차단합니다.
// 텍스트 선택, 개발자 도구, 링크 클릭, 핀치 줌 등 일반 기능은 그대로 유지됩니다.

(function () {
  'use strict';

  function isProtectedMedia(el) {
    if (!el || typeof el.closest !== 'function') return false;
    return !!(el.closest('img, video') || el.closest('#modal-review-photo'));
  }

  // 우클릭 메뉴(contextmenu) 차단 (미디어 요소만)
  document.addEventListener('contextmenu', function (e) {
    if (isProtectedMedia(e.target)) {
      e.preventDefault();
    }
  }, { capture: true, passive: false });

  // 사진/영상 드래그(dragstart) 차단
  document.addEventListener('dragstart', function (e) {
    if (isProtectedMedia(e.target)) {
      e.preventDefault();
    }
  }, { capture: true, passive: false });

  // 비디오 컨트롤 다운로드 버튼 차단 (controlsList nodownload)
  function guardVideos() {
    const videos = document.querySelectorAll('video');
    for (let i = 0; i < videos.length; i++) {
      const v = videos[i];
      if (v.getAttribute('controlslist') !== 'nodownload') {
        v.setAttribute('controlslist', 'nodownload');
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', guardVideos);
  } else {
    guardVideos();
  }

  if (typeof MutationObserver !== 'undefined') {
    const mo = new MutationObserver(guardVideos);
    mo.observe(document.documentElement, { childList: true, subtree: true });
  }
})();
