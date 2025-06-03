document.addEventListener("DOMContentLoaded", () => {
  const editorEl = document.getElementById("editor");
  const katexBox = document.getElementById("katexBox");
  const latexBox = document.getElementById("latexBox");
  const eraserBtn = document.querySelector(".eraserForDraw");
  const clearBtn = document.querySelector(".cleanWorkArea");
  const themeBtn = document.getElementById("themeToggle");
  const btnShotK = document.getElementById("shotKatex");
  const btnShotL = document.getElementById("shotLatex");
  let connected = false;
  let connTimeout = null;
  let typeTimeout = null;
  const joinSnd = document.getElementById("sndJoin");
  joinSnd.volume = 0.4;
  const answSnd = document.getElementById("sndAnswer");
  answSnd.volume = 0.12;
  const config = {
    recognitionParams: {
      type: "MATH",
      protocol: "WEBSOCKET",
      server: {
        scheme: "https",
        host: "cloud.myscript.com",
        applicationKey: "433f522f-816d-4a50-a759-3a08dadb44b3",
        hmacKey: "31ce930e-ab67-48cd-8b91-9b35d64739d2",
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
    const setColor = (dark) =>
      (editor.penStyle = { color: dark ? "#fff" : "#000", width: 2 });
    const darkInit = localStorage.theme === "dark";
    if (darkInit) document.body.classList.add("dark");
    setColor(darkInit);
    themeBtn.textContent = darkInit ? "☀︎" : "🌙";
    themeBtn.onclick = async () => {
      const dark = document.body.classList.toggle("dark");
      localStorage.theme = dark ? "dark" : "light";
      themeBtn.textContent = dark ? "☀︎" : "🌙";
      setColor(dark);
    };
    editorEl.addEventListener("exported", (evt) => {
      const latex = evt.detail.exports["application/x-latex"] || "";
      katexBox.innerHTML = latex ? "" : "—";
      latexBox.textContent = latex || "—";
      if (latex) {
        window.katex.render(latex, katexBox, {
          throwOnError: false,
          displayMode: true,
        });
      }
    });
    let erasing = false;
    eraserBtn.onclick = () => {
      erasing = !erasing;
      editor.isErasing = erasing;
      eraserBtn.classList.toggle("active", erasing);
    };
    clearBtn.onclick = () => editor.clear();
    new ResizeObserver(() => editor.resize()).observe(editorEl);
  })();
  function savePng(node, name) {
    html2canvas(node, { backgroundColor: null, scale: 2 }).then((cv) => {
      const a = document.createElement("a");
      a.download = name + ".png";
      a.href = cv.toDataURL("image/png");
      a.click();
    });
  }
  btnShotK.onclick = () => savePng(katexBox, "formula");
  btnShotL.onclick = () => savePng(latexBox, "latex");
  const modal = document.getElementById("photoModal");
  document.getElementById("copyright").onclick = () =>
    modal.classList.add("show");
  modal.onclick = () => modal.classList.remove("show");
  const helpBtn = document.getElementById("helpToggle");
  const panel = document.getElementById("helpPanel");
  const body = document.getElementById("chatBody");
  const faqBox = document.getElementById("faqBtns");
  const agent = document.getElementById("agentBar");
  const btnX = document.getElementById("chatClose");
  const QA = [
    {
      q: "Як стерти неправильний символ?",
      a: "Натисніть «Гумка/Олівець» і проведіть по ньому.",
    },
    {
      q: "Чи працює без інтернету?",
      a: "Ні. Розпізнавання відбувається на сервері MyScript.",
    },
    {
      q: "Як зберегти формулу у LaTeX?",
      a: "Скопіюйте готовий код під полотном.",
    },
  ];
  let typingInt = null;
  let connectInt = null;
  function renderFAQ() {
    const box = document.getElementById("faqBtns");
    box.innerHTML = "";
    QA.forEach(({ q }, i) => {
      const b = document.createElement("button");
      b.textContent = q;
      b.onclick = () => ask(i);
      box.appendChild(b);
    });
  }
  resetChat();
  function resetChat() {
    connected = false;
    agent.style.display = "none";
    agent.style.display = "none";
    body.innerHTML =
      '<p class="system">Вітаємо! Оберіть питання:</p>' +
      '<div id="faqBtns" class="faq"></div>';
    renderFAQ();
    [joinSnd, answSnd].forEach((s) => {
      s.pause();
      s.currentTime = 0;
      s.loop = false;
      [connTimeout, typeTimeout].forEach((id) => {
        if (id) {
          clearTimeout(id);
        }
      });
      connTimeout = typeTimeout = null;
      [joinSnd, answSnd].forEach((s) => {
        s.pause();
        s.currentTime = 0;
        s.loop = false;
      });
    });
  }
  const closeChat = () => {
    panel.classList.remove("show");
    resetChat();
  };
  btnX.onclick = closeChat;
  helpBtn.onclick = () => {
    if (panel.classList.contains("show")) {
      panel.classList.remove("show");
      resetChat();
    } else {
      panel.classList.add("show");
    }
  };
  function ask(i) {
    [".connect", ".typing"].forEach((sel) => {
      const old = body.querySelector(sel);
      if (old) old.remove();
    });
    [connectInt, typingInt].forEach((id) => {
      if (id) {
        clearInterval(id);
      }
    });
    connectInt = typingInt = null;
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    const { q, a } = QA[i];
    body.insertAdjacentHTML("beforeend", `<p class="user">${q}</p>`);
    document.getElementById("faqBtns").innerHTML = "";
    if (!connected) {
      body.insertAdjacentHTML(
        "beforeend",
        `<p class="system connect">Підключення<span class="dots">...</span></p>`
      );
      const connDots = body.querySelector(".connect .dots");
      let d = 0;
      connectInt = setInterval(
        () => (connDots.textContent = ".".repeat(++d % 4)),
        400
      );
    }
    const startDelay = connected ? 0 : 3500;
    connTimeout = setTimeout(() => {
      if (!connected) {
        if (connectInt) {
          clearInterval(connectInt);
          connectInt = null;
        }
        joinSnd.play();
        agent.style.display = "flex";
        body.querySelector(".connect").remove();
        body.insertAdjacentHTML(
          "beforeend",
          `<p class="system">Олег приєднався ✅</p>`
        );
        connected = true;
      }
      body.insertAdjacentHTML(
        "beforeend",
        `<p class="system typing">Олег друкує<span class="dots">...</span></p>`
      );
      const typeDots = body.querySelector(".typing .dots");
      let t = 0;
      typingInt = setInterval(
        () => (typeDots.textContent = ".".repeat(++t % 4)),
        400
      );
      document.getElementById("faqBtns").innerHTML = "";
      answSnd.loop = true;
      answSnd.play();
      typeTimeout = setTimeout(() => {
        clearInterval(typingInt);
        typingInt = null;
        answSnd.loop = false;
        answSnd.pause();
        answSnd.currentTime = 0;
        body.querySelector(".typing").remove();
        body.insertAdjacentHTML(
          "beforeend",
          `<p class="operator">${QA[i].a}</p>`
        );
        renderFAQ();
        body.scrollTop = body.scrollHeight;
      }, 2500);
    }, startDelay);
  }
});
