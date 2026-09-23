/**
 * ============================================================================
 * HOVERCRAFT: TAKEDOWN 3D
 * Jogo Completo de Combate Veicular Voxel em WebGL Nativo & JavaScript Puro
 * Sem bibliotecas externas (Three.js, Babylon.js, etc.)
 * ============================================================================
 */

'use strict';

/* ============================================================================
   1. MATEMÁTICA 3D (VETORES, MATRIZES 4x4 E UTILITÁRIOS)
   ============================================================================ */

const Math3D = {
  // Cria matriz identidade 4x4
  createMat4() {
    const out = new Float32Array(16);
    out[0] = 1; out[5] = 1; out[10] = 1; out[15] = 1;
    return out;
  },

  // Matriz de projeção perspectiva
  perspective(out, fovyRad, aspect, near, far) {
    const f = 1.0 / Math.tan(fovyRad / 2);
    const nf = 1 / (near - far);
    out.fill(0);
    out[0] = f / aspect;
    out[5] = f;
    out[10] = (far + near) * nf;
    out[11] = -1;
    out[14] = (2 * far * near) * nf;
    return out;
  },

  // Matriz de Câmera LookAt
  lookAt(out, eye, center, up) {
    let x0, x1, x2, y0, y1, y2, z0, z1, z2, len;
    let eyex = eye[0], eyey = eye[1], eyez = eye[2];
    let upx = up[0], upy = up[1], upz = up[2];
    let centerx = center[0], centery = center[1], centerz = center[2];

    z0 = eyex - centerx;
    z1 = eyey - centery;
    z2 = eyez - centerz;
    len = 1 / Math.hypot(z0, z1, z2);
    z0 *= len; z1 *= len; z2 *= len;

    x0 = upy * z2 - upz * z1;
    x1 = upz * z0 - upx * z2;
    x2 = upx * z1 - upy * z0;
    len = Math.hypot(x0, x1, x2);
    if (!len) {
      x0 = 0; x1 = 0; x2 = 0;
    } else {
      len = 1 / len;
      x0 *= len; x1 *= len; x2 *= len;
    }

    y0 = z1 * x2 - z2 * x1;
    y1 = z2 * x0 - z0 * x2;
    y2 = z0 * x1 - z1 * x0;
    len = Math.hypot(y0, y1, y2);
    if (!len) {
      y0 = 0; y1 = 0; y2 = 0;
    } else {
      len = 1 / len;
      y0 *= len; y1 *= len; y2 *= len;
    }

    out[0] = x0; out[1] = y0; out[2] = z0; out[3] = 0;
    out[4] = x1; out[5] = y1; out[6] = z1; out[7] = 0;
    out[8] = x2; out[9] = y2; out[10] = z2; out[11] = 0;
    out[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
    out[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
    out[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
    out[15] = 1;
    return out;
  },

  // Multiplicação de matrizes 4x4: out = a * b
  multiplyMat4(out, a, b) {
    const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
    const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
    const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
    const a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

    let b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
    out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

    b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7];
    out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

    b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11];
    out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

    b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15];
    out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    return out;
  },

  // Translação de matriz
  translateMat4(out, a, v) {
    const x = v[0], y = v[1], z = v[2];
    if (a === out) {
      out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
      out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
      out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
      out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
    } else {
      out.set(a);
      this.translateMat4(out, out, v);
    }
    return out;
  },

  // Rotação Y
  rotateY(out, a, rad) {
    const s = Math.sin(rad), c = Math.cos(rad);
    const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
    const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
    if (a !== out) out.set(a);
    out[0] = c * a00 - s * a20;
    out[1] = c * a01 - s * a21;
    out[2] = c * a02 - s * a22;
    out[3] = c * a03 - s * a23;
    out[8] = s * a00 + c * a20;
    out[9] = s * a01 + c * a21;
    out[10] = s * a02 + c * a22;
    out[11] = s * a03 + c * a23;
    return out;
  },

  // Rotação X
  rotateX(out, a, rad) {
    const s = Math.sin(rad), c = Math.cos(rad);
    const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
    const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
    if (a !== out) out.set(a);
    out[4] = c * a10 + s * a20;
    out[5] = c * a11 + s * a21;
    out[6] = c * a12 + s * a22;
    out[7] = c * a13 + s * a23;
    out[8] = c * a20 - s * a10;
    out[9] = c * a21 - s * a11;
    out[10] = c * a22 - s * a12;
    out[11] = c * a23 - s * a13;
    return out;
  },

  // Rotação Z
  rotateZ(out, a, rad) {
    const s = Math.sin(rad), c = Math.cos(rad);
    const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
    const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
    if (a !== out) out.set(a);
    out[0] = c * a00 + s * a10;
    out[1] = c * a01 + s * a11;
    out[2] = c * a02 + s * a12;
    out[3] = c * a03 + s * a13;
    out[4] = c * a10 - s * a00;
    out[5] = c * a11 - s * a01;
    out[6] = c * a12 - s * a02;
    out[7] = c * a13 - s * a03;
    return out;
  },

  // Escala
  scaleMat4(out, a, v) {
    const x = v[0], y = v[1], z = v[2];
    out[0] = a[0] * x; out[1] = a[1] * x; out[2] = a[2] * x; out[3] = a[3] * x;
    out[4] = a[4] * y; out[5] = a[5] * y; out[6] = a[6] * y; out[7] = a[7] * y;
    out[8] = a[8] * z; out[9] = a[9] * z; out[10] = a[10] * z; out[11] = a[11] * z;
    out[12] = a[12]; out[13] = a[13]; out[14] = a[14]; out[15] = a[15];
    return out;
  },

  // Projeção de ponto 3D para espaço de tela (X, Y 2D)
  projectToScreen(point3D, viewProjMatrix, width, height) {
    const x = point3D[0], y = point3D[1], z = point3D[2];
    const w = x * viewProjMatrix[3] + y * viewProjMatrix[7] + z * viewProjMatrix[11] + viewProjMatrix[15];
    if (w <= 0.01) return null; // Atrás da câmera

    const clipX = (x * viewProjMatrix[0] + y * viewProjMatrix[4] + z * viewProjMatrix[8] + viewProjMatrix[12]) / w;
    const clipY = (x * viewProjMatrix[1] + y * viewProjMatrix[5] + z * viewProjMatrix[9] + viewProjMatrix[13]) / w;

    return {
      x: (clipX * 0.5 + 0.5) * width,
      y: (1.0 - (clipY * 0.5 + 0.5)) * height,
      depth: w
    };
  }
};


/* ============================================================================
   2. SHADERS GLSL E RENDERIZADOR WEBGL
   ============================================================================ */

const VS_SOURCE = `
  attribute vec3 a_position;
  attribute vec3 a_normal;
  attribute vec4 a_color;

  uniform mat4 u_viewProjection;
  uniform mat4 u_model;
  uniform vec3 u_lightDir;
  uniform vec3 u_ambientColor;
  uniform vec3 u_sunColor;
  uniform vec4 u_tint;
  uniform vec3 u_cameraPos;
  uniform float u_fogNear;
  uniform float u_fogFar;

  varying vec4 v_color;
  varying float v_fogFactor;

  void main() {
    vec4 worldPos = u_model * vec4(a_position, 1.0);
    gl_Position = u_viewProjection * worldPos;

    // Normal no espaço de mundo (escala uniforme)
    vec3 normal = normalize(mat3(u_model) * a_normal);

    // Iluminação difusa simples (Lambertiana suave)
    float diff = max(dot(normal, normalize(u_lightDir)), 0.0);
    vec3 lighting = u_ambientColor + u_sunColor * diff;

    // Aplica cor dos vértices com iluminação e efeito de flash/tint
    vec3 col = a_color.rgb * lighting;
    if (u_tint.a > 0.0) {
      col = mix(col, u_tint.rgb, u_tint.a);
    }
    v_color = vec4(col, a_color.a);

    // Cálculo da névoa de distância (Atmospheric Fog)
    float dist = length(worldPos.xyz - u_cameraPos);
    v_fogFactor = clamp((dist - u_fogNear) / (u_fogFar - u_fogNear), 0.0, 1.0);
  }
`;

const FS_SOURCE = `
  precision mediump float;
  varying vec4 v_color;
  varying float v_fogFactor;
  uniform vec3 u_fogColor;

  void main() {
    // Mistura suave da cor final com a névoa do horizonte
    vec3 finalColor = mix(v_color.rgb, u_fogColor, v_fogFactor);
    gl_FragColor = vec4(finalColor, v_color.a);
  }
`;

class WebGLRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl', { antialias: true, alpha: false, depth: true });
    if (!this.gl) {
      alert('WebGL não suportado pelo seu navegador.');
      throw new Error('WebGL not supported');
    }

    const gl = this.gl;
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    // Inicialização do Programa Shader
    this.program = this.createProgram(VS_SOURCE, FS_SOURCE);
    gl.useProgram(this.program);

    // Localização de Atributos e Uniforms
    this.attribs = {
      position: gl.getAttribLocation(this.program, 'a_position'),
      normal: gl.getAttribLocation(this.program, 'a_normal'),
      color: gl.getAttribLocation(this.program, 'a_color')
    };

    this.uniforms = {
      viewProjection: gl.getUniformLocation(this.program, 'u_viewProjection'),
      model: gl.getUniformLocation(this.program, 'u_model'),
      lightDir: gl.getUniformLocation(this.program, 'u_lightDir'),
      ambientColor: gl.getUniformLocation(this.program, 'u_ambientColor'),
      sunColor: gl.getUniformLocation(this.program, 'u_sunColor'),
      tint: gl.getUniformLocation(this.program, 'u_tint'),
      cameraPos: gl.getUniformLocation(this.program, 'u_cameraPos'),
      fogColor: gl.getUniformLocation(this.program, 'u_fogColor'),
      fogNear: gl.getUniformLocation(this.program, 'u_fogNear'),
      fogFar: gl.getUniformLocation(this.program, 'u_fogFar')
    };

    // Parâmetros de Iluminação e Atmosfera
    this.lightDir = [0.4, 0.9, 0.3];
    this.ambientColor = [0.45, 0.48, 0.55];
    this.sunColor = [0.85, 0.82, 0.75];
    this.fogColor = [0.08, 0.10, 0.18];
    this.fogNear = 60.0;
    this.fogFar = 220.0;

    // Matrizes de trabalho reutilizáveis
    this.matProj = Math3D.createMat4();
    this.matView = Math3D.createMat4();
    this.matViewProj = Math3D.createMat4();
    this.matModel = Math3D.createMat4();

    // Buffer Dinâmico Compartilhado para Detritos e Partículas
    this.dynamicBuffer = gl.createBuffer();
    this.dynamicCapacity = 60000; // Vértices dinâmicos suportados
    this.dynamicArray = new Float32Array(this.dynamicCapacity * 10); // 10 floats por vértice
    gl.bindBuffer(gl.ARRAY_BUFFER, this.dynamicBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.dynamicArray.byteLength, gl.DYNAMIC_DRAW);

    this.resize();
  }

  createShader(type, source) {
    const gl = this.gl;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  createProgram(vsSource, fsSource) {
    const gl = this.gl;
    const vs = this.createShader(gl.VERTEX_SHADER, vsSource);
    const fs = this.createShader(gl.FRAGMENT_SHADER, fsSource);
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(prog));
      return null;
    }
    return prog;
  }

  resize() {
    const displayWidth = window.innerWidth;
    const displayHeight = window.innerHeight;
    if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
      this.canvas.width = displayWidth;
      this.canvas.height = displayHeight;
      this.gl.viewport(0, 0, displayWidth, displayHeight);
    }
  }

  // Cria um VBO estático de vértices a partir de um array numérico
  createMesh(vertexData) {
    const gl = this.gl;
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexData), gl.STATIC_DRAW);
    return {
      buffer: buffer,
      vertexCount: vertexData.length / 10 // 3 pos, 3 norm, 4 color
    };
  }

  beginFrame(camera) {
    this.resize();
    const gl = this.gl;
    gl.clearColor(this.fogColor[0], this.fogColor[1], this.fogColor[2], 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Configura Projeção e Visualização
    const aspect = this.canvas.width / this.canvas.height;
    Math3D.perspective(this.matProj, (65 * Math.PI) / 180, aspect, 0.5, 400.0);
    Math3D.lookAt(this.matView, camera.eye, camera.target, camera.up);
    Math3D.multiplyMat4(this.matViewProj, this.matProj, this.matView);

    gl.useProgram(this.program);
    gl.uniformMatrix4fv(this.uniforms.viewProjection, false, this.matViewProj);
    gl.uniform3fv(this.uniforms.lightDir, this.lightDir);
    gl.uniform3fv(this.uniforms.ambientColor, this.ambientColor);
    gl.uniform3fv(this.uniforms.sunColor, this.sunColor);
    gl.uniform3fv(this.uniforms.fogColor, this.fogColor);
    gl.uniform1f(this.uniforms.fogNear, this.fogNear);
    gl.uniform1f(this.uniforms.fogFar, this.fogFar);
    gl.uniform3fv(this.uniforms.cameraPos, camera.eye);
    gl.uniform4f(this.uniforms.tint, 0, 0, 0, 0);
  }

  bindMeshAttributes(buffer) {
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    const stride = 10 * 4; // 10 floats = 40 bytes
    gl.enableVertexAttribArray(this.attribs.position);
    gl.vertexAttribPointer(this.attribs.position, 3, gl.FLOAT, false, stride, 0);

    gl.enableVertexAttribArray(this.attribs.normal);
    gl.vertexAttribPointer(this.attribs.normal, 3, gl.FLOAT, false, stride, 3 * 4);

    gl.enableVertexAttribArray(this.attribs.color);
    gl.vertexAttribPointer(this.attribs.color, 4, gl.FLOAT, false, stride, 6 * 4);
  }

  drawMesh(mesh, modelMatrix, tint = null) {
    if (!mesh || mesh.vertexCount === 0) return;
    const gl = this.gl;
    this.bindMeshAttributes(mesh.buffer);
    gl.uniformMatrix4fv(this.uniforms.model, false, modelMatrix);
    if (tint) {
      gl.uniform4f(this.uniforms.tint, tint[0], tint[1], tint[2], tint[3]);
    } else {
      gl.uniform4f(this.uniforms.tint, 0, 0, 0, 0);
    }
    gl.drawArrays(gl.TRIANGLES, 0, mesh.vertexCount);
  }

  // Renderiza múltiplos elementos dinâmicos (detritos, partículas) em 1 único lote
  drawDynamicBatch(floatData, count) {
    if (count === 0) return;
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.dynamicBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, floatData.subarray(0, count * 10));
    this.bindMeshAttributes(this.dynamicBuffer);

    // Matriz identidade de modelo já que os vértices estão no espaço de mundo
    const identity = Math3D.createMat4();
    gl.uniformMatrix4fv(this.uniforms.model, false, identity);
    gl.uniform4f(this.uniforms.tint, 0, 0, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, count);
  }
}


