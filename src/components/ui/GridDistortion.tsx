// React Bits GridDistortion, typed for this project.
// A WebGL plane that samples an image and warps it around the cursor.

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import './GridDistortion.css';

const vertexShader = `
uniform float time;
varying vec2 vUv;
varying vec3 vPosition;

void main() {
  vUv = uv;
  vPosition = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const fragmentShader = `
uniform sampler2D uDataTexture;
uniform sampler2D uTexture;
uniform vec4 resolution;
varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  vec4 offset = texture2D(uDataTexture, vUv);
  gl_FragColor = texture2D(uTexture, uv - 0.02 * offset.rg);
}`;

type GridDistortionProps = {
  grid?: number;
  mouse?: number;
  strength?: number;
  relaxation?: number;
  imageSrc: string;
  className?: string;
};

const GridDistortion = ({
  grid = 15,
  mouse = 0.1,
  strength = 0.15,
  relaxation = 0.9,
  imageSrc,
  className = '',
}: GridDistortionProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // A shader that repaints every frame is the wrong trade for someone who
    // asked the OS to calm animations down.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const camera = new THREE.OrthographicCamera(0, 0, 0, 0, -1000, 1000);
    camera.position.z = 2;

    const uniforms = {
      time: { value: 0 },
      resolution: { value: new THREE.Vector4() },
      uTexture: { value: null as THREE.Texture | null },
      uDataTexture: { value: null as THREE.DataTexture | null },
    };

    const size = grid;
    const data = new Float32Array(4 * size * size);
    for (let i = 0; i < size * size; i++) {
      data[i * 4] = Math.random() * 255 - 125;
      data[i * 4 + 1] = Math.random() * 255 - 125;
    }

    const dataTexture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat, THREE.FloatType);
    dataTexture.needsUpdate = true;
    uniforms.uDataTexture.value = dataTexture;

    const material = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      uniforms,
      vertexShader,
      fragmentShader,
      transparent: true,
    });

    const geometry = new THREE.PlaneGeometry(1, 1, size - 1, size - 1);
    const plane = new THREE.Mesh(geometry, material);
    scene.add(plane);

    const handleResize = () => {
      const rect = container.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      if (width === 0 || height === 0) return;

      const containerAspect = width / height;
      renderer.setSize(width, height);

      // Cover, not contain: a hero background must fill its box, and the source
      // image's aspect rarely matches the viewport.
      const image = uniforms.uTexture.value?.image as { width: number; height: number } | undefined;
      const imageAspect = image?.width && image?.height ? image.width / image.height : containerAspect;
      const scale = Math.max(containerAspect / imageAspect, 1);
      plane.scale.set(imageAspect * scale, scale, 1);

      const frustumHeight = 1;
      const frustumWidth = frustumHeight * containerAspect;
      camera.left = -frustumWidth / 2;
      camera.right = frustumWidth / 2;
      camera.top = frustumHeight / 2;
      camera.bottom = -frustumHeight / 2;
      camera.updateProjectionMatrix();

      uniforms.resolution.value.set(width, height, 1, 1);
    };

    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(imageSrc, texture => {
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      uniforms.uTexture.value = texture;
      handleResize();
    });

    let resizeObserver: ResizeObserver | undefined;
    if (window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => handleResize());
      resizeObserver.observe(container);
    } else {
      window.addEventListener('resize', handleResize);
    }

    const mouseState = { x: 0, y: 0, prevX: 0, prevY: 0, vX: 0, vY: 0 };

    // The hero sits behind the page content, so it never receives its own
    // pointer events — track the cursor on the window and map it into the box.
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1 - (e.clientY - rect.top) / rect.height;
      mouseState.vX = x - mouseState.prevX;
      mouseState.vY = y - mouseState.prevY;
      Object.assign(mouseState, { x, y, prevX: x, prevY: y });
    };

    const handleMouseLeave = () => {
      dataTexture.needsUpdate = true;
      Object.assign(mouseState, { x: 0, y: 0, prevX: 0, prevY: 0, vX: 0, vY: 0 });
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    handleResize();

    let animationId = 0;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      uniforms.time.value += 0.05;

      const frameData = dataTexture.image.data as unknown as Float32Array;
      for (let i = 0; i < size * size; i++) {
        frameData[i * 4] *= relaxation;
        frameData[i * 4 + 1] *= relaxation;
      }

      const gridMouseX = size * mouseState.x;
      const gridMouseY = size * mouseState.y;
      const maxDist = size * mouse;

      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          const distSq = Math.pow(gridMouseX - i, 2) + Math.pow(gridMouseY - j, 2);
          if (distSq < maxDist * maxDist) {
            const index = 4 * (i + size * j);
            const power = Math.min(maxDist / Math.sqrt(distSq), 10);
            frameData[index] += strength * 100 * mouseState.vX * power;
            frameData[index + 1] -= strength * 100 * mouseState.vY * power;
          }
        }
      }

      dataTexture.needsUpdate = true;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      if (resizeObserver) resizeObserver.disconnect();
      else window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);

      renderer.dispose();
      renderer.forceContextLoss();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      geometry.dispose();
      material.dispose();
      dataTexture.dispose();
      uniforms.uTexture.value?.dispose();
    };
  }, [grid, mouse, strength, relaxation, imageSrc]);

  return <div ref={containerRef} className={`distortion-container ${className}`} />;
};

export default GridDistortion;
