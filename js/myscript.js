document.addEventListener("DOMContentLoaded", () => {
  const editorEl = document.getElementById("editor");
  const resultEl = document.getElementById("resultArea");
  const eraserBtn = document.querySelector(".eraserForDraw");
  const clearBtn = document.querySelector(".cleanWorkArea");
  const themeBtn = document.getElementById("themeToggle");
  const joinSnd = document.getElementById("sndJoin");
  const answerSnd = document.getElementById("sndAnswer");
  let typingInt = null;
  joinSnd.volume = 0.4;
  answerSnd.volume = 0.15;
  const config = {
    recognitionParams: {
      type: "MATH",
      protocol: "WEBSOCKET",
      server: {
        scheme: "https",
        host: "cloud.myscript.com",
        applicationKey: "" /* <=your API key myscript */,
        hmacKey: "" /* <=your hmac key myscript */,
        websocket: { port: 443, path: "/websocket" },
      },
      math: {
        mimeTypes: ["application/x-latex"],
        eraser: { "erase-precisely": true },
      },
    },
  };
  (async () => {
    await window.iink.register(editorEl, config, { grabber: customGrabber });
    const editor = editorEl.editor;
    const applyPenColor = (dark) => {
      editor.penStyle = {
        color: dark ? "#ffffff" : "#000000",
        width: 2,
      };
    };
    async function recolorAllStrokes(color) {
      const exports = await editor.exportContent({
        mimeTypes: ["application/vnd.myscript.jiix"],
      });
      const jiix = exports["application/vnd.myscript.jiix"];
      const obj = JSON.parse(jiix);
      obj.units.forEach((unit) => {
        unit.strokeGroups?.forEach((group) => {
          group.penStyle.color = color;
        });
      });
      editor.clear();
      await editor.importContent({
        "application/vnd.myscript.jiix": JSON.stringify(obj),
      });
    }
    new ResizeObserver(() => editor.resize()).observe(editorEl);
    editorEl.addEventListener("exported", (evt) => {
      const latex = evt.detail.exports["application/x-latex"] || "";
      resultEl.textContent = latex ? "" : "—";
      if (latex) {
        window.katex.render(latex, resultEl, {
          throwOnError: false,
          displayMode: true,
        });
      }
    });
    const darkInit = localStorage.theme === "dark";
    if (darkInit) document.body.classList.add("dark");
    applyPenColor(darkInit);
    themeBtn.textContent = darkInit ? "☀︎" : "🌙";
    themeBtn.addEventListener("click", async () => {
      const dark = document.body.classList.toggle("dark");
      localStorage.theme = dark ? "dark" : "light";
      themeBtn.textContent = dark ? "☀︎" : "🌙";
      const newColor = dark ? "#ffffff" : "#000000";
      applyPenColor(dark);
      editor.theme(dark ? "dark" : "light");
      await recolorAllStrokes(newColor);
    });
    let erasing = false;
    eraserBtn.addEventListener("click", () => {
      erasing = !erasing;
      editor.isErasing = erasing;
      eraserBtn.classList.toggle("active", erasing);
    });
    clearBtn.addEventListener("click", () => {
      editor.clear();
    });
  })();
  const modal = document.getElementById("photoModal");
  const cpr = document.getElementById("copyright");
  cpr.addEventListener("click", () => modal.classList.add("show"));
  modal.addEventListener("click", () => modal.classList.remove("show"));
  const helpBtn = document.getElementById("helpToggle");
  const panel = document.getElementById("helpPanel");
  const bodyChat = document.getElementById("chatBody");
  const faqBox = document.getElementById("faqBtns");
  const agentBar = document.getElementById("agentBar");
  const btnClose = document.getElementById("chatClose");
  const closeChat = () => {
    panel.classList.remove("show");
    agentBar.style.display = "none";
    function resetChat() {
      agentBar.style.display = "none";
      bodyChat.innerHTML = '<p class="system">Вітаємо! Оберіть питання:</p>';
      faqBox.innerHTML = "";
      QA.forEach(({ q }, i) => {
        const b = document.createElement("button");
        b.textContent = q;
        b.onclick = () => handleQuestion(i);
        faqBox.appendChild(b);
      });
      if (typingInt) {
        clearInterval(typingInt);
        typingInt = null;
      }
      [joinSnd, answerSnd].forEach((s) => {
        s.pause();
        s.currentTime = 0;
        s.loop = false;
      });
    }
    btnClose.onclick = closeChat;
    function closeChat() {
      panel.classList.remove("show");
      resetChat();
    }
    if (typingInt) {
      clearInterval(typingInt);
      typingInt = null;
    }
    joinSnd.pause();
    joinSnd.currentTime = 0;
    answerSnd.pause();
    answerSnd.currentTime = 0;
    answerSnd.loop = false;
    bodyChat.innerHTML = `<p class="system">Вітаємо! Оберіть питання:</p>`;
    faqBox.innerHTML = "";
    QA.forEach(({ q }, i) => {
      const b = document.createElement("button");
      b.textContent = q;
      b.onclick = () => handleQuestion(i);
      faqBox.appendChild(b);
    });
  };
  helpBtn.onclick = () => {
    if (panel.classList.contains("show")) closeChat();
    else {
      resetChat();
      panel.classList.add("show");
    }
  };
  document.getElementById("chatClose").onclick = closeChat;
  helpBtn.onclick = () => panel.classList.toggle("show");
  const QA = [
    {
      q: "Як стерти з дошки неправильно написане?",
      a: "Натисніть «Олівець/Гумка», і проведіть по неправильно введеному символу.",
    },
    {
      q: "Чи працює без інтернету?",
      a: "Розпізнавання формул потребує з’єднання з сервером MyScript.",
    },
    {
      q: "Чи виводить сайт всі математичні знаки?",
      a: "Так, підтрмує усі математичні знаки та надає можливість скопіювати LaTeX-результат і вставити у свій документ.",
    },
  ];
  QA.forEach(({ q }, i) => {
    const b = document.createElement("button");
    b.textContent = q;
    b.onclick = () => handleQuestion(i);
    faqBox.appendChild(b);
  });
  function handleQuestion(idx) {
    const { q, a } = QA[idx];
    bodyChat.insertAdjacentHTML("beforeend", `<p class="user">${q}</p>`);
    faqBox.innerHTML = "";
    bodyChat.insertAdjacentHTML(
      "beforeend",
      `<p class="system">Підключаємось до оператора…</p>`
    );
    setTimeout(() => {
      joinSnd.currentTime = 0;
      joinSnd.play();
      agentBar.style.display = "flex";
      bodyChat.insertAdjacentHTML(
        "beforeend",
        `<p class="system">Олег приєднався ✅</p>
       <p class="system">Олег друкує<span class="dots">...</span></p>`
      );
      const dots = bodyChat.querySelector(".dots");
      let d = 0;
      typingInt = setInterval(() => {
        dots.textContent = ".".repeat(++d % 4);
      }, 400);
      answerSnd.loop = true;
      answerSnd.currentTime = 0;
      answerSnd.play();
      setTimeout(() => {
        clearInterval(typingInt);
        typingInt = null;
        answerSnd.loop = false;
        answerSnd.pause();
        answerSnd.currentTime = 0;
        bodyChat.insertAdjacentHTML(
          "beforeend",
          `<p class="operator">${a}</p>`
        );
        faqBox.innerHTML = "";
        QA.forEach(({ q }, i) => {
          const b = document.createElement("button");
          b.textContent = q;
          b.onclick = () => handleQuestion(i);
          faqBox.appendChild(b);
        });
        bodyChat.scrollTop = bodyChat.scrollHeight;
      }, 4500);
    }, 4000);
  }
});