/* ============================================================================
   3. GERADOR DE MODELOS VOXEL PROCEDURAIS 3D
   ============================================================================ */

const VoxelBuilder = {
  // Adiciona um paralelepípedo/cubo 3D ao array de vértices
  addBox(vertices, cx, cy, cz, sx, sy, sz, r, g, b, a = 1.0) {
    const hx = sx / 2, hy = sy / 2, hz = sz / 2;
    const x0 = cx - hx, x1 = cx + hx;
    const y0 = cy - hy, y1 = cy + hy;
    const z0 = cz - hz, z1 = cz + hz;

    // Definição das 6 faces: cada face tem Normal e 6 vértices (2 triângulos)
    const faces = [
      // Frente (+Z)
      { norm: [0, 0, 1], quad: [ [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y0, z1], [x1, y1, z1], [x0, y1, z1] ] },
      // Trás (-Z)
      { norm: [0, 0, -1], quad: [ [x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y0, z0], [x0, y1, z0], [x1, y1, z0] ] },
      // Topo (+Y)
      { norm: [0, 1, 0], quad: [ [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z1], [x1, y1, z0], [x0, y1, z0] ] },
      // Base (-Y)
      { norm: [0, -1, 0], quad: [ [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z0], [x1, y0, z1], [x0, y0, z1] ] },
      // Direita (+X)
      { norm: [1, 0, 0], quad: [ [x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y0, z1], [x1, y1, z0], [x1, y1, z1] ] },
      // Esquerda (-X)
      { norm: [-1, 0, 0], quad: [ [x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y0, z0], [x0, y1, z1], [x0, y1, z0] ] }
    ];

    for (let f = 0; f < 6; f++) {
      const face = faces[f];
      const nx = face.norm[0], ny = face.norm[1], nz = face.norm[2];
      for (let v = 0; v < 6; v++) {
        const p = face.quad[v];
        vertices.push(p[0], p[1], p[2], nx, ny, nz, r, g, b, a);
      }
    }
  },

  // Helper para salvar definição de peças voxel individuais para destruição futura
  createModelDef() {
    return {
      boxes: [], // { cx, cy, cz, sx, sy, sz, r, g, b, a }
      add(cx, cy, cz, sx, sy, sz, r, g, b, a = 1.0) {
        this.boxes.push({ cx, cy, cz, sx, sy, sz, r, g, b, a });
        return this;
      },
      bake(renderer) {
        const verts = [];
        for (const b of this.boxes) {
          VoxelBuilder.addBox(verts, b.cx, b.cy, b.cz, b.sx, b.sy, b.sz, b.r, b.g, b.b, b.a);
        }
        return {
          mesh: renderer.createMesh(verts),
          boxes: this.boxes
        };
      }
    };
  },

  // Modelos dos Veículos do Jogador
  buildInterceptor(renderer) {
    const m = this.createModelDef();
    // Chassi Central
    m.add(0, 0.4, 0, 1.4, 0.35, 3.2, 0.12, 0.55, 0.85); // Casco azul
    m.add(0, 0.4, 1.6, 1.1, 0.3, 0.8, 0.1, 0.45, 0.7); // Bico frontal
    // Cabine de Vidro Ciano
    m.add(0, 0.75, 0.2, 0.9, 0.4, 1.4, 0.0, 0.95, 1.0, 0.85);
    // Asas Delta
    m.add(-1.2, 0.35, -0.4, 1.1, 0.15, 1.8, 0.08, 0.4, 0.7);
    m.add(1.2, 0.35, -0.4, 1.1, 0.15, 1.8, 0.08, 0.4, 0.7);
    // Canhões nas Pontas das Asas
    m.add(-1.7, 0.4, 0.2, 0.2, 0.2, 1.4, 0.25, 0.28, 0.32);
    m.add(1.7, 0.4, 0.2, 0.2, 0.2, 1.4, 0.25, 0.28, 0.32);
    // Propulsores Traseiros com Brilho Neon
    m.add(-0.45, 0.4, -1.7, 0.4, 0.4, 0.4, 0.15, 0.18, 0.22);
    m.add(0.45, 0.4, -1.7, 0.4, 0.4, 0.4, 0.15, 0.18, 0.22);
    m.add(-0.45, 0.4, -1.92, 0.25, 0.25, 0.1, 0.0, 0.95, 1.0); // Fogo do motor
    m.add(0.45, 0.4, -1.92, 0.25, 0.25, 0.1, 0.0, 0.95, 1.0);
    // Spoiler Traseiro
    m.add(0, 0.95, -1.4, 1.4, 0.1, 0.4, 0.08, 0.4, 0.7);
    return m.bake(renderer);
  },

  buildRaptor(renderer) {
    const m = this.createModelDef();
    // Chassi Fino e Esportivo Laranja/Amarelo
    m.add(0, 0.32, 0, 1.1, 0.28, 3.4, 0.98, 0.45, 0.05); // Laranja vivo
    m.add(0, 0.32, 1.8, 0.6, 0.22, 1.0, 1.0, 0.75, 0.0); // Bico afilado
    // Cabine Baixa e Agressiva
    m.add(0, 0.6, 0.1, 0.7, 0.3, 1.2, 0.2, 0.1, 0.3, 0.9);
    // Asas Diagonais / Flecha Invertida
    m.add(-1.0, 0.3, 0.2, 0.9, 0.12, 1.4, 0.98, 0.45, 0.05);
    m.add(1.0, 0.3, 0.2, 0.9, 0.12, 1.4, 0.98, 0.45, 0.05);
    // Estabilizadores Verticais Duplos
    m.add(-0.6, 0.75, -1.2, 0.1, 0.6, 0.8, 1.0, 0.75, 0.0);
    m.add(0.6, 0.75, -1.2, 0.1, 0.6, 0.8, 1.0, 0.75, 0.0);
    // Turbina Central Poderosa
    m.add(0, 0.35, -1.8, 0.5, 0.5, 0.5, 0.15, 0.15, 0.18);
    m.add(0, 0.35, -2.06, 0.35, 0.35, 0.1, 1.0, 0.5, 0.0); // Brilho de fogo
    return m.bake(renderer);
  },

  buildTitan(renderer) {
    const m = this.createModelDef();
    // Blindado Pesado Verde Militar / Camo / Aço
    m.add(0, 0.5, 0, 2.2, 0.55, 3.8, 0.22, 0.38, 0.25); // Casco principal largo
    m.add(0, 0.95, -0.2, 1.6, 0.45, 2.0, 0.18, 0.3, 0.2); // Torre blindada
    // Para-choque Reforçado de Aríete
    m.add(0, 0.4, 2.0, 2.4, 0.6, 0.5, 0.4, 0.42, 0.45);
    // Placas de Blindagem Lateral
    m.add(-1.25, 0.45, 0, 0.3, 0.5, 3.4, 0.15, 0.25, 0.16);
    m.add(1.25, 0.45, 0, 0.3, 0.5, 3.4, 0.15, 0.25, 0.16);
    // Canhão Duplo no Topo
    m.add(-0.35, 1.25, 0.8, 0.25, 0.25, 2.2, 0.1, 0.1, 0.12);
    m.add(0.35, 1.25, 0.8, 0.25, 0.25, 2.2, 0.1, 0.1, 0.12);
    // Detalhes de Alerta Amarelos
    m.add(-1.0, 0.75, 1.7, 0.3, 0.1, 0.3, 1.0, 0.8, 0.0);
    m.add(1.0, 0.75, 1.7, 0.3, 0.1, 0.3, 1.0, 0.8, 0.0);
    return m.bake(renderer);
  },

  // Modelos dos Inimigos
  buildEnemyScout(renderer) {
    const m = this.createModelDef();
    // Carro Leve Amarelo e Preto
    m.add(0, 0.35, 0, 1.2, 0.3, 2.4, 0.95, 0.85, 0.1);
    m.add(0, 0.6, -0.2, 0.9, 0.3, 1.2, 0.15, 0.15, 0.2);
    m.add(0, 0.35, 1.3, 0.9, 0.2, 0.4, 0.8, 0.2, 0.2); // Faixa preta/vermelha
    return m.bake(renderer);
  },

  buildEnemyCruiser(renderer) {
    const m = this.createModelDef();
    // Carro Armado Roxo/Ciano
    m.add(0, 0.4, 0, 1.4, 0.35, 2.8, 0.55, 0.15, 0.75);
    m.add(0, 0.7, -0.1, 1.0, 0.35, 1.5, 0.15, 0.15, 0.25);
    // Armas Laterais
    m.add(-0.85, 0.45, 0.4, 0.2, 0.2, 1.2, 0.2, 0.2, 0.2);
    m.add(0.85, 0.45, 0.4, 0.2, 0.2, 1.2, 0.2, 0.2, 0.2);
    return m.bake(renderer);
  },

  buildEnemyEnforcer(renderer) {
    const m = this.createModelDef();
    // Carro Pesado Preto e Laranja
    m.add(0, 0.45, 0, 1.6, 0.45, 3.2, 0.15, 0.15, 0.18);
    m.add(0, 0.8, -0.2, 1.2, 0.4, 1.6, 0.95, 0.4, 0.05);
    // Aríete de Ferro
    m.add(0, 0.45, 1.7, 1.8, 0.5, 0.4, 0.45, 0.48, 0.52);
    return m.bake(renderer);
  },

  buildEnemyHauler(renderer) {
    const m = this.createModelDef();
    // Caminhão de Carga Azul e Cinza
    // Cabine Frontal
    m.add(0, 0.9, 2.2, 2.0, 1.2, 1.8, 0.15, 0.45, 0.85);
    m.add(0, 1.3, 2.8, 1.6, 0.4, 0.5, 0.1, 0.8, 0.9); // Vidro da cabine
    // Contêiner Traseiro Enorme
    m.add(0, 1.1, -1.0, 2.2, 1.6, 4.4, 0.7, 0.72, 0.75);
    m.add(0, 1.1, -1.0, 2.24, 1.4, 4.2, 0.15, 0.45, 0.85); // Listra do baú
    // Torre de Tiro no Teto do Contêiner
    m.add(0, 2.05, 0.2, 0.5, 0.3, 0.5, 0.2, 0.2, 0.25);
    m.add(0, 2.05, 0.8, 0.15, 0.15, 1.0, 0.1, 0.1, 0.1);
    return m.bake(renderer);
  },

  buildEnemyBehemoth(renderer) {
    const m = this.createModelDef();
    // Caminhão Blindado de Guerra (Fortaleza Móvel Vermelha/Cinza)
    m.add(0, 0.8, 0, 2.8, 1.0, 6.2, 0.2, 0.22, 0.25); // Chassi base gigante
    m.add(0, 1.5, 1.8, 2.4, 1.0, 2.2, 0.75, 0.1, 0.15); // Cabine blindada de assalto
    m.add(0, 1.6, -1.4, 2.6, 1.2, 3.8, 0.65, 0.12, 0.15); // Compartimento de munição
    // Torres Duplas no Teto
    m.add(-0.7, 2.4, -0.6, 0.6, 0.4, 0.6, 0.12, 0.12, 0.15);
    m.add(-0.7, 2.4, 0.1, 0.2, 0.2, 1.4, 0.05, 0.05, 0.08);
    m.add(0.7, 2.4, -0.6, 0.6, 0.4, 0.6, 0.12, 0.12, 0.15);
    m.add(0.7, 2.4, 0.1, 0.2, 0.2, 1.4, 0.05, 0.05, 0.08);
    // Para-choque Pesado
    m.add(0, 0.6, 3.2, 3.0, 0.8, 0.6, 0.1, 0.1, 0.1);
    return m.bake(renderer);
  },

  // Obstáculos da Pista
  buildBarrier(renderer) {
    const m = this.createModelDef();
    m.add(0, 0.4, 0, 2.8, 0.8, 0.7, 0.85, 0.85, 0.88); // Concreto
    m.add(-0.7, 0.4, 0.02, 0.6, 0.5, 0.72, 0.95, 0.4, 0.05); // Faixa laranja
    m.add(0.7, 0.4, 0.02, 0.6, 0.5, 0.72, 0.95, 0.4, 0.05);
    return m.bake(renderer);
  },

  buildCrate(renderer) {
    const m = this.createModelDef();
    m.add(0, 0.8, 0, 1.6, 1.6, 1.6, 0.8, 0.5, 0.2); // Caixa de madeira/metal
    m.add(0, 0.8, 0, 1.65, 0.2, 1.65, 0.4, 0.25, 0.1); // Cinta de reforço
    return m.bake(renderer);
  },

  buildWreck(renderer) {
    const m = this.createModelDef();
    m.add(0, 0.35, 0, 1.6, 0.5, 2.6, 0.2, 0.2, 0.22); // Carcaça torcida
    m.add(0.2, 0.65, -0.2, 0.8, 0.4, 0.9, 0.15, 0.15, 0.15);
    m.add(-0.3, 0.3, 0.8, 0.5, 0.3, 0.6, 0.8, 0.25, 0.05); // Detalhe em brasa
    return m.bake(renderer);
  },

  buildCone(renderer) {
    const m = this.createModelDef();
    m.add(0, 0.05, 0, 0.7, 0.1, 0.7, 0.1, 0.1, 0.1);
    m.add(0, 0.35, 0, 0.45, 0.5, 0.45, 1.0, 0.4, 0.0);
    m.add(0, 0.4, 0, 0.38, 0.2, 0.38, 0.95, 0.95, 0.95);
    return m.bake(renderer);
  },

  // Power-Ups Colecionáveis (Tokens 3D Flutuantes)
  buildTokenHealth(renderer) {
    const m = this.createModelDef();
    // Cruz Verde
    m.add(0, 0.6, 0, 0.3, 0.9, 0.3, 0.1, 0.9, 0.3);
    m.add(0, 0.6, 0, 0.9, 0.3, 0.3, 0.1, 0.9, 0.3);
    return m.bake(renderer);
  },

  buildTokenShield(renderer) {
    const m = this.createModelDef();
    // Escudo Hexagonal Ciano
    m.add(0, 0.6, 0, 0.8, 0.8, 0.25, 0.0, 0.8, 1.0);
    m.add(0, 0.6, 0.05, 0.4, 0.4, 0.2, 1.0, 1.0, 1.0);
    return m.bake(renderer);
  },

  buildTokenRapid(renderer) {
    const m = this.createModelDef();
    // Raio Amarelo
    m.add(0, 0.75, 0, 0.25, 0.5, 0.25, 1.0, 0.85, 0.0);
    m.add(0.15, 0.6, 0, 0.4, 0.2, 0.25, 1.0, 0.85, 0.0);
    m.add(0, 0.4, 0, 0.25, 0.5, 0.25, 1.0, 0.85, 0.0);
    return m.bake(renderer);
  },

  buildTokenDamage(renderer) {
    const m = this.createModelDef();
    // Estrela/Espada Vermelha
    m.add(0, 0.6, 0, 0.7, 0.7, 0.25, 1.0, 0.1, 0.3);
    m.add(0, 0.6, 0, 0.35, 0.35, 0.35, 1.0, 0.8, 0.2);
    return m.bake(renderer);
  },

  buildShieldBubble(renderer) {
    const m = this.createModelDef();
    const radius = 2.4;
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
      const x = Math.cos(a) * radius;
      const z = Math.sin(a) * radius;
      m.add(x, 0.6, z, 0.4, 0.4, 0.4, 0.0, 0.85, 1.0, 0.75);
      m.add(x * 0.75, 1.4, z * 0.75, 0.35, 0.35, 0.35, 0.2, 0.9, 1.0, 0.75);
    }
    return m.bake(renderer);
  }
};


