
import { getFragmentShader, vertexShader } from './shaders';
import { PaletteManager, Vector3, Tween } from './engine';

export interface VibeConfig {
  hue?: number;
  energy?: number;
  baseScale?: number;
  colors?: [number, number, number][];
  blobCount?: number; // Dynamic blob count based on actual mood types
}

export class VibeController {
  canvas: HTMLCanvasElement;
  gl: WebGLRenderingContext;
  program: WebGLProgram | null = null;
  
  // State
  startTime: number;
  width: number = 0;
  height: number = 0;
  dpr: number = 1;
  
  // Logic
  palette: PaletteManager;
  energy: Tween;
  baseScale: number = 1;
  rotation: Vector3[];
  time: number = 0; // Internal time for shader
  blobCount: number = 3; // Default blob count
  
  // Uniform locations
  uniforms: Record<string, WebGLUniformLocation | null> = {};
  
  // Loop
  animationFrameId: number | null = null;
  lastTime: number = 0;

  constructor(canvas: HTMLCanvasElement, config: VibeConfig = {}) {
    this.canvas = canvas;
    const gl = canvas.getContext('webgl', { 
      alpha: true, 
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
      premultipliedAlpha: true // Default is true, important for transparency
    });

    if (!gl) throw new Error('WebGL not supported');
    this.gl = gl;
    
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.startTime = performance.now();
    
    this.palette = new PaletteManager(config.hue ?? 10);
    this.energy = new Tween(config.energy ?? 0.2, config.energy ?? 0.2, 1000);
    this.baseScale = config.baseScale ?? 1;
    this.blobCount = config.blobCount ?? (config.colors?.length ?? 3);
    
    this.rotation = [
      new Vector3(-0.3, 0.3, 0.2),
      new Vector3(-0.3, -0.3, -0.2),
      new Vector3(-0.3, -0.3, 0.2),
      new Vector3(0.3, 0.3, -0.2),
      new Vector3(0.3, -0.3, 0.2),
      new Vector3(0.0, 0.3, 0.2)
    ];
    
    this.init();
    this.updateConfig(config);
    
    // Initial resize to ensure state is correct
    this.resize(canvas.width / this.dpr, canvas.height / this.dpr);
  }

