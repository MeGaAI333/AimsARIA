import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { FenceSpecification, Material } from '../../../shared/types';

interface FenceVisualizerProps {
  specification: FenceSpecification;
  material: Material | null;
  height?: number;
}

export const FenceVisualizer: React.FC<FenceVisualizerProps> = ({
  specification,
  material,
  height = 400,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  useEffect(() => {
    if (!containerRef.current || !material) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // Sky blue
    scene.fog = new THREE.Fog(0x87ceeb, 100, 1000);
    sceneRef.current = scene;

    // Camera setup
    const width = containerRef.current.clientWidth;
    const aspect = width / height;
    const camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    camera.position.set(40, 15, 40);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 50, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    scene.add(directionalLight);

    // Ground
    const groundGeometry = new THREE.PlaneGeometry(200, 200);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x2d5016 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Fence creation
    const fenceLength = specification.length;
    const fenceHeight = specification.height;
    const fenceWidth = specification.width;

    // Material colors based on type
    const materialColors: Record<string, number> = {
      chainlink: 0x888888,
      vinyl: 0xf5f5f5,
      wood: 0x8b4513,
      aluminum: 0xc0c0c0,
      composite: 0x996633,
    };

    const fenceColor = materialColors[material.type] || 0x888888;

    // Create fence panels
    const panelHeight = fenceHeight;
    const panelWidth = 8; // 8 feet per panel
    const numPanels = Math.ceil(fenceLength / panelWidth);

    for (let i = 0; i < numPanels; i++) {
      const xPos = (i - numPanels / 2) * panelWidth;

      // Fence panel
      const panelGeometry = new THREE.PlaneGeometry(panelWidth, panelHeight);
      const panelMaterial = new THREE.MeshStandardMaterial({
        color: fenceColor,
        roughness: material.type === 'vinyl' ? 0.3 : 0.8,
        metalness: material.type === 'aluminum' ? 0.7 : 0,
      });

      const panel = new THREE.Mesh(panelGeometry, panelMaterial);
      panel.position.set(xPos, panelHeight / 2, 0);
      panel.castShadow = true;
      panel.receiveShadow = true;
      scene.add(panel);

      // Posts
      if (i % 2 === 0) {
        const postGeometry = new THREE.BoxGeometry(0.5, panelHeight + 1, 0.5);
        const postMaterial = new THREE.MeshStandardMaterial({
          color: 0x4a3728,
          roughness: 0.9,
        });
        const post = new THREE.Mesh(postGeometry, postMaterial);
        post.position.set(xPos + panelWidth / 2, (panelHeight + 1) / 2, 0);
        post.castShadow = true;
        post.receiveShadow = true;
        scene.add(post);
      }
    }

    // Gates
    if (specification.gateCount > 0) {
      const gateHeight = fenceHeight;
      const gateWidth = specification.gateWidth;

      for (let i = 0; i < specification.gateCount; i++) {
        const gateXPos = (i - specification.gateCount / 2) * 12;

        // Gate panel
        const gateGeometry = new THREE.PlaneGeometry(gateWidth, gateHeight);
        const gateMaterial = new THREE.MeshStandardMaterial({
          color: Math.floor(fenceColor * 0.8), // Slightly darker
          roughness: 0.8,
        });
        const gate = new THREE.Mesh(gateGeometry, gateMaterial);
        gate.position.set(gateXPos, gateHeight / 2, 2);
        gate.castShadow = true;
        gate.receiveShadow = true;
        scene.add(gate);

        // Gate hinges (simple cylinders)
        const hingeGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.3);
        const hingeMaterial = new THREE.MeshStandardMaterial({
          color: 0xcccccc,
          metalness: 0.9,
        });

        const hinge1 = new THREE.Mesh(hingeGeometry, hingeMaterial);
        hinge1.position.set(gateXPos - gateWidth / 2, gateHeight * 0.2, 2);
        hinge1.rotation.z = Math.PI / 2;
        scene.add(hinge1);

        const hinge2 = new THREE.Mesh(hingeGeometry, hingeMaterial);
        hinge2.position.set(gateXPos - gateWidth / 2, gateHeight * 0.8, 2);
        hinge2.rotation.z = Math.PI / 2;
        scene.add(hinge2);
      }
    }

    // Handle mouse interaction
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    renderer.domElement.addEventListener('mousedown', (e) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    renderer.domElement.addEventListener('mousemove', (e) => {
      if (isDragging) {
        const deltaX = e.clientX - previousMousePosition.x;
        const deltaY = e.clientY - previousMousePosition.y;

        camera.position.applyAxisAngle(
          new THREE.Vector3(0, 1, 0),
          deltaX * 0.005
        );
        camera.position.applyAxisAngle(
          new THREE.Vector3(1, 0, 0),
          deltaY * 0.005
        );
        camera.lookAt(0, 0, 0);

        previousMousePosition = { x: e.clientX, y: e.clientY };
      }
    });

    renderer.domElement.addEventListener('mouseup', () => {
      isDragging = false;
    });

    renderer.domElement.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomSpeed = 0.1;
      const direction = camera.position.clone().normalize();
      const distance = camera.position.length();
      const newDistance = e.deltaY > 0 ? distance + zoomSpeed : distance - zoomSpeed;
      camera.position.copy(direction.multiplyScalar(Math.max(10, newDistance)));
      camera.lookAt(0, 0, 0);
    });

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      if (containerRef.current && cameraRef.current && rendererRef.current) {
        const newWidth = containerRef.current.clientWidth;
        const newAspect = newWidth / height;
        cameraRef.current.aspect = newAspect;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(newWidth, height);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousedown', () => {});
      renderer.domElement.removeEventListener('mousemove', () => {});
      renderer.domElement.removeEventListener('mouseup', () => {});
      renderer.domElement.removeEventListener('wheel', () => {});
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, [specification, material, height]);

  return (
    <div
      ref={containerRef}
      className="w-full bg-gray-100 rounded-lg overflow-hidden"
      style={{ height: `${height}px` }}
    />
  );
};