/* ============================================================================
   4. SISTEMA DE ÁUDIO PROCEDURAL (WEB AUDIO API)
   ============================================================================ */

class SoundSystem {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.isMuted = false;
    this.musicTimer = null;
    this.isPlayingMusic = false;

    // Configurações de volume
    this.volumes = {
      master: 0.8,
      music: 0.65,
      sfx: 0.85
    };
  }

  init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    this.ctx = new AudioContextClass();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.volumes.master, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.setValueAtTime(this.volumes.music, this.ctx.currentTime);
    this.musicGain.connect(this.masterGain);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.setValueAtTime(this.volumes.sfx, this.ctx.currentTime);
    this.sfxGain.connect(this.masterGain);

    this.startMusic();
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMasterVolume(val) {
    this.volumes.master = val;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(val, this.ctx.currentTime, 0.05);
    }
  }

  setMusicVolume(val) {
    this.volumes.music = val;
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(val, this.ctx.currentTime, 0.05);
    }
  }

  setSfxVolume(val) {
    this.volumes.sfx = val;
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setTargetAtTime(val, this.ctx.currentTime, 0.05);
    }
  }

  // Tiros Procedurais
  playLaser() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(750, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.09);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.linearRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.1);
  }

  playShotgun() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    // Ruído branco filtrado
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1800, t);
    filter.frequency.linearRampToValueAtTime(300, t + 0.15);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.linearRampToValueAtTime(0.001, t + 0.15);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(t);
  }

  playCannon() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(25, t + 0.25);

    gain.gain.setValueAtTime(0.7, t);
    gain.gain.linearRampToValueAtTime(0.001, t + 0.28);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.3);
  }

  playHit() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(500, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.05);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.linearRampToValueAtTime(0.01, t + 0.05);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.06);
  }

  playExplosion(isLarge = false) {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const dur = isLarge ? 0.8 : 0.45;
    const bufferSize = Math.floor(this.ctx.sampleRate * dur);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isLarge ? 600 : 900, t);
    filter.frequency.linearRampToValueAtTime(60, t + dur);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(isLarge ? 0.8 : 0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(t);
  }

  playPowerup() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const notes = [440, 554, 659, 880]; // A, C#, E, A
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const st = t + idx * 0.05;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, st);

      gain.gain.setValueAtTime(0.2, st);
      gain.gain.linearRampToValueAtTime(0.001, st + 0.12);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(st);
      osc.stop(st + 0.14);
    });
  }

  playCrash() {
    if (!this.ctx) return;
    this.playHit();
    this.playExplosion(false);
  }

  playClick() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.linearRampToValueAtTime(0.001, t + 0.03);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.04);
  }

  // Música Procedural de Sintetizador Arcade Synthwave em Loop
  startMusic() {
    if (this.isPlayingMusic || !this.ctx) return;
    this.isPlayingMusic = true;

    let step = 0;
    const bpm = 128;
    const stepDuration = (60 / bpm) / 4; // Semicolcheias (16th notes)

    // Progressão de Baixo Bassline
    const bassNotes = [
      110, 110, 110, 110, 130.81, 130.81, 146.83, 146.83,
      98, 98, 98, 98, 123.47, 123.47, 110, 110
    ];

    const nextNote = () => {
      if (!this.isPlayingMusic || !this.ctx) return;
      const t = this.ctx.currentTime;
      const currentStep = step % 16;

      // 1. Kick (Bumbo) nos passos 0, 4, 8, 12
      if (currentStep % 4 === 0) {
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kickOsc.frequency.setValueAtTime(140, t);
        kickOsc.frequency.exponentialRampToValueAtTime(32, t + 0.08);
        kickGain.gain.setValueAtTime(0.4, t);
        kickGain.gain.linearRampToValueAtTime(0.001, t + 0.09);
        kickOsc.connect(kickGain);
        kickGain.connect(this.musicGain);
        kickOsc.start(t);
        kickOsc.stop(t + 0.1);
      }

      // 2. Snare nos passos 4 e 12
      if (currentStep === 4 || currentStep === 12) {
        const snareOsc = this.ctx.createOscillator();
        const snareGain = this.ctx.createGain();
        snareOsc.type = 'triangle';
        snareOsc.frequency.setValueAtTime(180, t);
        snareGain.gain.setValueAtTime(0.2, t);
        snareGain.gain.linearRampToValueAtTime(0.001, t + 0.08);
        snareOsc.connect(snareGain);
        snareGain.connect(this.musicGain);
        snareOsc.start(t);
        snareOsc.stop(t + 0.09);
      }

      // 3. Linha de Baixo Pulsante (Bass Synth)
      const freq = bassNotes[currentStep];
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bassOsc.type = 'sawtooth';
      bassOsc.frequency.setValueAtTime(freq, t);

      bassGain.gain.setValueAtTime(0.15, t);
      bassGain.gain.exponentialRampToValueAtTime(0.01, t + stepDuration * 0.85);

      bassOsc.connect(bassGain);
      bassGain.connect(this.musicGain);
      bassOsc.start(t);
      bassOsc.stop(t + stepDuration * 0.9);

      step++;
      this.musicTimer = setTimeout(nextNote, stepDuration * 1000);
    };

    nextNote();
  }

  stopMusic() {
    this.isPlayingMusic = false;
    if (this.musicTimer) clearTimeout(this.musicTimer);
  }
}


/* ============================================================================
   5. GERENCIADOR DE DETRITOS VOXEL E SISTEMA DE PARTÍCULAS
   ============================================================================ */

class DebrisParticleSystem {
  constructor(renderer) {
    this.renderer = renderer;
    this.debrisList = []; // Blocos voxel saltando
    this.particleList = []; // Fogo, fumaça, faíscas
    this.maxDebris = 400;
    this.maxParticles = 500;
  }

