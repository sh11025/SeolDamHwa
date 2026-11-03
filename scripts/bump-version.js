#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const FILES = ['index.html', 'admin-index.html'];

function main() {
  const customArg = process.argv[2];
  let explicitVersion = null;
  if (customArg && /^\d+$/.test(customArg.trim())) {
    explicitVersion = parseInt(customArg.trim(), 10);
  }

  // 1. 현재 파일들에서 존재하는 버전 탐색
  let maxFound = null;
  const fileContents = {};

  FILES.forEach(file => {
    const fullPath = path.join(ROOT, file);
    const text = fs.readFileSync(fullPath, 'utf8');
    fileContents[file] = text;

    const regex = /(?:src|href)=["'](assets\/(?:css|js)\/[^"'?]+)(?:\?v=(\d+))?["']/gi;
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (match[2]) {
        const v = parseInt(match[2], 10);
        if (maxFound === null || v > maxFound) {
          maxFound = v;
        }
      }
    }
  });

  const nextVersion = explicitVersion !== null
    ? explicitVersion
    : (maxFound !== null ? maxFound + 1 : 66);

  // 2. 파일 내용 치환 (로컬 CSS / JS 링크 및 스크립트 태그만 대상)
  FILES.forEach(file => {
    const fullPath = path.join(ROOT, file);
    let text = fileContents[file];

    // link rel="stylesheet" href="assets/..." 및 script src="assets/..."
    // (favicon 등 이미지 href는 제외하고 assets/css/, assets/js/ 또는 <script>/<link rel="stylesheet"> 한정)
    text = text.replace(
      /(<link\b[^>]*\brel=["']stylesheet["'][^>]*\bhref=["'])(assets\/[^"'?]+)(?:\?v=\d+)?(["'][^>]*>)/gi,
      `$1$2?v=${nextVersion}$3`
    );

    // rel 속성이 href 뒤에 오는 link 태그도 지원
    text = text.replace(
      /(<link\b[^>]*\bhref=["'])(assets\/[^"'?]+)(?:\?v=\d+)?(["'][^>]*\brel=["']stylesheet["'][^>]*>)/gi,
      `$1$2?v=${nextVersion}$3`
    );

    // script src="assets/..."
    text = text.replace(
      /(<script\b[^>]*\bsrc=["'])(assets\/[^"'?]+)(?:\?v=\d+)?(["'][^>]*>)/gi,
      `$1$2?v=${nextVersion}$3`
    );

    fs.writeFileSync(fullPath, text, 'utf8');
  });

  console.log(nextVersion);
}

main();

