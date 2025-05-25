document.addEventListener("DOMContentLoaded", () => {
  const editorEl = document.getElementById("editor");
  const resultEl = document.getElementById("resultArea");
  const eraserBtn = document.querySelector(".eraserForDraw");
  const clearBtn = document.querySelector(".cleanWorkArea");

  const editor = window.iink.register(
    editorEl,
    {
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
          eraser: { "erase-precisely": true }, // потрібно для гумки
        },
      },
    },
    { grabber: customGrabber }
  );
  new ResizeObserver(() => editor.resize()).observe(editorEl);
  editorEl.addEventListener("exported", (evt) => {
    const latex = evt.detail.exports["application/x-latex"] || "";
    if (!latex) {
      resultEl.textContent = "—";
      return;
    }


    window.katex.render(latex, resultEl, {
      throwOnError: false,
      displayMode: true,
    });
  });

  let erasing = false;
  eraserBtn.addEventListener("click", () => {
    erasing = !erasing;
    editor.isErasing = erasing;
    eraserBtn.classList.toggle("active", erasing);
  });

  clearBtn.addEventListener("click", () => editor.clear());
});
const canvas = document.getElementById("workAreaCanvas");
const ctx = canvas.getContext("2d");

function fitCanvas() {
  const ratio = window.devicePixelRatio || 1;

  canvas.style.width = "100%";
  canvas.style.height = "";

  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * ratio;
  canvas.height = rect.height * ratio;

  ctx.scale(ratio, ratio);
}

window.addEventListener("resize", fitCanvas);
fitCanvas();
