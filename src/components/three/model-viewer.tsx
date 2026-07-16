'use client';

import { Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Bounds, Center, OrbitControls, useGLTF } from '@react-three/drei';

// Слои по именам узлов GLB: frame / roof / exterior / interior (SPEC 4.4).
export const LAYER_KEYS = ['frame', 'roof', 'exterior', 'interior'] as const;
export type LayerKey = (typeof LAYER_KEYS)[number];
export type LayerState = Record<LayerKey, boolean>;

function Model({
  url,
  layers,
  onLoaded,
}: {
  url: string;
  layers: LayerState;
  onLoaded: () => void;
}) {
  const { scene } = useGLTF(url);

  useEffect(() => {
    onLoaded();
  }, [onLoaded]);

  useEffect(() => {
    for (const key of LAYER_KEYS) {
      const node = scene.getObjectByName(key);
      if (node) node.visible = layers[key];
    }
  }, [scene, layers]);

  return <primitive object={scene} />;
}

export default function ModelViewer({
  url,
  layers,
  onLoaded,
}: {
  url: string;
  layers: LayerState;
  onLoaded: () => void;
}) {
  return (
    <Canvas camera={{ position: [8, 6, 8], fov: 45 }}>
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 10, 5]} intensity={1.2} />
      <Suspense fallback={null}>
        <Bounds fit clip observe margin={1.2}>
          <Center>
            <Model url={url} layers={layers} onLoaded={onLoaded} />
          </Center>
        </Bounds>
      </Suspense>
      <OrbitControls makeDefault enableDamping />
    </Canvas>
  );
}
