document.addEventListener("DOMContentLoaded", () => {
    let canvas = document.querySelector(".workAreaCanvas");
    let ctx = canvas.getContext("2d");

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    let isDrawing = false;
    let currentTool = "pen";

    ctx.lineWidth = 1;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000";


    const getMousePos = (e) => {
        const rect = canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };
    };

    const getTouchPos = (e) => {
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        return {
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top,
        };
    };

    // === Малювання ===
    const startDraw = (x, y) => {
        isDrawing = true;
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const draw = (x, y) => {
        if (!isDrawing) return;
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDraw = () => {
        isDrawing = false;
    };

    // === Події ===
    canvas.addEventListener("mousedown", (e) => {
        const pos = getMousePos(e);
        startDraw(pos.x, pos.y);
    });

    canvas.addEventListener("mousemove", (e) => {
        const pos = getMousePos(e);
        draw(pos.x, pos.y);
    });

    canvas.addEventListener("mouseup", stopDraw);
    canvas.addEventListener("mouseleave", stopDraw);

    canvas.addEventListener("touchstart", (e) => {
        e.preventDefault();
        const pos = getTouchPos(e);
        startDraw(pos.x, pos.y);
    });

    canvas.addEventListener("touchmove", (e) => {
        e.preventDefault();
        const pos = getTouchPos(e);
        draw(pos.x, pos.y);
    });

    canvas.addEventListener("touchend", stopDraw);

    // === Інструменти ===
    const penBtn = document.querySelector(".penForDraw");
    const eraserBtn = document.querySelector(".eraserForDraw");
    const clearBtn = document.querySelector(".cleanWorkArea");

    penBtn.addEventListener("click", () => {
        currentTool = "pen";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1;
    });

    eraserBtn.addEventListener("click", () => {
        currentTool = "eraser";
        ctx.strokeStyle = "#f9f9f9";
        ctx.lineWidth = 20;
    });

    clearBtn.addEventListener("click", () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
});