  // Gera desmembramento completo do veículo em dezenas de blocos voxel
  spawnVehicleDestruction(vehicleX, vehicleY, vehicleZ, boxes, impulseMultiplier = 1.0) {
    const count = Math.min(boxes.length, 50);
    for (let i = 0; i < count; i++) {
      if (this.debrisList.length >= this.maxDebris) {
        this.debrisList.shift();
      }
      const b = boxes[i];
      // Posição no espaço de mundo
      const x = vehicleX + b.cx;
      const y = Math.max(0.4, vehicleY + b.cy);
      const z = vehicleZ + b.cz;

      // Velocidade explosiva inicial
      const angle = Math.random() * Math.PI * 2;
      const horizSpeed = (8 + Math.random() * 16) * impulseMultiplier;
      this.debrisList.push({
        x: x, y: y, z: z,
        sx: b.sx * (0.8 + Math.random() * 0.4),
        sy: b.sy * (0.8 + Math.random() * 0.4),
        sz: b.sz * (0.8 + Math.random() * 0.4),
        vx: Math.cos(angle) * horizSpeed,
        vy: (12 + Math.random() * 18) * impulseMultiplier,
        vz: Math.sin(angle) * horizSpeed + (Math.random() * 10 - 5),
        rotX: Math.random() * 10 - 5,
        rotY: Math.random() * 10 - 5,
        rotZ: Math.random() * 10 - 5,
        r: b.r, g: b.g, b: b.b,
        life: 3.5 + Math.random() * 1.5,
        maxLife: 5.0
      });
    }

    // Adiciona partículas explosivas (Fogo e Fumaça)
    this.spawnExplosionPuffs(vehicleX, vehicleY + 0.8, vehicleZ, 25 * impulseMultiplier);
  }

  spawnExplosionPuffs(x, y, z, count) {
    for (let i = 0; i < count; i++) {
      if (this.particleList.length >= this.maxParticles) {
        this.particleList.shift();
      }
      const isFire = Math.random() > 0.4;
      const speed = 4 + Math.random() * 12;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;

      this.particleList.push({
        x: x, y: y, z: z,
        vx: Math.sin(phi) * Math.cos(theta) * speed,
        vy: Math.cos(phi) * speed + 4,
        vz: Math.sin(phi) * Math.sin(theta) * speed,
        size: 0.35 + Math.random() * 0.6,
        r: isFire ? 1.0 : 0.4,
        g: isFire ? 0.3 + Math.random() * 0.5 : 0.4,
        b: isFire ? 0.05 : 0.4,
        life: 0.6 + Math.random() * 0.8,
        maxLife: 1.4
      });
    }
  }

  spawnHitSparks(x, y, z, count = 8) {
    for (let i = 0; i < count; i++) {
      if (this.particleList.length >= this.maxParticles) this.particleList.shift();
      this.particleList.push({
        x: x, y: y, z: z,
        vx: (Math.random() - 0.5) * 14,
        vy: Math.random() * 10 + 2,
        vz: (Math.random() - 0.5) * 14,
        size: 0.18,
        r: 1.0, g: 0.9, b: 0.2,
        life: 0.2 + Math.random() * 0.3,
        maxLife: 0.5
      });
    }
  }

  update(dt) {
    const gravity = 32.0;

    // Atualiza Detritos Voxel
    for (let i = this.debrisList.length - 1; i >= 0; i--) {
      const d = this.debrisList[i];
      d.life -= dt;
      if (d.life <= 0) {
        this.debrisList.splice(i, 1);
        continue;
      }

      d.vy -= gravity * dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.z += d.vz * dt;

      // Colisão com o solo (Asfalto da Estrada Y = 0)
      if (d.y <= 0.2) {
        d.y = 0.2;
        d.vy = -d.vy * 0.38; // Coeficiente de restituição / quique
        d.vx *= 0.82; // Atrito
        d.vz *= 0.82;
      }
    }

    // Atualiza Partículas
    for (let i = this.particleList.length - 1; i >= 0; i--) {
      const p = this.particleList[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particleList.splice(i, 1);
        continue;
      }
      p.vy -= 8.0 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      p.size *= 0.98; // Diminui sutilmente com o tempo
    }
  }

  render(renderer) {
    const verts = [];

    // Empacota todos os cubos de detritos no buffer dinâmico
    for (const d of this.debrisList) {
      const alpha = Math.min(1.0, d.life / 0.8);
      VoxelBuilder.addBox(verts, d.x, d.y, d.z, d.sx, d.sy, d.sz, d.r, d.g, d.b, alpha);
    }

    // Empacota partículas como pequenos cubos luminosos
    for (const p of this.particleList) {
      const alpha = Math.min(1.0, p.life / 0.4);
      VoxelBuilder.addBox(verts, p.x, p.y, p.z, p.size, p.size, p.size, p.r, p.g, p.b, alpha);
    }

    if (verts.length > 0) {
      renderer.drawDynamicBatch(new Float32Array(verts), verts.length / 10);
    }
  }
}


/* ============================================================================
   6. ESTRADA 3D, CURVAS E BIOMAS PROGRESSIVOS
   ============================================================================ */

class RoadManager {
  constructor(renderer) {
    this.renderer = renderer;
    this.roadWidth = 24.0; // 4 faixas amplas
    this.segmentLength = 10.0;
    this.totalSegments = 70; // Segmentos renderizados à frente

    // Malha estática dos segmentos repetitivos da estrada
    this.roadMesh = this.buildRoadSegmentMesh(renderer);
    this.guardrailMesh = this.buildGuardrailMesh(renderer);
    this.cityBuildingMesh = this.buildCityBuildingMesh(renderer);
    this.desertPropMesh = this.buildDesertPropMesh(renderer);
    this.industrialSiloMesh = this.buildIndustrialSiloMesh(renderer);
    this.mountainMesh = this.buildMountainMesh(renderer);
    this.nightPostMesh = this.buildNightPostMesh(renderer);

    this.currentBiome = 'city';
  }

  // Curvatura suave 3D em X baseada na coordenada Z
  getCurveX(z) {
    return Math.sin(z * 0.0035) * 28.0 + Math.sin(z * 0.008) * 12.0;
  }

  // Derivada dX/dZ para obter o ângulo tangente de rotação
  getTangentAngle(z) {
    const dz = 1.0;
    const x0 = this.getCurveX(z);
    const x1 = this.getCurveX(z + dz);
    return Math.atan2(x1 - x0, dz);
  }

  buildRoadSegmentMesh(renderer) {
    const verts = [];
    const hw = this.roadWidth / 2;
    const len = this.segmentLength;

    // Asfalto escuro
    VoxelBuilder.addBox(verts, 0, 0, len / 2, this.roadWidth, 0.2, len, 0.14, 0.16, 0.2);

    // Acostamentos laterais
    VoxelBuilder.addBox(verts, -hw - 1.0, 0.05, len / 2, 2.0, 0.25, len, 0.25, 0.28, 0.32);
    VoxelBuilder.addBox(verts, hw + 1.0, 0.05, len / 2, 2.0, 0.25, len, 0.25, 0.28, 0.32);

    // Listras amarelas centrais tracejadas
    VoxelBuilder.addBox(verts, 0, 0.12, len / 2, 0.4, 0.05, len * 0.65, 0.95, 0.8, 0.1);

    // Linhas brancas laterais de delimitação de faixa
    VoxelBuilder.addBox(verts, -hw * 0.5, 0.12, len / 2, 0.25, 0.05, len, 0.85, 0.85, 0.9);
    VoxelBuilder.addBox(verts, hw * 0.5, 0.12, len / 2, 0.25, 0.05, len, 0.85, 0.85, 0.9);

    return renderer.createMesh(verts);
  }

  buildGuardrailMesh(renderer) {
    const verts = [];
    const len = this.segmentLength;
    // Defensa metálica com postes
    VoxelBuilder.addBox(verts, 0, 0.6, len / 2, 0.3, 0.4, len, 0.75, 0.2, 0.25); // Vermelho e branco
    VoxelBuilder.addBox(verts, 0, 0.3, len * 0.2, 0.35, 0.6, 0.35, 0.4, 0.45, 0.5);
    VoxelBuilder.addBox(verts, 0, 0.3, len * 0.8, 0.35, 0.6, 0.35, 0.4, 0.45, 0.5);
    return renderer.createMesh(verts);
  }

  buildCityBuildingMesh(renderer) {
    const verts = [];
    // Edifícios futuristas em blocos
    VoxelBuilder.addBox(verts, 0, 16.0, 0, 14.0, 32.0, 14.0, 0.1, 0.15, 0.26);
    // Janelas iluminadas em ciano
    VoxelBuilder.addBox(verts, -4.0, 18.0, 7.1, 2.0, 2.0, 0.2, 0.0, 0.9, 1.0);
    VoxelBuilder.addBox(verts, 4.0, 24.0, 7.1, 2.0, 2.0, 0.2, 0.0, 0.9, 1.0);
    VoxelBuilder.addBox(verts, 0, 12.0, 7.1, 2.0, 2.0, 0.2, 0.0, 0.9, 1.0);
    return renderer.createMesh(verts);
  }

  buildDesertPropMesh(renderer) {
    const verts = [];
    // Rocha arenosa e cacto voxel
    VoxelBuilder.addBox(verts, 0, 4.0, 0, 8.0, 8.0, 8.0, 0.78, 0.52, 0.32);
    // Cacto
    VoxelBuilder.addBox(verts, 6.0, 3.0, 0, 0.8, 6.0, 0.8, 0.15, 0.65, 0.25);
    VoxelBuilder.addBox(verts, 7.0, 4.0, 0, 2.0, 0.8, 0.8, 0.15, 0.65, 0.25);
    return renderer.createMesh(verts);
  }

  buildIndustrialSiloMesh(renderer) {
    const verts = [];
    // Tanques metálicos cilíndricos e chaminés industriais
    VoxelBuilder.addBox(verts, 0, 10.0, 0, 9.0, 20.0, 9.0, 0.45, 0.48, 0.52);
    VoxelBuilder.addBox(verts, 7.0, 18.0, 0, 2.4, 36.0, 2.4, 0.7, 0.2, 0.2); // Chaminé
    return renderer.createMesh(verts);
  }

  buildMountainMesh(renderer) {
    const verts = [];
    // Grande pico rochoso com topo nevado
    VoxelBuilder.addBox(verts, 0, 16.0, 0, 18.0, 32.0, 18.0, 0.3, 0.32, 0.36);
    VoxelBuilder.addBox(verts, 0, 32.0, 0, 8.0, 8.0, 8.0, 0.92, 0.95, 0.98);
    return renderer.createMesh(verts);
  }

  buildNightPostMesh(renderer) {
    const verts = [];
    // Poste e pórtico de sinalização luminosa neon
    VoxelBuilder.addBox(verts, 0, 8.0, 0, 1.2, 16.0, 1.2, 0.22, 0.24, 0.28);
    VoxelBuilder.addBox(verts, -5.0, 15.0, 0, 10.0, 1.2, 1.2, 0.22, 0.24, 0.28);
    VoxelBuilder.addBox(verts, -8.0, 14.0, 0, 2.4, 0.8, 1.4, 0.0, 0.95, 1.0); // Luz ciano neon
    VoxelBuilder.addBox(verts, -3.0, 14.0, 0, 2.4, 0.8, 1.4, 1.0, 0.05, 0.5); // Luz magenta neon
    return renderer.createMesh(verts);
  }

  updateBiome(distanceMeters) {
    // Alterna biomas conforme a distância avança
    const cycle = Math.floor(distanceMeters / 1500) % 5;
    if (cycle === 0) {
      this.currentBiome = 'city';
      this.renderer.fogColor = [0.08, 0.10, 0.18]; // Noturno azulado
    } else if (cycle === 1) {
      this.currentBiome = 'desert';
      this.renderer.fogColor = [0.26, 0.18, 0.12]; // Ocre desértico
    } else if (cycle === 2) {
      this.currentBiome = 'industrial';
      this.renderer.fogColor = [0.15, 0.15, 0.15]; // Cinza fabril
    } else if (cycle === 3) {
      this.currentBiome = 'mountain';
      this.renderer.fogColor = [0.12, 0.16, 0.24]; // Azul gélido
    } else {
      this.currentBiome = 'night';
      this.renderer.fogColor = [0.03, 0.04, 0.08]; // Cyberpunk escuro
    }
  }

