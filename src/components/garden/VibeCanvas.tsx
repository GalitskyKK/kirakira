
import React, { useEffect, useRef, useState } from 'react';
import { VibeController, VibeConfig } from '@/lib/vibe-canvas/controller';

interface VibeCanvasProps {
  width?: number;
  height?: number;
  className?: string;
  config?: VibeConfig;
}

export const VibeCanvas: React.FC<VibeCanvasProps> = ({ 
  width, 
  height, 
  className,
  config 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controllerRef = useRef<VibeController | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || !config) return;

    // Wait for config to be available before initializing
    // This prevents flash of default colors
    try {
        controllerRef.current = new VibeController(canvasRef.current, config);
        controllerRef.current.start();
        setIsReady(true);
    } catch (e) {
        console.error("Failed to init VibeCanvas", e);
    }

    return () => {
      controllerRef.current?.stop();
      setIsReady(false);
    };
  }, [config?.colors?.length, config?.hue]); // Reinit when colors change

  useEffect(() => {
    if (controllerRef.current && config && isReady) {
      controllerRef.current.updateConfig(config);
    }
  }, [config, isReady]);

  useEffect(() => {
    if (controllerRef.current && width !== undefined && height !== undefined) {
      controllerRef.current.resize(width, height);
    }
  }, [width, height]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : '100%',
        display: 'block',
        opacity: isReady ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out'
      }}
    />
  );
};