  private init() {
    // Use dynamic blob count, clamped to 1-6 range
    const clampedBlobCount = Math.max(1, Math.min(6, this.blobCount));
    const fragmentShaderSrc = getFragmentShader(clampedBlobCount, true); 
    const program = this.createProgram(vertexShader, fragmentShaderSrc);
    if (!program) return;
    this.program = program;

    this.gl.useProgram(program);

    const uNames = [
      'vScreenSize', 'vTime', 'vScale', 'vColorBackground', 
      'vColor', 'vRotation', 'vAudio', 'vReact', 
      'vInteractionPoint', 'vInteraction'
    ];
    
    uNames.forEach(name => {
      this.uniforms[name] = this.gl.getUniformLocation(program, name);
    });

    const buffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    const vertices = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
       1,  1
    ]);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);
    
    const positionLoc = this.gl.getAttribLocation(program, 'position');
    this.gl.enableVertexAttribArray(positionLoc);
    this.gl.vertexAttribPointer(positionLoc, 2, this.gl.FLOAT, false, 0, 0);
  }

  private createProgram(vsSource: string, fsSource: string): WebGLProgram | null {
    const vs = this.compileShader(this.gl.VERTEX_SHADER, vsSource);
    const fs = this.compileShader(this.gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) return null;

    const prog = this.gl.createProgram();
    if (!prog) return null;
    
    this.gl.attachShader(prog, vs);
    this.gl.attachShader(prog, fs);
    this.gl.linkProgram(prog);

    if (!this.gl.getProgramParameter(prog, this.gl.LINK_STATUS)) {
      console.error(this.gl.getProgramInfoLog(prog));
      return null;
    }
    return prog;
  }

  private compileShader(type: number, source: string): WebGLShader | null {
    const shader = this.gl.createShader(type);
    if (!shader) return null;
    
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error(this.gl.getShaderInfoLog(shader));
      this.gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    
    const displayWidth = Math.floor(width * this.dpr);
    const displayHeight = Math.floor(height * this.dpr);

    // Force resize if needed, or just update viewport
    if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
        this.canvas.width = displayWidth;
        this.canvas.height = displayHeight;
    }
    this.gl.viewport(0, 0, displayWidth, displayHeight);
  }

  start() {
    if (!this.animationFrameId) {
      this.lastTime = performance.now();
      this.animate();
    }
  }

  stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  updateConfig(config: VibeConfig) {
    // Check if blob count changed - requires shader recompilation
    const newBlobCount = config.blobCount ?? (config.colors?.length ?? this.blobCount);
    if (newBlobCount !== this.blobCount) {
      this.blobCount = newBlobCount;
      // Reinitialize shader with new blob count
      this.init();
    }
    
    if (config.colors) {
         this.palette.update(0, undefined, config.colors);
    } else if (config.hue !== undefined) {
         this.palette.update(config.hue);
    }
    if (config.energy !== undefined) this.energy.update(config.energy);
    if (config.baseScale !== undefined) this.baseScale = config.baseScale;
  }

  private animate = () => {
    if (!this.program) return;

    const now = performance.now();
    const dt = now - this.lastTime;
    this.lastTime = now;

    this.energy.next(dt);
    this.palette.next(dt);
    
    this.time += (this.energy.value * dt) / 1000;
    
    // Clear buffer to fully transparent
    this.gl.clearColor(0, 0, 0, 0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    this.render();

    this.animationFrameId = requestAnimationFrame(this.animate);
  };

  private render() {
    const { vScreenSize, vTime, vScale, vColor, vColorBackground, vRotation, vAudio, vReact, vInteractionPoint, vInteraction } = this.uniforms;
    
    if (vScreenSize) this.gl.uniform2f(vScreenSize, this.canvas.width, this.canvas.height);
    if (vTime) this.gl.uniform1f(vTime, this.time);
    
    // Adaptive Scale Logic matching reference
    // Increased scale factors to make blobs larger (was 0.4/0.35, now 0.55/0.5)
    const isMobile = this.width < 500; // Use logical width for breakpoint
    const scaleFactor = isMobile ? 0.55 : 0.5;
    if (vScale) this.gl.uniform1f(vScale, this.baseScale * scaleFactor);
    
    if (vColor) {
      const colors = this.palette.value.flat();
      this.gl.uniform3fv(vColor, new Float32Array(colors));
    }
    // Transparent background
    if (vColorBackground) this.gl.uniform4f(vColorBackground, 0, 0, 0, 0);

    if (vRotation && this.rotation[0]) {
      const rotations: number[] = [];
      const maxRotations = Math.min(6, this.blobCount);
      for (let i = 0; i < maxRotations; i++) {
          if (this.rotation[i]) {
              rotations.push(this.rotation[i]!.x, this.rotation[i]!.y, this.rotation[i]!.z);
          } else {
              rotations.push(0, 0, 0);
          }
      }
      this.gl.uniform3fv(vRotation, new Float32Array(rotations));
    }

    if (vAudio) {
      const audioData = new Array(Math.min(6, this.blobCount)).fill(0);
      this.gl.uniform1fv(vAudio, new Float32Array(audioData));
    }
    if (vReact) {
      const reactData = new Array(Math.min(6, this.blobCount)).fill(0);
      this.gl.uniform1fv(vReact, new Float32Array(reactData));
    }
    if (vInteractionPoint) this.gl.uniform2f(vInteractionPoint, 0, 0);
    if (vInteraction) this.gl.uniform1f(vInteraction, 0);

    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
  }
}
