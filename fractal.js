const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 1000);
camera.position.z = 1;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const geometry = new THREE.PlaneGeometry(2, 2);
const material = new THREE.ShaderMaterial({
  uniforms: {
    zoom: { value: 1.0 },
    center: { value: new THREE.Vector2(0, 0) },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    uniform float zoom;
    uniform vec2 center;

    const int maxIter = 1000;
    const float escapeRadius = 4.0;

    vec3 colorize(float t) {
      vec3 color = vec3(0.5 * cos(6.28318 * (t + 0.0)) + 0.5, 0.5 * cos(6.28318 * (t + 0.33)) + 0.5, 0.5 * cos(6.28318 * (t + 0.67)) + 0.5);
      return vec3(1.0) - color;
    }

    void main() {
      vec2 uv = (vUv - 0.5) * 3.0;
      uv /= zoom;
      uv += center;

      vec2 c = uv;
      vec2 z = vec2(0.0);

      int i;
      for (i = 0; i < maxIter; i++) {
        float x = (z.x * z.x - z.y * z.y) + c.x;
        float y = (z.y * z.x + z.x * z.y) + c.y;
        z = vec2(x, y);
        if (dot(z, z) > escapeRadius) break;
      }

      float t = float(i) / float(maxIter);
      vec3 color = colorize(t);
      gl_FragColor = vec4(color, 1.0);
    }
  `,
});

const plane = new THREE.Mesh(geometry, material);
scene.add(plane);

renderer.render(scene, camera);

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', onWindowResize, false);

function onWheel(event) {
  event.preventDefault();

  // Calculate mouse position in normalized device coordinates (-1 to +1) for both components
  const mouse = new THREE.Vector2();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Calculate the corresponding position in the fractal
  const fractalPos = new THREE.Vector2();
  fractalPos.x = (mouse.x * 3.0) / material.uniforms.zoom.value + material.uniforms.center.value.x;
  fractalPos.y = (mouse.y * 3.0) / material.uniforms.zoom.value + material.uniforms.center.value.y;

  const delta = Math.sign(event.deltaY);
  const zoomFactor = delta < 0 ? 1.1 : 1 / 1.1;

  // Update the center based on the mouse pointer coordinates before updating the zoom value
  material.uniforms.center.value.x = (fractalPos.x * (zoomFactor - 1) + material.uniforms.center.value.x) / zoomFactor;
  material.uniforms.center.value.y = (fractalPos.y * (zoomFactor - 1) + material.uniforms.center.value.y) / zoomFactor;

  // Update the zoom value
  material.uniforms.zoom.value *= zoomFactor;
}





let isDragging = false;
let prevMousePos = new THREE.Vector2();

function onMouseDown(event) {
  isDragging = true;
  prevMousePos.x = event.clientX;
  prevMousePos.y = event.clientY;
}

function onMouseMove(event) {
  if (!isDragging) return;

  const deltaX = event.clientX - prevMousePos.x;
  const deltaY = event.clientY - prevMousePos.y;

  const fractalDelta = new THREE.Vector2(
    (-deltaX / window.innerWidth) * 6.0 / material.uniforms.zoom.value,
    (deltaY / window.innerHeight) * 6.0 / material.uniforms.zoom.value
  );

  material.uniforms.center.value.add(fractalDelta);

  prevMousePos.x = event.clientX;
  prevMousePos.y = event.clientY;
}

function onMouseUp() {
  isDragging = false;
}

renderer.domElement.addEventListener('mousedown', onMouseDown);
renderer.domElement.addEventListener('mousemove', onMouseMove);
renderer.domElement.addEventListener('mouseup', onMouseUp);
renderer.domElement.addEventListener('mouseleave', onMouseUp);
renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

animate();
