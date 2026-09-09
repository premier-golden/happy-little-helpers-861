import { readFile, writeFile } from "node:fs/promises";

const jsPath = new URL("../public/pressel/js/main.js", import.meta.url);
const cssPath = new URL("../public/pressel/css/style.css", import.meta.url);

async function patchJs() {
  let js = await readFile(jsPath, "utf8");

  const oldLock = `    // Captura a posição atual do scroll APENAS se ainda não estiver travado\n    if (!document.body.classList.contains("modal-open")) {\n      const scrollY = window.scrollY;\n      document.body.style.position = "fixed";\n      document.body.style.top = \`-\${scrollY}px\`;\n      document.body.style.width = "100%";\n\n      document.body.classList.add("modal-open");\n      document.documentElement.classList.add("modal-open");\n    }`;

  const newLock = `    // O popup inicial de recompensa (#two) não deve travar o scroll da página.\n    // Os demais modais continuam bloqueando o fundo normalmente.\n    if (id !== "two" && !document.body.classList.contains("modal-open")) {\n      const scrollY = window.scrollY;\n      document.body.style.position = "fixed";\n      document.body.style.top = \`-\${scrollY}px\`;\n      document.body.style.width = "100%";\n\n      document.body.classList.add("modal-open");\n      document.documentElement.classList.add("modal-open");\n    }`;

  if (js.includes(oldLock)) js = js.replace(oldLock, newLock);

  const oldComplete = `    if (id === "two") {\n      document.body.classList.add("reward-complete");\n      const stickyPopup = document.getElementById("popup-um");`;

  const newComplete = `    if (id === "two") {\n      // Defesa extra para Safari/TikTok in-app: remove qualquer trava residual.\n      document.body.style.position = "";\n      document.body.style.top = "";\n      document.body.style.width = "";\n      document.body.style.overflowY = "";\n      document.body.classList.remove("modal-open");\n      document.documentElement.classList.remove("modal-open");\n      document.body.classList.add("reward-complete");\n      const stickyPopup = document.getElementById("popup-um");`;

  if (js.includes(oldComplete)) js = js.replace(oldComplete, newComplete);

  await writeFile(jsPath, js, "utf8");
}

async function patchCss() {
  let css = await readFile(cssPath, "utf8");
  const marker = "/* === reward-scroll-fix === */";

  if (!css.includes(marker)) {
    css += `\n\n${marker}\nhtml, body {\n  overflow-y: auto !important;\n  height: auto !important;\n  min-height: 100%;\n  overscroll-behavior-y: auto;\n}\n\nbody.reward-complete {\n  position: static !important;\n  top: auto !important;\n  width: 100% !important;\n  overflow-y: auto !important;\n}\n\n#screens {\n  overflow: visible !important;\n}\n\n/* O popup de prêmio fica por cima, mas não transforma a página em uma tela fixa. */\n#two.screen.is-modal {\n  touch-action: pan-y;\n}\n`;
  }

  await writeFile(cssPath, css, "utf8");
}

await Promise.all([patchJs(), patchCss()]);
console.log("pressel reward scroll fix applied");