  render(renderer, playerZ) {
    const startSegment = Math.floor(playerZ / this.segmentLength);
    const hw = this.roadWidth / 2;
    const m = Math3D.createMat4();

    for (let i = 0; i < this.totalSegments; i++) {
      const segIndex = startSegment + i;
      const segZ = segIndex * this.segmentLength;
      const segX = this.getCurveX(segZ);
      const angle = this.getTangentAngle(segZ);

      // Pista Central
      m.fill(0);
      m[0] = 1; m[5] = 1; m[10] = 1; m[15] = 1;
      Math3D.translateMat4(m, m, [segX, 0, segZ]);
      Math3D.rotateY(m, m, angle);
      renderer.drawMesh(this.roadMesh, m);

      // Defensas Laterais (Esquerda e Direita)
      const mLeft = Math3D.createMat4();
      Math3D.translateMat4(mLeft, m, [-hw - 0.2, 0, 0]);
      renderer.drawMesh(this.guardrailMesh, mLeft);

      const mRight = Math3D.createMat4();
      Math3D.translateMat4(mRight, m, [hw + 0.2, 0, 0]);
      renderer.drawMesh(this.guardrailMesh, mRight);

      // Elementos de Cenário Lateral (a cada 4 segmentos)
      if (segIndex % 4 === 0) {
        const side = (segIndex % 8 === 0) ? 1 : -1;
        const propMesh = (this.currentBiome === 'desert') ? this.desertPropMesh :
                         (this.currentBiome === 'industrial') ? this.industrialSiloMesh :
                         (this.currentBiome === 'mountain') ? this.mountainMesh :
                         (this.currentBiome === 'night') ? this.nightPostMesh :
                         this.cityBuildingMesh;

        const mProp = Math3D.createMat4();
        Math3D.translateMat4(mProp, m, [side * (hw + 24.0), 0, 0]);
        renderer.drawMesh(propMesh, mProp);
      }
    }
  }
}


/* ============================================================================
   7. SISTEMA DE ARMAS E PROJÉTEIS 3D
   ============================================================================ */

class Projectile {
  constructor(x, y, z, vx, vy, vz, damage, isPlayer, range, color, size = 0.35) {
    this.x = x; this.y = y; this.z = z;
    this.vx = vx; this.vy = vy; this.vz = vz;
    this.damage = damage;
    this.isPlayer = isPlayer;
    this.traveled = 0;
    this.range = range;
    this.color = color; // [r, g, b]
    this.size = size;
    this.active = true;
  }

  update(dt) {
    const dx = this.vx * dt;
    const dy = this.vy * dt;
    const dz = this.vz * dt;
    this.x += dx;
    this.y += dy;
    this.z += dz;
    this.traveled += Math.hypot(dx, dy, dz);
    if (this.traveled >= this.range) {
      this.active = false;
    }
  }
}

class WeaponSystem {
  constructor(game) {
    this.game = game;
    this.projectiles = [];
    this.cooldown = 0;

    // Configurações das 3 Armas Principais
    this.configs = {
      machinegun: {
        name: 'Metralhadora',
        fireRate: 6.0, // 6 tiros / s
        damage: 25,
        range: 160.0,
        speed: 130.0,
        color: [1.0, 0.9, 0.1], // Amarelo
        size: 0.28
      },
      shotgun: {
        name: 'Dispersora',
        fireRate: 2.0, // 2 disparos / s
        damage: 12,
        pellets: 5,
        range: 65.0,
        speed: 100.0,
        color: [0.0, 0.95, 1.0], // Ciano neon
        size: 0.22
      },
      cannon: {
        name: 'Canhão Pesado',
        fireRate: 1.0, // 1 tiro / s
        damage: 100,
        range: 220.0,
        speed: 120.0,
        color: [1.0, 0.25, 0.05], // Plasma avermelhado
        size: 0.65
      }
    };
  }

  update(dt) {
    if (this.cooldown > 0) this.cooldown -= dt;

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.update(dt);
      if (!p.active) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  firePlayer(weaponKey, playerX, playerY, playerZ, roadAngle, hasDoubleDamage, hasRapidFire) {
    let cfg = this.configs[weaponKey] || this.configs.machinegun;
    const fireInterval = 1.0 / (cfg.fireRate * (hasRapidFire ? 1.8 : 1.0));
    if (this.cooldown > 0) return false;

    this.cooldown = fireInterval;
    const dmg = cfg.damage * (hasDoubleDamage ? 2.0 : 1.0);

    if (weaponKey === 'shotgun') {
      this.game.sound.playShotgun();
      const spreadAngles = [-0.14, -0.07, 0.0, 0.07, 0.14];
      for (const sp of spreadAngles) {
        const totalAngle = roadAngle + sp;
        this.projectiles.push(new Projectile(
          playerX, playerY + 0.6, playerZ + 1.2,
          Math.sin(totalAngle) * cfg.speed,
          0,
          Math.cos(totalAngle) * cfg.speed,
          dmg, true, cfg.range, cfg.color, cfg.size
        ));
      }
    } else if (weaponKey === 'cannon') {
      this.game.sound.playCannon();
      this.game.camera.addShake(0.35); // Trepidação de disparo pesado
      this.game.player.recoilZ = -0.55; // Recuo visual no veículo
      this.game.debris.spawnHitSparks(playerX, playerY + 0.8, playerZ + 2.0, 8); // Clarão/faíscas de disparo
      this.projectiles.push(new Projectile(
        playerX, playerY + 0.8, playerZ + 1.6,
        Math.sin(roadAngle) * cfg.speed,
        0,
        Math.cos(roadAngle) * cfg.speed,
        dmg, true, cfg.range, cfg.color, cfg.size
      ));
    } else {
      // Metralhadora
      this.game.sound.playLaser();
      // Disparo alternado nas asas esquerda/direita
      const wingOffset = (Math.random() > 0.5 ? 1 : -1) * 1.4;
      this.projectiles.push(new Projectile(
        playerX + Math.cos(roadAngle) * wingOffset,
        playerY + 0.5,
        playerZ + 1.2,
        Math.sin(roadAngle) * cfg.speed,
        0,
        Math.cos(roadAngle) * cfg.speed,
        dmg, true, cfg.range, cfg.color, cfg.size
      ));
    }

    return true;
  }

  fireEnemy(enemyX, enemyY, enemyZ, targetX, targetZ, speed = 80.0, damage = 35) {
    const dx = targetX - enemyX;
    const dz = targetZ - enemyZ;
    const len = Math.hypot(dx, dz) || 1;
    this.projectiles.push(new Projectile(
      enemyX, enemyY + 0.6, enemyZ - 1.2,
      (dx / len) * speed,
      0,
      (dz / len) * speed,
      damage, false, 150.0, [1.0, 0.1, 0.3], 0.35
    ));
    this.game.sound.playLaser();
  }

  render(renderer) {
    const verts = [];
    for (const p of this.projectiles) {
      // Voxel 3D esticado representando o feixe do projétil
      VoxelBuilder.addBox(verts, p.x, p.y, p.z, p.size, p.size, p.size * 2.5, p.color[0], p.color[1], p.color[2]);
    }
    if (verts.length > 0) {
      renderer.drawDynamicBatch(new Float32Array(verts), verts.length / 10);
    }
  }
}


/* ============================================================================
   8. VEÍCULO DO JOGADOR
   ============================================================================ */

class PlayerVehicle {
  constructor(game, vehicleType = 'interceptor') {
    this.game = game;
    this.type = vehicleType;

    // Posições no espaço de mundo 3D
    this.laneX = 0; // Posição lateral relativa ao centro da pista (-10.0 a +10.0)
    this.worldX = 0;
    this.worldY = 0.5;
    this.worldZ = 0;
    this.forwardSpeed = 50.0; // Velocidade de avanço automático contínuo

    this.maxHp = 1000;
    this.hp = 1000;

    // Configurações específicas por veículo
    this.stats = {
      interceptor: {
        lateralSpeed: 28.0,
        collisionFactor: 1.0,
        width: 2.2, height: 1.2, depth: 3.6
      },
      raptor: {
        lateralSpeed: 38.0,
        collisionFactor: 1.35, // Recebe mais dano em batidas
        width: 1.8, height: 1.0, depth: 3.4
      },
      titan: {
        lateralSpeed: 20.0,
        collisionFactor: 0.65, // Blindado resistente a impactos
        width: 3.0, height: 1.6, depth: 4.0
      }
    }[vehicleType] || { lateralSpeed: 28.0, collisionFactor: 1.0, width: 2.2, height: 1.2, depth: 3.6 };

    // Estados e Power-Ups
    this.hitFlash = 0;
    this.shieldTimer = 0;
    this.rapidFireTimer = 0;
    this.doubleDamageTimer = 0;

    this.tiltRoll = 0; // Inclinação lateral nas curvas/desvios
    this.recoilZ = 0; // Recuo visual ao atirar armas pesadas
    this.destroyed = false;
  }

  takeDamage(amount, isCollision = false) {
    if (this.destroyed) return;

    if (this.shieldTimer > 0) {
      amount *= 0.15; // Escudo absorve 85% do dano
      this.game.sound.playHit();
    }

    if (isCollision) {
      amount *= this.stats.collisionFactor;
    }

    this.hp = Math.max(0, this.hp - amount);
    this.hitFlash = 0.15;
    this.game.camera.addShake(isCollision ? 0.45 : 0.2);

    // Se o dano for considerável, solta pequenos blocos voxel (efeito de perda de partes)
    if (amount >= 50) {
      const modelObj = this.game.models[this.type];
      if (modelObj && modelObj.boxes.length > 0) {
        const randomBox = modelObj.boxes[Math.floor(Math.random() * modelObj.boxes.length)];
        this.game.debris.debrisList.push({
          x: this.worldX + randomBox.cx,
          y: this.worldY + randomBox.cy,
          z: this.worldZ + randomBox.cz,
          sx: randomBox.sx, sy: randomBox.sy, sz: randomBox.sz,
          vx: (Math.random() - 0.5) * 12,
          vy: 8 + Math.random() * 8,
          vz: (Math.random() - 0.5) * 12,
          rotX: Math.random() * 8, rotY: Math.random() * 8, rotZ: Math.random() * 8,
          r: randomBox.r, g: randomBox.g, b: randomBox.b,
          life: 3.0, maxLife: 3.0
        });
      }
    }

    // Efeito de flash vermelho na interface
    const flashEl = document.getElementById('damage-flash');
    if (flashEl) {
      flashEl.classList.add('active');
      setTimeout(() => flashEl.classList.remove('active'), 120);
    }

    if (this.hp <= 0 && !this.destroyed) {
      this.destroyed = true;
      this.game.onPlayerDied();
    }
  }

  update(dt, input) {
    if (this.destroyed) return;

    // Atualiza timers de Power-Ups e recuo
    if (this.hitFlash > 0) this.hitFlash -= dt;
    if (this.shieldTimer > 0) this.shieldTimer -= dt;
    if (this.rapidFireTimer > 0) this.rapidFireTimer -= dt;
    if (this.doubleDamageTimer > 0) this.doubleDamageTimer -= dt;
    if (this.recoilZ < 0) this.recoilZ = Math.min(0, this.recoilZ + dt * 4.0);

    // Movimentação Lateral Suave (A / D ou Setas)
    let moveDir = 0;
    if (input.left) moveDir -= 1;
    if (input.right) moveDir += 1;

    const sens = this.game.settings.sensitivity / 100.0;
    this.laneX += moveDir * this.stats.lateralSpeed * sens * dt;

    // Restrição física das bordas da pista
    const maxBound = (this.game.road.roadWidth / 2) - 1.5;
    this.laneX = Math.max(-maxBound, Math.min(maxBound, this.laneX));

    // Inclinação visual (Roll / Banking) ao desviar
    const targetRoll = -moveDir * 0.22;
    this.tiltRoll += (targetRoll - this.tiltRoll) * 12.0 * dt;

    // Avanço Contínuo em Z
    this.worldZ += this.forwardSpeed * dt;

    // Posição no mundo acompanhando as curvas da pista
    const curveCenter = this.game.road.getCurveX(this.worldZ);
    this.worldX = curveCenter + this.laneX;

    // Levitação suave do Hovercraft
    this.worldY = 0.5 + Math.sin(this.worldZ * 0.08) * 0.08;
  }

