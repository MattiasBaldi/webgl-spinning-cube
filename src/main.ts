import * as M from "./utils/math/utils.js";
import * as Utils from "./utils/utils.js";
import { gl as glContext, canvas } from "./gl.js";

// Define the data that is needed to make a 3d cube
function createCubeData() {
  // prettier-ignore
  const positions = [
    // Front face
    -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0,
    // Back face
    -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0,
    // Top face
    -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0,
    // Bottom face
    -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0,
    // Right face
    1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0,
    // Left face
    -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0,
  ];

  // prettier-ignore
  const colorsOfFaces: number[][] = [
    [0.3, 1.0, 1.0, 1.0],    // Front face: cyan
    [1.0, 0.3, 0.3, 1.0],    // Back face: red
    [0.3, 1.0, 0.3, 1.0],    // Top face: green
    [0.3, 0.3, 1.0, 1.0],    // Bottom face: blue
    [1.0, 1.0, 0.3, 1.0],    // Right face: yellow
    [1.0, 0.3, 1.0, 1.0]     // Left face: purple
  ];

  let colors: number[] = [];

  for (const polygonColor of colorsOfFaces) {
    for (let i = 0; i < 4; i++) {
      colors = colors.concat(polygonColor);
    }
  }

  // prettier-ignore
  const elements = [
    0,  1,  2,   0,  2,  3,    // front
    4,  5,  6,   4,  6,  7,    // back
    8,  9,  10,  8,  10, 11,   // top
    12, 13, 14,  12, 14, 15,   // bottom
    16, 17, 18,  16, 18, 19,   // right
    20, 21, 22,  20, 22, 23,   // left
  ];

  return { positions, elements, colors };
}

// Take the data for a cube and bind the buffers for it.
// Return an object collection of the buffers
const createBuffersForCube = (gl: WebGL2RenderingContext, cube: ReturnType<typeof createCubeData>) => {
  const positions = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positions);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(cube.positions),
    gl.STATIC_DRAW
  );

  const colors = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colors);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cube.colors), gl.STATIC_DRAW);

  const elements = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elements);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(cube.elements),
    gl.STATIC_DRAW
  );

  return { positions, elements, colors };
};

class WebGLBox {
  canvas: HTMLCanvasElement = canvas;
  gl: WebGL2RenderingContext = glContext;

  vertex = `
  // Each point has a position and color
  attribute vec3 position;
  attribute vec4 color;

  // The transformation matrix
  uniform mat4 model;
  uniform mat4 projection;
  uniform mat4 view;

  // Pass the color attribute down to the fragment shader
  varying vec4 vColor;

  void main() {
    // Pass the color down to the fragment shader
   
    vColor = color;
  
    gl_Position = projection * view * model * vec4(position, 1.0);

  }`;

  fragment = `
   precision mediump float;
  varying vec4 vColor;

  void main() {
    gl_FragColor = vColor;
  }`;

  webglProgram = Utils.createWebGLProgram(
    this.gl,

    this.vertex,

    this.fragment
  );

  transforms!: { model: number[]; projection: number[]; view: number[] };
  locations!: { position: number; color: number; model: WebGLUniformLocation | null; projection: WebGLUniformLocation | null; view: WebGLUniformLocation | null };
  buffers!: ReturnType<typeof createBuffersForCube>;

  constructor() {
    const gl = this.gl;

    // Setup a Webgl program
    gl.useProgram(this.webglProgram);
    this.buffers = createBuffersForCube(gl, createCubeData());

    // save the attribute and uniforms locations
    this.locations.position = gl.getAttribLocation(
      this.webglProgram,
      "position"
    );

    this.locations.color = gl.getAttribLocation(this.webglProgram, "color");

    this.locations.model = gl.getUniformLocation(this.webglProgram, "model");
    this.locations.projection = gl.getUniformLocation(
      this.webglProgram,
      "projection"
    );

    this.locations.view = gl.getUniformLocation(this.webglProgram, "view");

    // Tell Webgl to test the depth when drawing, so if a square is behind another square it wont be drawn
    // Aka depth testing
    gl.enable(gl.DEPTH_TEST);
  }

  computeModelMatrix(now: number) {
    const time = now;
    // Scale down by 20%
    const scaleMatrix = M.scale(5, 5, 5);
    // Rotate a slight tilt
    const rotateXMatrix = M.rotateX(time * 0.0003);
    // Rotate according to time
    const rotateYMatrix = M.rotateY(time * 0.0005);
    // Move slightly down
    const translateMatrix = M.translate(0, 0, 0);
    // Multiply together, make sure and read them in opposite order
    this.transforms.model = M.multiplyArrayOfMatrices([
      translateMatrix, // step 4
      rotateYMatrix, // step 3
      rotateXMatrix, // step 2
      scaleMatrix, // step 1
    ]);

    // Performance caveat: in real production code it's best not to create
    // new arrays and objects in a loop. This example chooses code clarity
    // over performance.
  }

  computeSimpleProjectionMatrix(scaleFactor: number) {
    //prettier-ignore
    this.transforms.projection = [
      1, 0, 0, 0, 
      0, 1, 0, 0, 
      0, 0, 1, scaleFactor, 
      0, 0, 0, scaleFactor
    ]
  }

  computePerspectiveMatrix() {
    const fieldOfViewInRadians = Math.PI * 0.5;
    const aspectRatio = window.innerWidth / window.innerHeight;
    const nearClippingPlaneDistance = 1;
    const farClipingPlaneDistance = 50;

    this.transforms.projection = M.perspective(
      fieldOfViewInRadians,
      aspectRatio,
      nearClippingPlaneDistance,
      farClipingPlaneDistance
    );
  }

  computeViewMatrix(now: number) {
    const time = now * 0.001;
    const radius = 40;

    const eye = [
      Math.cos(time * 2) * radius,
      Math.sin(time * 2) * 10,
      Math.sin(time * 2) * radius,
    ];

    const target = [0, 0, 0];
    const up = [0, 1, 0];

    this.transforms.view = M.lookAt(eye, target, up);
  }

  draw() {
    const gl = this.gl;
    const now = Date.now();

    // Compute our matrices
    this.computeModelMatrix(now);
    this.computePerspectiveMatrix();
    this.computeViewMatrix(now);

    // this.computeSimpleProjectionMatrix(0.5);
    // Update the data going to the GPU
    // Setup the color uniform that will be shared across all triangles
    gl.uniformMatrix4fv(
      this.locations.model,
      false,
      new Float32Array(this.transforms.model)
    );

    gl.uniformMatrix4fv(
      this.locations.view,
      false,
      new Float32Array(this.transforms.view)
    );

    // projection
    gl.uniformMatrix4fv(
      this.locations.projection,
      false,
      new Float32Array(this.transforms.projection)
    );

    // Set the positions attribute
    gl.enableVertexAttribArray(this.locations.position);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.positions);
    gl.vertexAttribPointer(this.locations.position, 3, gl.FLOAT, false, 0, 0);

    // Set the colors attribute
    gl.enableVertexAttribArray(this.locations.color);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.colors);
    gl.vertexAttribPointer(this.locations.color, 4, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.elements);
    // Perform the actual draw
    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
    // Run the draw as a loop
    requestAnimationFrame(() => this.draw());
  }
}

const cube = new WebGLBox();
cube.draw();
