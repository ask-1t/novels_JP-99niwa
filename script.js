/*
  『九十九の庭』 表示用スクリプト
  - HTML内の text/plain 原稿を読み込む
  - 漢字《るび》を <ruby> に変換する
  - 縦書き / 横書きを切り替える
*/

(function () {
  "use strict";

  const STORAGE_KEY = "tsukumo-no-niwa-writing-mode";
  const reader = document.getElementById("reader");
  const source = document.getElementById("novel-source");
  const toggle = document.getElementById("toggle-writing-mode");
  const year = document.getElementById("copyright-year");

  if (!reader || !source || !toggle) {
    return;
  }

  if (year) {
    year.textContent = new Date().getFullYear();
  }

  function escapeHtml(text) {
    return text
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function convertRuby(escapedText) {
    return escapedText
      // 青空文庫風の明示指定: ｜親文字《るび》
      .replace(/｜([^《\n]+?)《([^》\n]+?)》/g, function (_, base, ruby) {
        return "<ruby>" + base + "<rt>" + ruby + "</rt></ruby>";
      })
      // 通常指定: 親文字《るび》
      // 親文字は、日本語の連続部分を対象にする。
      .replace(/([一-龯々〆ヶヵぁ-ゖァ-ヺー]+)《([^》\n]+?)》/g, function (_, base, ruby) {
        return "<ruby>" + base + "<rt>" + ruby + "</rt></ruby>";
      });
  }

  function blockToHtml(block, index) {
    const escaped = escapeHtml(block);
    const withRuby = convertRuby(escaped);
    const withBreaks = withRuby.replace(/\n/g, "<br>");

    if (index === 0 && block.trim().startsWith("『")) {
      return '<h2 class="novel-title">' + withBreaks + "</h2>";
    }

    if (block.trim() === "〈了〉") {
      return '<p class="novel-paragraph novel-end">' + withBreaks + "</p>";
    }

    return '<p class="novel-paragraph">' + withBreaks + "</p>";
  }

  function renderNovel() {
    const raw = source.textContent
      .replace(/^\n+|\n+$/g, "")
      // 全角スペースだけの行も、段落分け用の空行として扱う。
      .replace(/^[ \t　]+$/gm, "");
    const blocks = raw.split(/\n{2,}/);
    reader.innerHTML = blocks.map(blockToHtml).join("\n");
  }

  function setWritingMode(mode) {
    const isVertical = mode === "vertical";

    reader.classList.toggle("reader--vertical", isVertical);
    reader.classList.toggle("reader--horizontal", !isVertical);

    toggle.setAttribute("aria-pressed", String(isVertical));
    toggle.textContent = isVertical ? "横書きで読む" : "縦書きで読む";

    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch (_) {
      // localStorageを使えない環境では、保存せずに表示だけ切り替える。
    }
  }

  function getInitialMode() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "vertical" || saved === "horizontal") {
        return saved;
      }
    } catch (_) {
      // localStorageを使えない環境では、画面幅に応じて初期表示を決める。
    }

    // PCでは縦書き、スマホ幅では横書きを初期表示にする。
    return window.matchMedia("(min-width: 760px)").matches ? "vertical" : "horizontal";
  }

  renderNovel();
  setWritingMode(getInitialMode());

  toggle.addEventListener("click", function () {
    const nextMode = reader.classList.contains("reader--vertical") ? "horizontal" : "vertical";
    setWritingMode(nextMode);
  });
})();
