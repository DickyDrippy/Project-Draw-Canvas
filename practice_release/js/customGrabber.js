window.customGrabber = {
  attach(element, editor) {
    const ctx = { listeners: [] };

    const down = (evt) => {
      if (evt.button === 2) return;
      const pointerId = evt.pointerId > 2147483647 ? -1 : evt.pointerId;
      const point = getPoint(evt, element, editor);
      const pType = editor.isErasing ? "ERASER" : evt.pointerType;
      editor.pointerDown(point, pType, pointerId);
      evt.preventDefault();
    };

    const move = (evt) => {
      editor.pointerMove(getPoint(evt, element, editor));
      evt.preventDefault();
    };

    const up = (evt) => {
      editor.pointerUp(getPoint(evt, element));
      evt.preventDefault();
    };

    [
      ["pointerdown", down],
      ["pointermove", move],
      ["pointerup", up],
      ["pointerleave", up],
    ].forEach(([t, h]) => {
      element.addEventListener(t, h);
      ctx.listeners.push([t, h]);
    });
    return ctx;
  },

  detach(element, ctx) {
    ctx.listeners.forEach(([t, h]) => element.removeEventListener(t, h));
  },
};

function getPoint(evt, el, editor) {
  const r = el.getBoundingClientRect();
  return { x: evt.clientX - r.left, y: evt.clientY - r.top, t: Date.now() };
}
