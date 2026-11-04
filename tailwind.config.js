// 설담화 화면 스타일 설정 (예전 index.html·admin-index.html 안의 tailwind.config와 같음)
// 클래스 이름을 바꾸거나 새로 쓰면 `npm run build:css`로 assets/css/tailwind.css를 다시 만들어 주세요.
module.exports = {
  content: ['./index.html', './admin-index.html', './assets/js/**/*.js'],
  theme: {
    extend: {
      colors: {
        hanji: '#FBF9F5',
        ink: {
          black: '#1A1A1A',
          charcoal: '#2A2A2A',
          gray: '#666666',
          light: '#999999'
        },
        seal: {
          red: 'rgb(var(--sdh-accent, 139 37 0) / <alpha-value>)',    // 쇼핑몰 대표색 (관리자에서 바꿈, 관리자 화면은 기본값)
          crimson: 'rgb(var(--sdh-accent-2, 163 51 13) / <alpha-value>)',
          soft: 'rgb(var(--sdh-soft, 243 237 227) / <alpha-value>)',    // 보조색: 옅은 바탕
          stamp: '#8B2500'    // 도장·오류 글자: 언제나 붉은색
        }
      },
      fontFamily: {
        sans: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        serif: ['"Noto Serif KR"', 'serif'],
        brush: ['"Nanum Brush Script"', 'cursive']
      }
    }
  }
};
