(() => {
  // refs/read-understand-v4/word-renderer.ts
  var CARET_SLIDE_MS = {
    off: 0,
    slow: 150,
    medium: 100,
    fast: 85
  };
  function mountWords(container, words, opts = {}) {
    while (container.firstChild)
      container.removeChild(container.firstChild);
    const tape = opts.tape && opts.tape !== "off" ? opts.tape : null;
    const tapeMargin = opts.tapeMargin ?? 50;
    const flowScroll = !!opts.flowScroll && !tape;
    const wordsWrapper = document.createElement("div");
    wordsWrapper.className = tape ? "words-wrapper tape" : "words-wrapper";
    container.appendChild(wordsWrapper);
    const fragment = document.createDocumentFragment();
    const cells = new Array(words.length);
    const paraBreaks = !tape ? opts.paraBreaks : undefined;
    const headingWords = !tape ? opts.headingWords : undefined;
    let headingLine = null;
    for (let i = 0;i < words.length; i++) {
      const word = words[i] ?? "";
      const wordSpan = document.createElement("span");
      wordSpan.className = opts.learnWords?.has(i) ? "word word--learn" : "word";
      wordSpan.dataset.i = String(i);
      for (let c = 0;c < word.length; c++) {
        const chSpan = document.createElement("span");
        chSpan.className = "char";
        chSpan.textContent = word[c] ?? "";
        wordSpan.appendChild(chSpan);
      }
      if (paraBreaks?.has(i) && i > 0) {
        const brk = document.createElement("span");
        brk.className = "para-break";
        fragment.appendChild(brk);
        headingLine = null;
      }
      if (headingWords?.has(i)) {
        if (!headingLine) {
          headingLine = document.createElement("div");
          headingLine.className = "heading-line";
          fragment.appendChild(headingLine);
        }
        headingLine.appendChild(wordSpan);
      } else {
        headingLine = null;
        fragment.appendChild(wordSpan);
      }
      cells[i] = { word, span: wordSpan };
    }
    wordsWrapper.appendChild(fragment);
    const caret = document.createElement("span");
    caret.className = "caret";
    caret.style.opacity = "0";
    caret.style.setProperty("--caret-slide", `${CARET_SLIDE_MS[opts.smoothCaret ?? "medium"]}ms`);
    wordsWrapper.appendChild(caret);
    const paceCaret = document.createElement("span");
    paceCaret.className = "pace-caret";
    paceCaret.style.opacity = "0";
    wordsWrapper.appendChild(paceCaret);
    let firstCaretPlacement = true;
    let scrollOffsetPx = 0;
    let activeWordIdx = -1;
    let lastCharPos = 0;
    let visibilityMode = null;
    let memoryStarted = false;
    function applyVisibility(active) {
      if (!visibilityMode)
        return;
      for (let i = 0;i < cells.length; i++) {
        const span = cells[i]?.span;
        if (!span)
          continue;
        let hidden = false;
        if (visibilityMode === "plus_one")
          hidden = !(i === active || i === active + 1);
        else if (visibilityMode === "read_ahead")
          hidden = i === active;
        else if (visibilityMode === "memory")
          hidden = memoryStarted;
        span.classList.toggle("fb-hidden", hidden);
      }
    }
    function moveCaretTo(x, y, height) {
      if (firstCaretPlacement) {
        caret.style.transition = "none";
      }
      caret.style.height = `${height}px`;
      caret.style.transform = `translate(${x}px, ${y}px)`;
      caret.style.opacity = "1";
      if (firstCaretPlacement) {
        requestAnimationFrame(() => {
          caret.style.transition = "";
        });
        firstCaretPlacement = false;
      }
    }
    let cachedLineHeight = 0;
    function getLineHeightPx() {
      if (cachedLineHeight > 0)
        return cachedLineHeight;
      const firstSpan = cells[0]?.span;
      if (firstSpan) {
        const cs = window.getComputedStyle(firstSpan);
        const h = firstSpan.getBoundingClientRect().height;
        if (h > 0)
          return cachedLineHeight = h + parseFloat(cs.marginTop) + parseFloat(cs.marginBottom);
      }
      return parseFloat(window.getComputedStyle(container).fontSize) * 1.5;
    }
    function applyTapeScroll(wordIdx, charPos) {
      const cell = cells[wordIdx];
      if (!cell)
        return;
      let targetX = cell.span.offsetLeft;
      if (tape === "letter") {
        const children = cell.span.children;
        if (children.length > 0) {
          const idx = Math.min(charPos, children.length - 1);
          const el = children[idx];
          targetX = el.offsetLeft + (charPos >= children.length ? el.offsetWidth : 0);
        }
      }
      const marginPx = container.getBoundingClientRect().width * tapeMargin / 100;
      wordsWrapper.style.transform = `translateX(${marginPx - targetX}px)`;
    }
    function applyScrollFor(wordIdx) {
      const cell = cells[wordIdx];
      if (!cell)
        return;
      if (flowScroll) {
        const cr = container.getBoundingClientRect();
        const wr = cell.span.getBoundingClientRect();
        if (wr.bottom > cr.bottom - 8 || wr.top < cr.top + 8) {
          cell.span.scrollIntoView({ block: "center", behavior: "auto" });
        }
        return;
      }
      const wrapperRect = wordsWrapper.getBoundingClientRect();
      const wordRect = cell.span.getBoundingClientRect();
      const wordTopInWrapper = wordRect.top - wrapperRect.top;
      const lh = getLineHeightPx();
      let desired = wordTopInWrapper - lh;
      if (desired < 0)
        desired = 0;
      desired = Math.round(desired / lh) * lh;
      if (desired !== scrollOffsetPx) {
        scrollOffsetPx = desired;
        wordsWrapper.style.transform = `translateY(${-scrollOffsetPx}px)`;
      }
    }
    function buildChar(text, classes) {
      const el = document.createElement("span");
      el.className = classes;
      el.textContent = text;
      return el;
    }
    function repositionCaret() {
      if (activeWordIdx < 0)
        return;
      const prev = caret.style.transition;
      caret.style.transition = "none";
      view.setCaret(activeWordIdx, lastCharPos);
      requestAnimationFrame(() => {
        caret.style.transition = prev;
      });
    }
    const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(repositionCaret);
    resizeObserver?.observe(container);
    window.addEventListener("resize", repositionCaret);
    document.fonts?.addEventListener?.("loadingdone", repositionCaret);
    document.fonts?.ready.then(repositionCaret).catch(() => {});
    const view = {
      destroy() {
        resizeObserver?.disconnect();
        window.removeEventListener("resize", repositionCaret);
        document.fonts?.removeEventListener?.("loadingdone", repositionCaret);
        while (container.firstChild)
          container.removeChild(container.firstChild);
      },
      renderWord(wordIdx, input) {
        const cell = cells[wordIdx];
        if (!cell)
          return;
        const word = cell.word;
        while (cell.span.firstChild)
          cell.span.removeChild(cell.span.firstChild);
        const inputLen = input.length;
        const wordLen = word.length;
        for (let i = 0;i < inputLen; i++) {
          if (i < wordLen) {
            const correct = input[i] === word[i];
            cell.span.appendChild(buildChar(word[i] ?? "", correct ? "char correct" : "char incorrect"));
          } else {
            const ch = input[i] ?? "";
            cell.span.appendChild(buildChar(ch === " " ? "_" : ch, "char incorrect extra"));
          }
        }
        for (let i = inputLen;i < wordLen; i++) {
          cell.span.appendChild(buildChar(word[i] ?? "", "char"));
        }
      },
      setCaret(wordIdx, charPos) {
        const cell = cells[wordIdx];
        if (!cell)
          return;
        if (activeWordIdx !== wordIdx) {
          if (activeWordIdx >= 0)
            cells[activeWordIdx]?.span.classList.remove("active");
          cell.span.classList.add("active");
          activeWordIdx = wordIdx;
          applyVisibility(wordIdx);
        }
        lastCharPos = charPos;
        if (tape)
          applyTapeScroll(wordIdx, charPos);
        else
          applyScrollFor(wordIdx);
        const children = cell.span.children;
        const total = children.length;
        const wrapperRect = wordsWrapper.getBoundingClientRect();
        let x;
        let y;
        let h;
        if (total === 0) {
          const r = cell.span.getBoundingClientRect();
          x = r.left - wrapperRect.left;
          y = r.top - wrapperRect.top;
          h = r.height;
        } else if (charPos >= total) {
          const last = children[total - 1];
          const r = last.getBoundingClientRect();
          x = r.right - wrapperRect.left;
          y = r.top - wrapperRect.top;
          h = r.height;
        } else {
          const el = children[charPos];
          const r = el.getBoundingClientRect();
          x = r.left - wrapperRect.left;
          y = r.top - wrapperRect.top;
          h = r.height;
        }
        moveCaretTo(x, y, h);
      },
      clearCaret() {
        caret.style.opacity = "0";
      },
      setBlinking(on) {
        caret.classList.toggle("no-blink", !on);
      },
      markWordError(wordIdx, on) {
        const cell = cells[wordIdx];
        if (!cell)
          return;
        cell.span.classList.toggle("error", on);
      },
      markSkipped(wordIdx, on) {
        cells[wordIdx]?.span.classList.toggle("skipped", on);
      },
      setActiveWord(wordIdx) {
        if (activeWordIdx === wordIdx)
          return;
        if (activeWordIdx >= 0)
          cells[activeWordIdx]?.span.classList.remove("active");
        cells[wordIdx]?.span.classList.add("active");
        activeWordIdx = wordIdx;
      },
      setPaceCaret(wordIdx, charPos) {
        const cell = cells[wordIdx];
        if (!cell)
          return;
        const children = cell.span.children;
        const total = children.length;
        const wrapperRect = wordsWrapper.getBoundingClientRect();
        let x;
        let y;
        let h;
        if (total === 0 || charPos >= total) {
          const r = cell.span.getBoundingClientRect();
          x = charPos >= total && total > 0 ? children[total - 1].getBoundingClientRect().right - wrapperRect.left : r.left - wrapperRect.left;
          y = r.top - wrapperRect.top;
          h = r.height;
        } else {
          const el = children[charPos];
          const r = el.getBoundingClientRect();
          x = r.left - wrapperRect.left;
          y = r.top - wrapperRect.top;
          h = r.height;
        }
        paceCaret.style.height = `${h}px`;
        paceCaret.style.transform = `translate(${x}px, ${y}px)`;
        paceCaret.style.opacity = "1";
      },
      clearPaceCaret() {
        paceCaret.style.opacity = "0";
      },
      setVisibilityMode(mode) {
        visibilityMode = mode;
        memoryStarted = false;
        if (!mode)
          for (const c of cells)
            c.span.classList.remove("fb-hidden");
        else
          applyVisibility(activeWordIdx < 0 ? 0 : activeWordIdx);
      },
      setMemoryStarted() {
        memoryStarted = true;
        applyVisibility(activeWordIdx < 0 ? 0 : activeWordIdx);
      },
      shakeWord(wordIdx) {
        const cell = cells[wordIdx];
        if (!cell)
          return;
        cell.span.classList.remove("shake");
        cell.span.offsetWidth;
        cell.span.classList.add("shake");
        cell.span.addEventListener("animationend", () => cell.span.classList.remove("shake"), { once: true });
      },
      resetAll() {
        caret.style.opacity = "0";
        paceCaret.style.opacity = "0";
        firstCaretPlacement = true;
        scrollOffsetPx = 0;
        activeWordIdx = -1;
        memoryStarted = false;
        applyVisibility(0);
        if (tape)
          applyTapeScroll(0, 0);
        else if (!flowScroll)
          wordsWrapper.style.transform = "translateY(0px)";
        if (flowScroll)
          container.scrollTop = 0;
        for (const cell of cells) {
          cell.span.classList.remove("error", "skipped");
          while (cell.span.firstChild)
            cell.span.removeChild(cell.span.firstChild);
          for (let c = 0;c < cell.word.length; c++) {
            cell.span.appendChild(buildChar(cell.word[c] ?? "", "char"));
          }
        }
      },
      totalWords() {
        return cells.length;
      }
    };
    return view;
  }

  // refs/read-understand-v4/entry.ts
  window.mountWords = mountWords;
})();