  render(renderer) {
    if (this.destroyed) return;

    const angle = this.game.road.getTangentAngle(this.worldZ);
    const m = Math3D.createMat4();
    Math3D.translateMat4(m, m, [this.worldX, this.worldY, this.worldZ + this.recoilZ]);
    Math3D.rotateY(m, m, angle);
    Math3D.rotateZ(m, m, this.tiltRoll);

    const modelObj = this.game.models[this.type];
    const tint = (this.hitFlash > 0) ? [1.0, 0.2, 0.2, 0.6] :
                 (this.shieldTimer > 0) ? [0.2, 0.8, 1.0, 0.35] : null;

    renderer.drawMesh(modelObj.mesh, m, tint);

    // Redoma de Escudo Voxel Ativa ao redor do veículo
    if (this.shieldTimer > 0 && this.game.models.shield_bubble) {
      const shieldMat = Math3D.createMat4();
      Math3D.translateMat4(shieldMat, shieldMat, [this.worldX, this.worldY + 0.2, this.worldZ]);
      Math3D.rotateY(shieldMat, shieldMat, performance.now() * 0.003);
      renderer.drawMesh(this.game.models.shield_bubble.mesh, shieldMat);
    }
  }
}


/* ============================================================================
   9. GERENCIADOR DE INIMIGOS E INTELIGÊNCIA ARTIFICIAL
   ============================================================================ */

class EnemyVehicle {
  constructor(game, type, z, targetLaneX) {
    this.game = game;
    this.type = type;
    this.worldZ = z;
    this.laneX = targetLaneX;
    this.worldX = 0;
    this.worldY = 0.5;

    // Configurações e Comportamento por Tipo
    const baseStats = {
      scout: {
        hp: 100, score: 100, speedRel: 0.9, width: 2.0, height: 1.1, depth: 3.0,
        fireInterval: 1.8, isTruck: false, aiType: 'evasive'
      },
      cruiser: {
        hp: 175, score: 200, speedRel: 0.85, width: 2.2, height: 1.2, depth: 3.4,
        fireInterval: 1.3, isTruck: false, aiType: 'align'
      },
      enforcer: {
        hp: 250, score: 350, speedRel: 0.82, width: 2.4, height: 1.3, depth: 3.6,
        fireInterval: 1.5, isTruck: false, aiType: 'ram'
      },
      hauler: {
        hp: 450, score: 600, speedRel: 0.65, width: 3.2, height: 2.4, depth: 5.6,
        fireInterval: 1.1, isTruck: true, aiType: 'steady'
      },
      behemoth: {
        hp: 700, score: 1000, speedRel: 0.6, width: 3.6, height: 2.8, depth: 7.0,
        fireInterval: 0.8, isTruck: true, aiType: 'heavy_assault'
      }
    }[type] || { hp: 100, score: 100, speedRel: 0.8, width: 2.0, height: 1.1, depth: 3.0, fireInterval: 1.5, isTruck: false, aiType: 'steady' };

    // Escala de vida moderada por onda
    const waveMult = 1.0 + (game.wave - 1) * 0.12;
    this.maxHp = Math.round(baseStats.hp * waveMult);
    this.hp = this.maxHp;
    this.score = Math.round(baseStats.score * (1 + (game.wave - 1) * 0.1));
    this.speed = game.player.forwardSpeed * baseStats.speedRel;
    this.stats = baseStats;

    this.fireTimer = Math.random() * 1.5;
    this.laneChangeTimer = 2.0 + Math.random() * 3.0;
    this.targetLaneX = targetLaneX;
    this.hitTimer = 0;
    this.destroyed = false;
  }

  takeDamage(amount) {
    this.hp -= amount;
    this.hitTimer = 0.12;
    this.game.sound.playHit();
    if (this.hp <= 0 && !this.destroyed) {
      this.destroyed = true;
      this.onKilled();
    }
  }

  onKilled() {
    this.game.addScore(this.score);
    this.game.addKill();

    const modelObj = this.game.models[this.type];
    const impulse = this.stats.isTruck ? 1.4 : 1.0;
    this.game.debris.spawnVehicleDestruction(this.worldX, this.worldY, this.worldZ, modelObj.boxes, impulse);
    this.game.sound.playExplosion(this.stats.isTruck);
    this.game.camera.addShake(this.stats.isTruck ? 0.5 : 0.25);

    // Chance de soltar Power-Up (28% de chance)
    if (Math.random() < 0.28) {
      this.game.powerups.spawn(this.worldX, this.worldZ);
    }
  }

  update(dt, player) {
    if (this.destroyed) return;
    if (this.hitTimer > 0) this.hitTimer -= dt;

    // Avanço contínuo
    this.worldZ += this.speed * dt;
    const curveCenter = this.game.road.getCurveX(this.worldZ);

    // Lógica da Inteligência Artificial
    this.laneChangeTimer -= dt;
    if (this.laneChangeTimer <= 0) {
      this.laneChangeTimer = 2.5 + Math.random() * 4.0;
      if (this.stats.aiType === 'align') {
        // Tenta se alinhar na mesma faixa do jogador para atirar
        this.targetLaneX = player.laneX + (Math.random() - 0.5) * 2.0;
      } else if (this.stats.aiType === 'ram') {
        // Enforcer persegue o jogador para colidir
        this.targetLaneX = player.laneX;
      } else if (this.stats.aiType === 'evasive') {
        // Desvia ocasionalmente
        this.targetLaneX = (Math.random() - 0.5) * 16.0;
      } else {
        // Caminhões trocam de faixa lentamente
        this.targetLaneX = [-6.0, -2.0, 2.0, 6.0][Math.floor(Math.random() * 4)];
      }
    }

    // Suavização da transição lateral de faixas
    const laneSpeed = this.stats.isTruck ? 6.0 : 12.0;
    this.laneX += (this.targetLaneX - this.laneX) * Math.min(1.0, dt * laneSpeed);
    this.worldX = curveCenter + this.laneX;

    // Sistema de Tiro do Inimigo (quando à frente do jogador)
    const distToPlayer = this.worldZ - player.worldZ;
    if (distToPlayer > 10.0 && distToPlayer < 90.0) {
      this.fireTimer -= dt;
      if (this.fireTimer <= 0) {
        this.fireTimer = this.stats.fireInterval + Math.random() * 0.5;
        this.game.weapons.fireEnemy(this.worldX, this.worldY, this.worldZ, player.worldX, player.worldZ);
      }
    }
  }

  render(renderer) {
    if (this.destroyed) return;
    const angle = this.game.road.getTangentAngle(this.worldZ);
    const m = Math3D.createMat4();
    Math3D.translateMat4(m, m, [this.worldX, this.worldY, this.worldZ]);
    Math3D.rotateY(m, m, angle);

    const modelObj = this.game.models[this.type];
    const tint = (this.hitTimer > 0) ? [1.0, 1.0, 1.0, 0.7] : null;
    renderer.drawMesh(modelObj.mesh, m, tint);
  }
}

class EnemyManager {
  constructor(game) {
    this.game = game;
    this.enemies = [];
    this.spawnTimer = 1.0;
  }

  update(dt, player) {
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = Math.max(1.2, 3.2 - (this.game.wave * 0.15));
      this.spawnNextWaveEnemy(player.worldZ);
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.update(dt, player);

      // Remove inimigos mortos ou que ficaram muito para trás/muito distantes
      if (e.destroyed || (player.worldZ - e.worldZ > 40.0) || (e.worldZ - player.worldZ > 300.0)) {
        this.enemies.splice(i, 1);
      }
    }
  }

  spawnNextWaveEnemy(playerZ) {
    // Probabilidade de caminhões aumenta conforme as ondas avançam
    const truckChance = Math.min(0.55, 0.15 + (this.game.wave - 1) * 0.08);
    let type = 'scout';

    if (this.game.wave >= 4 && Math.random() < truckChance) {
      type = (this.game.wave >= 6 && Math.random() > 0.5) ? 'behemoth' : 'hauler';
    } else {
      const roll = Math.random();
      if (roll < 0.45) type = 'scout';
      else if (roll < 0.8) type = 'cruiser';
      else type = 'enforcer';
    }

    const spawnZ = playerZ + 120.0 + Math.random() * 40.0;
    const laneX = [-7.0, -2.5, 2.5, 7.0][Math.floor(Math.random() * 4)];
    this.enemies.push(new EnemyVehicle(this.game, type, spawnZ, laneX));
  }

  render(renderer) {
    for (const e of this.enemies) {
      e.render(renderer);
    }
  }
}


/* ============================================================================
   10. GERENCIADOR DE OBSTÁCULOS E POWER-UPS
   ============================================================================ */

class ObstacleManager {
  constructor(game) {
    this.game = game;
    this.obstacles = [];
    this.spawnTimer = 2.0;
  }

  update(dt, playerZ) {
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = 3.0 + Math.random() * 2.5;
      this.spawnObstacle(playerZ);
    }

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const o = this.obstacles[i];
      if (playerZ - o.worldZ > 30.0 || o.destroyed) {
        this.obstacles.splice(i, 1);
      }
    }
  }

  spawnObstacle(playerZ) {
    const types = ['barrier', 'crate', 'wreck', 'cone'];
    const type = types[Math.floor(Math.random() * types.length)];
    const spawnZ = playerZ + 140.0 + Math.random() * 30.0;
    // Pelo menos 1 faixa sempre desobstruída para desvio justo
    const laneX = [-6.5, -2.0, 2.0, 6.5][Math.floor(Math.random() * 4)];

    this.obstacles.push({
      type: type,
      worldZ: spawnZ,
      laneX: laneX,
      width: 2.2, height: 1.0, depth: 1.2,
      destroyed: false
    });
  }

  render(renderer) {
    for (const o of this.obstacles) {
      if (o.destroyed) continue;
      const curveCenter = this.game.road.getCurveX(o.worldZ);
      const angle = this.game.road.getTangentAngle(o.worldZ);
      const m = Math3D.createMat4();
      Math3D.translateMat4(m, m, [curveCenter + o.laneX, 0, o.worldZ]);
      Math3D.rotateY(m, m, angle);
      renderer.drawMesh(this.game.models[o.type].mesh, m);
    }
  }
}

class PowerUpManager {
  constructor(game) {
    this.game = game;
    this.items = [];
  }

  spawn(x, z) {
    const types = ['health', 'shield', 'rapid', 'damage'];
    const type = types[Math.floor(Math.random() * types.length)];
    this.items.push({
      type: type,
      x: x, y: 0.8, z: z,
      rot: 0,
      active: true
    });
  }

  update(dt, player) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      item.rot += dt * 3.5;
      item.y = 0.8 + Math.sin(item.rot * 2) * 0.2;

      // Colisão / Coleta com o jogador
      const dist = Math.hypot(item.x - player.worldX, item.z - player.worldZ);
      if (dist < 2.5 && Math.abs(item.y - player.worldY) < 1.8) {
        this.applyPowerUp(item.type, player);
        this.game.sound.playPowerup();
        this.game.debris.spawnHitSparks(item.x, item.y, item.z, 20);
        this.items.splice(i, 1);
        continue;
      }

      if (player.worldZ - item.z > 30.0) {
        this.items.splice(i, 1);
      }
    }
  }

  applyPowerUp(type, player) {
    if (type === 'health') {
      player.hp = Math.min(player.maxHp, player.hp + 200);
    } else if (type === 'shield') {
      player.shieldTimer = 10.0;
    } else if (type === 'rapid') {
      player.rapidFireTimer = 10.0;
    } else if (type === 'damage') {
      player.doubleDamageTimer = 10.0;
    }
  }

  render(renderer) {
    for (const item of this.items) {
      const m = Math3D.createMat4();
      Math3D.translateMat4(m, m, [item.x, item.y, item.z]);
      Math3D.rotateY(m, m, item.rot);
      const modelKey = 'token_' + item.type;
      if (this.game.models[modelKey]) {
        renderer.drawMesh(this.game.models[modelKey].mesh, m);
      }
    }
  }
}


