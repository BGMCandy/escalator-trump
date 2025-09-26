'use client';

import { useState, useEffect, useRef } from 'react';

export default function TestPage() {
  const [isClient, setIsClient] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    console.log('Test page: Client-side rendering started');
    setIsClient(true);
    
    if (typeof window !== 'undefined') {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    }
  }, []);

  useEffect(() => {
    if (canvasRef.current && isClient) {
      const canvas = canvasRef.current;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      setCanvasSize({
        width: canvas.width,
        height: canvas.height
      });
      
      // Draw a simple test
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(50, 50, 100, 100);
        ctx.fillStyle = '#000000';
        ctx.font = '20px Arial';
        ctx.fillText('Test Canvas Working!', 200, 100);
      }
    }
  }, [isClient]);

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Loading test page...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Deployment Test Page</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2">Environment Info</h2>
            <p><strong>Client-side:</strong> {isClient ? '✅ Working' : '❌ Not working'}</p>
            <p><strong>Window object:</strong> {typeof window !== 'undefined' ? '✅ Available' : '❌ Not available'}</p>
            <p><strong>Window size:</strong> {windowSize.width} x {windowSize.height}</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2">Canvas Info</h2>
            <p><strong>Canvas size:</strong> {canvasSize.width} x {canvasSize.height}</p>
            <p><strong>Canvas ref:</strong> {canvasRef.current ? '✅ Available' : '❌ Not available'}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-2">Canvas Test</h2>
          <p className="mb-4">If you see a green square and text below, canvas is working:</p>
          <canvas
            ref={canvasRef}
            width={windowSize.width || 800}
            height={windowSize.height || 600}
            className="border-2 border-gray-300 rounded"
          />
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Console Output</h2>
          <p>Check the browser console (F12) for any error messages.</p>
          <p className="mt-2 text-sm text-gray-600">
            You should see: "Test page: Client-side rendering started"
          </p>
        </div>
      </div>
    </div>
  );
}