const canvas = document.getElementById("webgl") as HTMLCanvasElement;
const gl = canvas.getContext("webgl2") as WebGL2RenderingContext;

// resizing
const setSize = () => {
  const pixelRatio = window.devicePixelRatio;
  const height = window.innerHeight * pixelRatio;
  const width = window.innerWidth * pixelRatio;

  canvas.width = width;
  canvas.height = height;
  canvas.style.width = `${width}`;
  canvas.style.height = `${height}`;

  gl.viewport(0, 0, width, height);
};
setSize();
window.addEventListener("resize", () => {
  setSize();
});

export { canvas, gl, setSize };