/* ============================================================================
   11. CÂMERA 3D DINÂMICA
   ============================================================================ */

class DynamicCamera {
  constructor() {
    this.eye = [0, 5.0, -10.0];
    this.target = [0, 1.2, 10.0];
    this.up = [0, 1, 0];

    this.smoothPos = [0, 5.0, -10.0];
    this.shakeAmount = 0;
  }

  addShake(amount) {
    this.shakeAmount = Math.min(1.0, this.shakeAmount + amount);
  }

  update(dt, player, road, allowShake = true) {
    if (this.shakeAmount > 0) {
      this.shakeAmount -= dt * 2.2;
      if (this.shakeAmount < 0) this.shakeAmount = 0;
    }

    const shakeOffset = (allowShake && this.shakeAmount > 0) ? (Math.random() - 0.5) * this.shakeAmount * 1.2 : 0;
    const roadAngle = road.getTangentAngle(player.worldZ);

    // Câmera posicionada suavemente atrás e acima do veículo
    const followDist = 8.5;
    const height = 3.6;

    const targetEyeX = player.worldX - Math.sin(roadAngle) * followDist + shakeOffset;
    const targetEyeY = player.worldY + height + shakeOffset * 0.5;
    const targetEyeZ = player.worldZ - Math.cos(roadAngle) * followDist;

    // Interpolação suave (Lerp)
    const factor = Math.min(1.0, dt * 8.0);
    this.smoothPos[0] += (targetEyeX - this.smoothPos[0]) * factor;
    this.smoothPos[1] += (targetEyeY - this.smoothPos[1]) * factor;
    this.smoothPos[2] += (targetEyeZ - this.smoothPos[2]) * factor;

    this.eye[0] = this.smoothPos[0];
    this.eye[1] = this.smoothPos[1];
    this.eye[2] = this.smoothPos[2];

    // Alvo do olhar à frente na estrada
    this.target[0] = player.worldX + Math.sin(roadAngle) * 20.0;
    this.target[1] = player.worldY + 1.2;
    this.target[2] = player.worldZ + Math.cos(roadAngle) * 20.0;

    // Suave inclinação em Roll
    this.up[0] = Math.sin(-player.tiltRoll * 0.4);
    this.up[1] = Math.cos(-player.tiltRoll * 0.4);
    this.up[2] = 0;
  }
}


/* ============================================================================
   12. NÚCLEO DO JOGO E LOOP PRINCIPAL (GAME LOOP)
   ============================================================================ */

class Game {
  constructor() {
    this.canvas = document.getElementById('glCanvas');
    this.renderer = new WebGLRenderer(this.canvas);
    this.sound = new SoundSystem();
    this.camera = new DynamicCamera();
    this.road = new RoadManager(this.renderer);
    this.debris = new DebrisParticleSystem(this.renderer);
    this.weapons = new WeaponSystem(this);
    this.enemies = new EnemyManager(this);
    this.obstacles = new ObstacleManager(this);
    this.powerups = new PowerUpManager(this);

    // Inicialização dos Modelos Voxel
    this.models = {
      interceptor: VoxelBuilder.buildInterceptor(this.renderer),
      raptor: VoxelBuilder.buildRaptor(this.renderer),
      titan: VoxelBuilder.buildTitan(this.renderer),
      scout: VoxelBuilder.buildEnemyScout(this.renderer),
      cruiser: VoxelBuilder.buildEnemyCruiser(this.renderer),
      enforcer: VoxelBuilder.buildEnemyEnforcer(this.renderer),
      hauler: VoxelBuilder.buildEnemyHauler(this.renderer),
      behemoth: VoxelBuilder.buildEnemyBehemoth(this.renderer),
      barrier: VoxelBuilder.buildBarrier(this.renderer),
      crate: VoxelBuilder.buildCrate(this.renderer),
      wreck: VoxelBuilder.buildWreck(this.renderer),
      cone: VoxelBuilder.buildCone(this.renderer),
      token_health: VoxelBuilder.buildTokenHealth(this.renderer),
      token_shield: VoxelBuilder.buildTokenShield(this.renderer),
      token_rapid: VoxelBuilder.buildTokenRapid(this.renderer),
      token_damage: VoxelBuilder.buildTokenDamage(this.renderer),
      shield_bubble: VoxelBuilder.buildShieldBubble(this.renderer)
    };

    // Configurações do Usuário
    this.settings = {
      masterVol: 80,
      musicVol: 65,
      sfxVol: 85,
      sensitivity: 100,
      cameraShake: true,
      graphics: 'high'
    };

    // Estado da Sessão
    this.state = 'MENU'; // 'MENU', 'SELECT', 'PLAYING', 'GAMEOVER'
    this.selectedVehicle = 'interceptor';
    this.selectedWeapon = 'machinegun';

    // Pontuação e Combos
    this.score = 0;
    this.distance = 0;
    this.wave = 1;
    this.kills = 0;
    this.combo = 1;
    this.maxCombo = 1;
    this.comboTimer = 0;

    // Inputs
    this.inputs = { left: false, right: false, shootPressed: false };

    this.player = new PlayerVehicle(this, this.selectedVehicle);
    this.menuPreviewAngle = 0;

    this.setupEvents();
    this.setupUI();

    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  setupEvents() {
    window.addEventListener('keydown', (e) => {
      // Ativa e resume o contexto de áudio nativo no primeiro input do usuário
      if (this.sound) {
        this.sound.init();
        this.sound.resume();
      }

      if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.inputs.left = true;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') this.inputs.right = true;
      if (e.code === 'Space') {
        e.preventDefault();
        // Não permite tiro automático: cada pressão da tecla dispara um tiro
        if (!e.repeat) {
          this.inputs.shootPressed = true;
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.inputs.left = false;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') this.inputs.right = false;
    });

    window.addEventListener('pointerdown', () => {
      if (this.sound) {
        this.sound.init();
        this.sound.resume();
      }
    });

    window.addEventListener('resize', () => this.renderer.resize());
  }

  setupUI() {
    // Botões do Menu Principal
    document.getElementById('btn-menu-play').addEventListener('click', () => {
      this.sound.playClick();
      this.showScreen('screen-select');
    });

    document.getElementById('btn-menu-how').addEventListener('click', () => {
      this.sound.playClick();
      this.showScreen('screen-how-to-play');
    });

    document.getElementById('btn-menu-settings').addEventListener('click', () => {
      this.sound.playClick();
      this.showScreen('screen-settings');
    });

    // Botões de Voltar dos Modais
    document.getElementById('btn-how-back').addEventListener('click', () => {
      this.sound.playClick();
      this.showScreen('screen-main-menu');
    });

    document.getElementById('btn-settings-back').addEventListener('click', () => {
      this.sound.playClick();
      this.showScreen('screen-main-menu');
    });

    document.getElementById('btn-select-back').addEventListener('click', () => {
      this.sound.playClick();
      this.showScreen('screen-main-menu');
    });

    // Seleção de Veículos
    const vehicleCards = document.querySelectorAll('#vehicle-cards .selection-card');
    vehicleCards.forEach((card) => {
      card.addEventListener('click', () => {
        this.sound.playClick();
        vehicleCards.forEach((c) => c.classList.remove('selected'));
        card.classList.add('selected');
        this.selectedVehicle = card.dataset.vehicle;
      });
    });

    // Seleção de Armas
    const weaponCards = document.querySelectorAll('#weapon-cards .selection-card');
    weaponCards.forEach((card) => {
      card.addEventListener('click', () => {
        this.sound.playClick();
        weaponCards.forEach((c) => c.classList.remove('selected'));
        card.classList.add('selected');
        this.selectedWeapon = card.dataset.weapon;
      });
    });

    // Iniciar Partida
    document.getElementById('btn-start-game').addEventListener('click', () => {
      this.sound.playClick();
      this.startNewGame();
    });

    // Botões de Game Over
    document.getElementById('btn-game-restart').addEventListener('click', () => {
      this.sound.playClick();
      this.startNewGame();
    });

    document.getElementById('btn-game-menu').addEventListener('click', () => {
      this.sound.playClick();
      this.showScreen('screen-main-menu');
      this.state = 'MENU';
    });

    // Controles de Configurações
    const masterSlider = document.getElementById('setting-master-vol');
    const masterLabel = document.getElementById('label-master-vol');
    masterSlider.addEventListener('input', (e) => {
      this.settings.masterVol = parseInt(e.target.value);
      masterLabel.textContent = e.target.value + '%';
      this.sound.setMasterVolume(this.settings.masterVol / 100);
    });

    const musicSlider = document.getElementById('setting-music-vol');
    const musicLabel = document.getElementById('label-music-vol');
    musicSlider.addEventListener('input', (e) => {
      this.settings.musicVol = parseInt(e.target.value);
      musicLabel.textContent = e.target.value + '%';
      this.sound.setMusicVolume(this.settings.musicVol / 100);
    });

    const sfxSlider = document.getElementById('setting-sfx-vol');
    const sfxLabel = document.getElementById('label-sfx-vol');
    sfxSlider.addEventListener('input', (e) => {
      this.settings.sfxVol = parseInt(e.target.value);
      sfxLabel.textContent = e.target.value + '%';
      this.sound.setSfxVolume(this.settings.sfxVol / 100);
    });

    const sensSlider = document.getElementById('setting-sensitivity');
    const sensLabel = document.getElementById('label-sensitivity');
    sensSlider.addEventListener('input', (e) => {
      this.settings.sensitivity = parseInt(e.target.value);
      sensLabel.textContent = e.target.value + '%';
    });

    const shakeCheck = document.getElementById('setting-shake');
    shakeCheck.addEventListener('change', (e) => {
      this.settings.cameraShake = e.target.checked;
    });

    const graphicsSelect = document.getElementById('setting-graphics');
    graphicsSelect.addEventListener('change', (e) => {
      this.settings.graphics = e.target.value;
      if (this.settings.graphics === 'low') {
        this.debris.maxDebris = 120;
        this.debris.maxParticles = 150;
      } else if (this.settings.graphics === 'medium') {
        this.debris.maxDebris = 250;
        this.debris.maxParticles = 300;
      } else {
        this.debris.maxDebris = 400;
        this.debris.maxParticles = 500;
      }
    });
  }

  showScreen(screenId) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.add('hidden'));
    const target = document.getElementById(screenId);
    if (target) target.classList.remove('hidden');

    const hud = document.getElementById('hud');
    if (screenId === 'hud') {
      hud.classList.remove('hidden');
    } else {
      hud.classList.add('hidden');
    }
  }

  startNewGame() {
    this.sound.init();
    this.sound.resume();

    this.score = 0;
    this.distance = 0;
    this.wave = 1;
    this.kills = 0;
    this.combo = 1;
    this.maxCombo = 1;
    this.comboTimer = 0;

    this.player = new PlayerVehicle(this, this.selectedVehicle);
    this.enemies.enemies = [];
    this.obstacles.obstacles = [];
    this.powerups.items = [];
    this.weapons.projectiles = [];
    this.debris.debrisList = [];
    this.debris.particleList = [];

    this.state = 'PLAYING';
    this.showScreen('hud');

    this.showWaveAnnouncement(1, 'PREPARE-SE');
  }

  showWaveAnnouncement(waveNum, subtitle = '') {
    const banner = document.getElementById('hud-wave-banner');
    const title = document.getElementById('hud-wave-title');
    const sub = document.getElementById('hud-wave-subtitle');
    const tag = document.getElementById('hud-wave-tag');

    if (waveNum >= 4) {
      banner.classList.add('danger');
    } else {
      banner.classList.remove('danger');
    }

    title.textContent = (waveNum >= 4 && waveNum % 2 === 0) ? 'PERIGO: ONDA PESADA' : `ONDA ${waveNum}`;
    sub.textContent = subtitle || 'FROTA INIMIGA DETECTADA';
    tag.textContent = `ONDA ${waveNum}`;

    banner.classList.remove('hidden');
    // Reinicia animação CSS
    banner.style.animation = 'none';
    banner.offsetHeight; // trigger reflow
    banner.style.animation = '';

    setTimeout(() => {
      banner.classList.add('hidden');
    }, 2400);
  }

  addScore(pts) {
    this.score += pts * this.combo;
  }

  addKill() {
    this.kills++;
    this.combo = Math.min(10, this.combo + 1);
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    this.comboTimer = 4.0; // 4 segundos para manter combo

    const comboPanel = document.getElementById('hud-combo-panel');
    const comboMult = document.getElementById('hud-combo-mult');
    if (this.combo > 1) {
      comboPanel.classList.remove('hidden');
      comboMult.textContent = `x${this.combo}`;
      comboPanel.style.animation = 'none';
      comboPanel.offsetHeight;
      comboPanel.style.animation = '';
    }
  }

  onPlayerDied() {
    this.state = 'GAMEOVER';
    this.sound.playExplosion(true);
    this.camera.addShake(0.8);

    const modelObj = this.models[this.player.type];
    this.debris.spawnVehicleDestruction(
      this.player.worldX, this.player.worldY, this.player.worldZ,
      modelObj.boxes, 1.6
    );

    // Exibe tela de Game Over após breve desaceleração
    setTimeout(() => {
      document.getElementById('go-distance').textContent = `${Math.floor(this.distance)} m`;
      document.getElementById('go-score').textContent = this.score.toLocaleString();
      document.getElementById('go-enemies').textContent = this.kills;
      document.getElementById('go-combo').textContent = `x${this.maxCombo}`;
      document.getElementById('go-wave').textContent = `Onda ${this.wave}`;
      this.showScreen('screen-game-over');
    }, 1200);
  }

  // Detecção de Colisões Físicas 3D (AABB)
  checkCollisions() {
    const p = this.player;
    if (p.destroyed) return;

    // 1. Projéteis do Jogador contra Inimigos
    for (const proj of this.weapons.projectiles) {
      if (!proj.active || !proj.isPlayer) continue;

      for (const e of this.enemies.enemies) {
        if (e.destroyed) continue;
        const dx = Math.abs(proj.x - e.worldX);
        const dz = Math.abs(proj.z - e.worldZ);
        if (dx < e.stats.width / 2 + 0.3 && dz < e.stats.depth / 2 + 0.3) {
          proj.active = false;
          e.takeDamage(proj.damage);
          this.debris.spawnHitSparks(proj.x, proj.y, proj.z, 6);
          break;
        }
      }

      // Projéteis contra Obstáculos
      if (proj.active) {
        for (const o of this.obstacles.obstacles) {
          if (o.destroyed) continue;
          const curveX = this.road.getCurveX(o.worldZ);
          const dx = Math.abs(proj.x - (curveX + o.laneX));
          const dz = Math.abs(proj.z - o.worldZ);
          if (dx < o.width / 2 + 0.2 && dz < o.depth / 2 + 0.2) {
            proj.active = false;
            o.destroyed = true;
            this.debris.spawnHitSparks(proj.x, proj.y, proj.z, 10);
            this.sound.playHit();
            break;
          }
        }
      }
    }

    // 2. Projéteis Inimigos contra o Jogador
    for (const proj of this.weapons.projectiles) {
      if (!proj.active || proj.isPlayer) continue;
      const dx = Math.abs(proj.x - p.worldX);
      const dz = Math.abs(proj.z - p.worldZ);
      if (dx < p.stats.width / 2 && dz < p.stats.depth / 2) {
        proj.active = false;
        p.takeDamage(proj.damage, false);
        this.debris.spawnHitSparks(proj.x, proj.y, proj.z, 8);
      }
    }

    // 3. Colisão Física: Jogador contra Inimigos
    for (const e of this.enemies.enemies) {
      if (e.destroyed) continue;
      const dx = Math.abs(p.worldX - e.worldX);
      const dz = Math.abs(p.worldZ - e.worldZ);
      const minX = (p.stats.width + e.stats.width) / 2;
      const minZ = (p.stats.depth + e.stats.depth) / 2;

      if (dx < minX && dz < minZ) {
        // Empurrão lateral mútuo
        const pushDir = (p.worldX > e.worldX) ? 1 : -1;
        p.laneX += pushDir * 1.5;
        e.laneX -= pushDir * 1.5;

        const crashDmg = e.stats.isTruck ? 180 : 80;
        p.takeDamage(crashDmg, true);
        e.takeDamage(120);

        this.sound.playCrash();
        this.debris.spawnHitSparks((p.worldX + e.worldX) / 2, p.worldY, p.worldZ, 15);
      }
    }

    // 4. Colisão: Jogador contra Obstáculos
    for (const o of this.obstacles.obstacles) {
      if (o.destroyed) continue;
      const curveX = this.road.getCurveX(o.worldZ);
      const obsX = curveX + o.laneX;
      const dx = Math.abs(p.worldX - obsX);
      const dz = Math.abs(p.worldZ - o.worldZ);
      if (dx < (p.stats.width + o.width) / 2 && dz < (p.stats.depth + o.depth) / 2) {
        o.destroyed = true;
        p.takeDamage(100, true);
        this.sound.playCrash();
        this.debris.spawnHitSparks(obsX, 0.6, o.worldZ, 20);
      }
    }
  }

  updateHUD(dt) {
    // Barra de Vida
    const hpText = document.getElementById('hud-hp-text');
    const hpFill = document.getElementById('hud-hp-fill');
    const shieldFill = document.getElementById('hud-shield-fill');
    const shieldBadge = document.getElementById('hud-shield-badge');

    if (hpText && hpFill) {
      hpText.textContent = `${Math.ceil(this.player.hp)} / ${this.player.maxHp}`;
      hpFill.style.width = `${Math.max(0, (this.player.hp / this.player.maxHp) * 100)}%`;
    }

    if (this.player.shieldTimer > 0) {
      shieldBadge.classList.remove('hidden');
      shieldFill.style.width = `${(this.player.shieldTimer / 10.0) * 100}%`;
    } else {
      shieldBadge.classList.add('hidden');
      shieldFill.style.width = '0%';
    }

    // Distância e Pontuação
    document.getElementById('hud-distance').textContent = `${Math.floor(this.distance)} m`;
    document.getElementById('hud-score').textContent = this.score.toLocaleString();

    // Combo
    const comboPanel = document.getElementById('hud-combo-panel');
    const comboFill = document.getElementById('hud-combo-fill');
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      comboFill.style.width = `${(this.comboTimer / 4.0) * 100}%`;
      if (this.comboTimer <= 0) {
        this.combo = 1;
        comboPanel.classList.add('hidden');
      }
    }

    // Power-ups
    const rapidCard = document.getElementById('powerup-rapid-fire');
    const rapidFill = document.getElementById('powerup-rapid-fill');
    if (this.player.rapidFireTimer > 0) {
      rapidCard.classList.remove('hidden');
      rapidFill.style.width = `${(this.player.rapidFireTimer / 10.0) * 100}%`;
    } else {
      rapidCard.classList.add('hidden');
    }

    const damageCard = document.getElementById('powerup-double-damage');
    const damageFill = document.getElementById('powerup-damage-fill');
    if (this.player.doubleDamageTimer > 0) {
      damageCard.classList.remove('hidden');
      damageFill.style.width = `${(this.player.doubleDamageTimer / 10.0) * 100}%`;
    } else {
      damageCard.classList.add('hidden');
    }

    // Barras de HP Flutuantes acima dos Inimigos (Projeção 3D -> 2D)
    this.updateEnemyHealthBars();
  }

