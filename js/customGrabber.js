window.customGrabber = {
  attach(el, editor) {
    const ctx = { listeners: [], last: null };
    const getPoint = (e) => {
      const r = el.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top, t: Date.now() };
    };
    const down = (e) => {
      if (e.button === 2) return;
      ctx.last = getPoint(e);
      if (editor.isErasing) editor.eraseStroke(ctx.last);
      else editor.pointerDown(ctx.last, e.pointerType, e.pointerId);
      e.preventDefault();
    };
    const move = (e) => {
      if (e.buttons !== 1 || !ctx.last) return;
      const p = getPoint(e);
      if ((p.x - ctx.last.x) ** 2 + (p.y - ctx.last.y) ** 2 > 36) {
        if (editor.isErasing) editor.eraseStroke(p);
        else {
          editor.pointerMove(p);
          editor.pointerUp(p);
          editor.pointerDown(p, e.pointerType, e.pointerId);
        }
        ctx.last = p;
      }
      e.preventDefault();
    };
    const up = (e) => {
      if (!editor.isErasing) editor.pointerUp(getPoint(e));
      ctx.last = null;
      e.preventDefault();
    };
    [
      ["pointerdown", down],
      ["pointermove", move],
      ["pointerup", up],
      ["pointerleave", up],
    ].forEach(([t, h]) => {
      el.addEventListener(t, h);
      ctx.listeners.push([t, h]);
    });
    return ctx;
  },
  detach(el, ctx) {
    ctx.listeners.forEach(([t, h]) => el.removeEventListener(t, h));
  },
};
