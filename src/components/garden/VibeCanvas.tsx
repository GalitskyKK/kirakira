
import React, { useEffect, useRef } from 'react';
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

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize controller
    try {
        controllerRef.current = new VibeController(canvasRef.current, config);
        controllerRef.current.start();
    } catch (e) {
        console.error("Failed to init VibeCanvas", e);
    }

    return () => {
      controllerRef.current?.stop();
    };
  }, []); // Init once

  useEffect(() => {
    if (controllerRef.current && config) {
      controllerRef.current.updateConfig(config);
    }
  }, [config]);

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
        display: 'block'
      }}
    />
  );
};

