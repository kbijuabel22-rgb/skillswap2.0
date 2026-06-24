(function() {
    // 1. Add Canvas element if not exists
    let canvas = document.getElementById('webgl-bg');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'webgl-bg';
        canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:-50;pointer-events:none;display:block;';
        document.body.insertBefore(canvas, document.body.firstChild);
    }

    // 2. Add a semi-transparent dark overlay so text stays readable
    let overlay = document.getElementById('webgl-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'webgl-overlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:-49;pointer-events:none;background:rgba(8,6,18,0.82);';
        document.body.insertBefore(overlay, canvas.nextSibling);
    }

    // 3. Vertex & Fragment shaders — dark, subtle animated wave lines
    const vertexShader = `
      attribute vec3 position;
      void main() {
        gl_Position = vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      precision highp float;
      uniform vec2 resolution;
      uniform float time;
      uniform float xScale;
      uniform float yScale;
      uniform float distortion;

      void main() {
        vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);
        
        float d = length(p) * distortion;
        
        float rx = p.x * (1.0 + d);
        float gx = p.x;
        float bx = p.x * (1.0 - d);

        // Reduce brightness significantly (0.008 instead of 0.05)
        float r = 0.008 / abs(p.y + sin((rx + time) * xScale) * yScale);
        float g = 0.008 / abs(p.y + sin((gx + time) * xScale) * yScale);
        float b = 0.015 / abs(p.y + sin((bx + time) * xScale) * yScale);
        
        // Clamp to stay dark — indigo/cyan tones
        r = min(r, 0.25);
        g = min(g, 0.18);
        b = min(b, 0.45);
        
        gl_FragColor = vec4(r, g, b, 1.0);
      }
    `;

    let scene, camera, renderer, mesh, uniforms, animationId;

    function initScene() {
      scene = new THREE.Scene();
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(new THREE.Color(0x06040f)); // Very dark purple-black

      camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, -1);

      uniforms = {
        resolution: { value: [window.innerWidth, window.innerHeight] },
        time: { value: 0.0 },
        xScale: { value: 1.2 },
        yScale: { value: 0.4 },
        distortion: { value: 0.08 },
      };

      const position = [
        -1.0, -1.0, 0.0,
         1.0, -1.0, 0.0,
        -1.0,  1.0, 0.0,
         1.0, -1.0, 0.0,
        -1.0,  1.0, 0.0,
         1.0,  1.0, 0.0,
      ];

      const positions = new THREE.BufferAttribute(new Float32Array(position), 3);
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", positions);

      const material = new THREE.RawShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: uniforms,
        side: THREE.DoubleSide,
      });

      mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      handleResize();
    }

    function animate() {
      if (uniforms) uniforms.time.value += 0.006; // Slower, more subtle
      if (renderer && scene && camera) {
        renderer.render(scene, camera);
      }
      animationId = requestAnimationFrame(animate);
    }

    function handleResize() {
      if (!renderer || !uniforms) return;
      const width = window.innerWidth;
      const height = window.innerHeight;
      renderer.setSize(width, height, false);
      uniforms.resolution.value = [width, height];
    }

    function checkThree() {
      if (typeof THREE !== 'undefined') {
        initScene();
        animate();
        window.addEventListener("resize", handleResize);
      } else {
        setTimeout(checkThree, 50);
      }
    }
    
    checkThree();
})();
