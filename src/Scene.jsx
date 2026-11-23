import { useEffect, useRef } from "react";
import * as THREE from "three";

// Floating 3D objects that react to the pointer. Pauses when off-screen to save battery.
export default function Scene() {
  const host = useRef();
  useEffect(() => {
    const el = host.current;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    cam.position.z = 9;

    scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    const lime = new THREE.PointLight(0xc6ff3d, 90, 30); lime.position.set(-5, 3, 5);
    const violet = new THREE.PointLight(0x8b5cf6, 120, 30); violet.position.set(5, -3, 4);
    scene.add(lime, violet);

    const group = new THREE.Group(); scene.add(group);
    const metal = (c) => new THREE.MeshStandardMaterial({ color: c, metalness: 0.85, roughness: 0.22 });
    const knot = new THREE.Mesh(new THREE.TorusKnotGeometry(1.5, 0.45, 160, 20), metal(0x6d3df0)); knot.position.set(2.6, 0.2, 0);
    const ico = new THREE.Mesh(new THREE.IcosahedronGeometry(1.2, 1), new THREE.MeshBasicMaterial({ color: 0xc6ff3d, wireframe: true })); ico.position.set(-3.4, 1.4, -1);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.12, 24, 80), metal(0xc6ff3d)); ring.position.set(-1.2, -2.2, 1);
    const oct = new THREE.Mesh(new THREE.OctahedronGeometry(0.55), metal(0xf2efe6)); oct.position.set(0.8, 2.6, 0.5);
    group.add(knot, ico, ring, oct);
    const meshes = [knot, ico, ring, oct];

    const N = 450, pos = new Float32Array(N * 3);
    for (let i = 0; i < pos.length; i++) pos[i] = (Math.random() - 0.5) * 24;
    const pg = new THREE.BufferGeometry(); pg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const stars = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0xf2efe6, size: 0.03, transparent: true, opacity: 0.7 }));
    scene.add(stars);

    const mouse = { x: 0, y: 0 };
    const onMove = (e) => { mouse.x = (e.clientX / innerWidth - 0.5) * 2; mouse.y = (e.clientY / innerHeight - 0.5) * 2; };
    window.addEventListener("pointermove", onMove, { passive: true });

    const resize = () => {
      const w = el.clientWidth, h = el.clientHeight;
      renderer.setSize(w, h); cam.aspect = w / h; cam.updateProjectionMatrix();
      group.scale.setScalar(w < 700 ? 0.6 : 1);
    };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(el);

    let raf, visible = true;
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0 }); io.observe(el);
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const clock = new THREE.Clock();
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!visible) return;
      const t = clock.getElapsedTime() * (reduce ? 0 : 1);
      meshes.forEach((m, i) => { m.rotation.x = t * 0.25 + i; m.rotation.y = t * 0.35; m.position.y += Math.sin(t + i * 2) * 0.002; });
      group.rotation.y += (mouse.x * 0.35 - group.rotation.y) * 0.05;
      group.rotation.x += (mouse.y * 0.2 - group.rotation.x) * 0.05;
      cam.position.x += (mouse.x * 0.8 - cam.position.x) * 0.04;
      cam.position.y += (-mouse.y * 0.5 - cam.position.y) * 0.04;
      cam.lookAt(0, 0, 0);
      stars.rotation.y = t * 0.02;
      renderer.render(scene, cam);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
      window.removeEventListener("pointermove", onMove);
      scene.traverse((o) => { o.geometry?.dispose(); o.material?.dispose?.(); });
      renderer.dispose(); renderer.domElement.remove();
    };
  }, []);
  return <div ref={host} className="scene" aria-hidden="true" />;
}
