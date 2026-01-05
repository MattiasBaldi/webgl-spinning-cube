const createShader = (
  gl: WebGL2RenderingContext,
  source: string,
  type: number
) => {
  // Compiles either a shader of type gl.VERTEX_SHADER or gl.FRAGMENT_SHADER
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    throw new Error(`Could not compile Webgl Program ${info}`);
  }

  return shader;
};

const linkProgram = (
  gl: WebGL2RenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader
) => {
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    throw new Error(`Could not compile Webgl program. ${info}`);
  }

  return program;
};

const createWebGLProgram = (
  gl: WebGL2RenderingContext,
  vertexSource: string,
  fragmentSource: string
) => {
  const vertexShader = createShader(gl, vertexSource, gl.VERTEX_SHADER);
  const fragmentShader = createShader(gl, fragmentSource, gl.FRAGMENT_SHADER);
  return linkProgram(gl, vertexShader, fragmentShader);
};

class WebGLBox {
  canvas = document.getElementById("webgl");
  gl = this.canvas.getContext("webgl2");

  vertex = `
  attribute vec4 position;
  void main() {
   gl_Position = model * vec4(position, 1.0);
  }`;

  fragment = `
  precision mediump float;    // Required in WebGL fragment shaders
  uniform vec4 vColor;        // Use a uniform for the color
  void main() {
    gl_FragColor = vColor;    // Set the pixel color
  }`;

  webglProgram = createWebGLProgram(
    this.gl,

    this.vertex,

    this.fragment
  );

  positionLocation;
  colorLocaiton;
  constructor() {
    const gl = this.gl;

    // Setup a Webgl program
    gl.useProgram(this.webglProgram);

    // save the attribute and uniforms locations
    this.positionLocation = gl.getAttribLocation(this.webglProgram, "position");
    this.colorLocaiton = gl.getUniformLocation(this.webglProgram, "vColor");

    // Tell Webgl to test the depth when drawing, so if a square is behind another square it wont be drawn
    // Aka depth testing
    gl.enable(gl.DEPTH_TEST);
  }

  draw(settings) {
    const data = new Float32Array([
      // Triangle 1
      settings.left,
      settings.bottom,
      settings.depth,
      settings.w,
      settings.right,
      settings.bottom,
      settings.depth,
      settings.w,
      settings.left,
      settings.top,
      settings.depth,
      settings.w,

      // Triangle 2
      settings.left,
      settings.top,
      settings.depth,
      settings.w,
      settings.right,
      settings.bottom,
      settings.depth,
      settings.w,
      settings.right,
      settings.top,
      settings.depth,
      settings.w,
    ]);

    // Use WebGL to draw this onto the screen.

    // Performance Note: Creating a new array buffer for every draw call is slow.
    // This function is for illustration purposes only.

    const gl = this.gl;

    // Create a buffer and bind data
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

    // Setup the pointer to our attribute data (triangles)
    gl.enableVertexAttribArray(this.positionLocation);
    gl.vertexAttribPointer(this.positionLocation, 4, gl.FLOAT, false, 0, 0);

    // Color uniform will be shared across all triangles
    gl.uniform4fv(this.colorLocaiton, settings.color);

    // Draw thhe triagnles
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // locations
    this.locations.model = gl.getUniformLocation(this.webglProgram, "model");

    gl.uniformMatrix4fv(
      this.location.model,
      false,
      new Float32Array(this.transforms.model)
    );
  }
}

const box = new WebGLBox();

box.draw({
  top: 0.5, // y
  bottom: -0.5, // y
  left: -0.5, // x
  right: 0.5, // x
  w: 0.7, // w - enlarge this box

  depth: 0, // z
  color: [1, 0.4, 0.4, 1], // red
});

box.draw({
  top: 0.9, // y
  bottom: 0, // y
  left: -0.9, // x
  right: 0.9, // x
  w: 1.1, // w - shrink this box

  depth: 0.5, // z
  color: [0.4, 1, 0.4, 1], // green
});

box.draw({
  top: 1, // y
  bottom: -1, // y
  left: -1, // x
  right: 1, // x
  w: 1.5, // w - Bring this box into range

  depth: -1.5, // z
  color: [0.4, 0.4, 1, 1], // blue
});