  updateEnemyHealthBars() {
    const container = document.getElementById('enemy-health-bars');
    if (!container) return;
    container.innerHTML = '';

    const width = this.canvas.width;
    const height = this.canvas.height;

    for (const e of this.enemies.enemies) {
      // Exibe barra se o inimigo sofreu dano recente ou está muito próximo
      if (e.hp < e.maxHp && !e.destroyed) {
        const screenPos = Math3D.projectToScreen(
          [e.worldX, e.worldY + e.stats.height + 0.6, e.worldZ],
          this.renderer.matViewProj, width, height
        );
        if (screenPos && screenPos.depth < 120.0) {
          const bar = document.createElement('div');
          bar.className = 'enemy-hp-bar';
          bar.style.left = `${screenPos.x}px`;
          bar.style.top = `${screenPos.y}px`;

          const fill = document.createElement('div');
          fill.className = 'enemy-hp-fill';
          fill.style.width = `${Math.max(0, (e.hp / e.maxHp) * 100)}%`;

          bar.appendChild(fill);
          container.appendChild(bar);
        }
      }
    }
  }

  // Loop Principal (requestAnimationFrame)
  loop(timestamp) {
    const dt = Math.min(0.06, (timestamp - this.lastTime) / 1000.0);
    this.lastTime = timestamp;

    if (this.state === 'PLAYING') {
      // 1. Atualizações do Jogador e Controles
      this.player.update(dt, this.inputs);

      if (this.inputs.shootPressed) {
        this.inputs.shootPressed = false; // Consome o disparo individual
        const roadAngle = this.road.getTangentAngle(this.player.worldZ);
        this.weapons.firePlayer(
          this.selectedWeapon,
          this.player.worldX, this.player.worldY, this.player.worldZ,
          roadAngle,
          this.player.doubleDamageTimer > 0,
          this.player.rapidFireTimer > 0
        );
      }

      // 2. Progresso de Distância, Pontuação e Ondas
      this.distance = this.player.worldZ;
      this.score += Math.floor(dt * this.player.forwardSpeed * 0.4); // Bônus progressivo por distância percorrida
      const targetWave = Math.floor(this.distance / 450) + 1;
      if (targetWave > this.wave) {
        this.wave = targetWave;
        this.showWaveAnnouncement(this.wave);
      }

      // 3. Gerenciamento de Entidades
      this.road.updateBiome(this.distance);
      this.enemies.update(dt, this.player);
      this.obstacles.update(dt, this.player.worldZ);
      this.powerups.update(dt, this.player);
      this.weapons.update(dt);
      this.debris.update(dt);

      // 4. Física e Colisões
      this.checkCollisions();

      // 5. Câmera Dinâmica
      this.camera.update(dt, this.player, this.road, this.settings.cameraShake);

      // 6. Atualização de Interface
      this.updateHUD(dt);

      // 7. Renderização da Cena 3D
      this.renderer.beginFrame(this.camera);
      this.road.render(this.renderer, this.player.worldZ);
      this.obstacles.render(this.renderer);
      this.powerups.render(this.renderer);
      this.enemies.render(this.renderer);
      this.player.render(this.renderer);
      this.weapons.render(this.renderer);
      this.debris.render(this.renderer);

    } else if (this.state === 'MENU' || this.state === 'SELECT') {
      // Modo Vitrine 3D no Menu: câmera gira suavemente ao redor do veículo
      this.menuPreviewAngle += dt * 0.9;
      const previewCam = {
        eye: [Math.sin(this.menuPreviewAngle) * 6.5, 3.0, Math.cos(this.menuPreviewAngle) * 6.5],
        target: [0, 0.4, 0],
        up: [0, 1, 0]
      };

      this.renderer.beginFrame(previewCam);

      // Chão do showroom do menu
      const floorMat = Math3D.createMat4();
      Math3D.translateMat4(floorMat, floorMat, [0, -0.1, 0]);
      Math3D.scaleMat4(floorMat, floorMat, [1.5, 1, 1.5]);
      this.renderer.drawMesh(this.road.roadMesh, floorMat);

      // Veículo selecionado girando em tempo real
      const m = Math3D.createMat4();
      Math3D.translateMat4(m, m, [0, 0.5 + Math.sin(this.menuPreviewAngle * 3) * 0.08, 0]);
      const activeModelKey = this.selectedVehicle || 'interceptor';
      this.renderer.drawMesh(this.models[activeModelKey].mesh, m);

    } else if (this.state === 'GAMEOVER') {
      // Atualiza apenas os detritos e partículas após o veículo ser destruído
      this.debris.update(dt);
      this.renderer.beginFrame(this.camera);
      this.road.render(this.renderer, this.player.worldZ);
      this.enemies.render(this.renderer);
      this.debris.render(this.renderer);
    }

    requestAnimationFrame((t) => this.loop(t));
  }
}

// Inicialização automática quando o DOM carregar
window.addEventListener('DOMContentLoaded', () => {
  window.gameInstance = new Game();
});
