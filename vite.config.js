import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

/* index.html의 <!-- @include 경로 --> 를 해당 파일 내용으로 치환 (개발 서버·빌드 공통) */
const INCLUDE_RE = /<!--\s*@include\s+([\w\-./]+)\s*-->/g;

function htmlIncludes() {
  const expand = (html, depth = 0) => {
    if (depth > 5) throw new Error('@include 중첩이 너무 깊습니다.');
    return html.replace(INCLUDE_RE, (_, file) =>
      expand(fs.readFileSync(path.resolve(process.cwd(), file), 'utf8'), depth + 1));
  };
  return {
    name: 'html-includes',
    transformIndexHtml: { order: 'pre', handler: html => expand(html) },
    handleHotUpdate({ file, server }) {
      if (file.includes(`${path.sep}partials${path.sep}`)) {
        server.ws.send({ type: 'full-reload' });
        return [];
      }
    }
  };
}

/* 웹폰트(한글 @fontsource, 아이콘 Font Awesome)에서 구형 woff/ttf 대체 파일을 빼고 woff2만 사용 */
function woff2Only() {
  return {
    name: 'woff2-only',
    enforce: 'pre',
    transform(code, id) {
      if (id.includes('@fontsource') && id.endsWith('.css')) {
        return code.replace(/,\s*url\([^)]+\.woff\)\s*format\('woff'\)/g, '');
      }
      if (id.includes('@fortawesome') && id.endsWith('.css')) {
        return code.replace(/,\s*url\([^)]+\.ttf\)\s*format\("truetype"\)/g, '');
      }
    }
  };
}

export default defineConfig({
  base: './',            // GitHub Pages 하위 경로 등 어디에 올려도 동작하도록 상대 경로
  plugins: [htmlIncludes(), woff2Only()],
  build: { outDir: 'dist' }
});
