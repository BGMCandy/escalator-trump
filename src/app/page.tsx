'use client';

import { useState, useEffect, useRef } from 'react';

interface Position {
  x: number;
  y: number;
}

interface GameState {
  gameStarted: boolean;
  trumpPosition: Position;
  trumpVelocity: Position;
  escalatorSpeed: number;
  escalatorRunning: boolean;
  trumpAngry: boolean;
  spacePressed: boolean;
  escalatorAnimationOffset: number;
  celebrationActive: boolean;
  celebrationParticles: Array<{x: number, y: number, vx: number, vy: number, color: string, life: number}>;
}

export default function SlimeSoccerGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>({
    gameStarted: false,
    trumpPosition: { x: 50, y: 600 },
    trumpVelocity: { x: 0, y: 0 },
    escalatorSpeed: 2,
    escalatorRunning: true,
    trumpAngry: false,
    spacePressed: false,
    escalatorAnimationOffset: 0,
    celebrationActive: false,
    celebrationParticles: []
  });

  const keys = useRef<Set<string>>(new Set());

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current.add(e.key.toLowerCase());
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (!gameState.gameStarted) return;

    const gameLoop = setInterval(() => {
      setGameState(prevState => {
        let newState = { ...prevState };
        
        // Fixed escalator structure - always present
        const canvas = canvasRef.current;
        const canvasWidth = canvas ? canvas.width : 1000;
        const canvasHeight = canvas ? canvas.height : 600;
        
        const escalatorStartX = canvasWidth * 0.2; // 20% from left
        const escalatorStartY = canvasHeight - 50; // Near bottom
        const escalatorEndX = canvasWidth * 0.8; // 80% from left
        const escalatorEndY = canvasHeight * 0.3; // 30% from top
        const escalatorWidth = 80;
        const floorY = canvasHeight - 50; // Ground level
        const topFloorY = escalatorEndY; // Second floor level at the top
        
        // Check if Trump is on escalator (collision with fixed escalator)
        const trumpOnEscalator = (() => {
          const escalatorSlope = (escalatorEndY - escalatorStartY) / (escalatorEndX - escalatorStartX);
          const escalatorYAtTrumpX = escalatorStartY + escalatorSlope * (newState.trumpPosition.x - escalatorStartX);
          
          return newState.trumpPosition.x >= escalatorStartX && 
                 newState.trumpPosition.x <= escalatorEndX &&
                 Math.abs(newState.trumpPosition.y - escalatorYAtTrumpX) < 30;
        })();
        
        // Handle Trump movement based on whether he's on escalator or floor
        if (trumpOnEscalator) {
          // On escalator: only allow left/right movement along the escalator
          if (keys.current.has('a') || keys.current.has('arrowleft')) {
            newState.trumpVelocity.x = -3;
          } else if (keys.current.has('d') || keys.current.has('arrowright')) {
            newState.trumpVelocity.x = 3;
          } else {
            newState.trumpVelocity.x *= 0.8; // Friction
          }
          
          // No vertical movement when on escalator (he's constrained to escalator surface)
          newState.trumpVelocity.y = 0;
        } else {
          // On floor: only allow horizontal movement, constrain to appropriate floor level
          if (keys.current.has('a') || keys.current.has('arrowleft')) {
            newState.trumpVelocity.x = -3;
          } else if (keys.current.has('d') || keys.current.has('arrowright')) {
            newState.trumpVelocity.x = 3;
          } else {
            newState.trumpVelocity.x *= 0.8; // Friction
          }
          
          // No vertical movement on floor (he's constrained to ground level)
          newState.trumpVelocity.y = 0;
          
          // Keep Trump on the appropriate floor level
          if (newState.trumpPosition.x >= escalatorEndX - 50) {
            // Trump is at the top level - keep him on the second floor
            newState.trumpPosition.y = topFloorY;
          } else {
            // Trump is at the bottom level - keep him on the ground floor
            newState.trumpPosition.y = floorY;
          }
          }
          
          // Handle spacebar for escalator control
          if (keys.current.has(' ') && !newState.spacePressed) {
            newState.escalatorRunning = !newState.escalatorRunning;
            newState.spacePressed = true;
          } else if (!keys.current.has(' ')) {
            newState.spacePressed = false;
          }
          
          // Update Trump position
          newState.trumpPosition.x += newState.trumpVelocity.x;
        
        // Keep Trump within horizontal bounds
        newState.trumpPosition.x = Math.max(20, Math.min(canvasWidth - 20, newState.trumpPosition.x));
        
        // Update Trump's position based on whether he's on escalator or floor
        if (trumpOnEscalator) {
          // When on escalator, position Trump on the escalator surface
          const escalatorSlope = (escalatorEndY - escalatorStartY) / (escalatorEndX - escalatorStartX);
          newState.trumpPosition.y = escalatorStartY + escalatorSlope * (newState.trumpPosition.x - escalatorStartX);
        } else {
          // When not on escalator, determine which floor Trump should be on
          if (newState.trumpPosition.x >= escalatorEndX - 50) {
            // Trump is at the top level - put him on the second floor
            newState.trumpPosition.y = topFloorY;
          } else {
            // Trump is at the bottom level - put him on the ground floor
            newState.trumpPosition.y = floorY;
          }
        }
        
        // Update escalator animation offset for moving steps (upward movement)
          if (newState.escalatorRunning) {
          newState.escalatorAnimationOffset -= newState.escalatorSpeed * 0.5; // Negative for upward movement
        }
        
        // Keep animation offset within step cycle (handle negative values properly)
        const stepCycleLength = 40; // Distance between step repetitions
        newState.escalatorAnimationOffset = ((newState.escalatorAnimationOffset % stepCycleLength) + stepCycleLength) % stepCycleLength;
          
          // Update Trump's angry state
          if (trumpOnEscalator && !newState.escalatorRunning) {
            newState.trumpAngry = true;
          } else if (!trumpOnEscalator || newState.escalatorRunning) {
            newState.trumpAngry = false;
          }
          
        // If Trump is on escalator and it's running, move him along the escalator
          if (trumpOnEscalator && newState.escalatorRunning) {
          // Move Trump along the escalator (upward movement)
          const escalatorSlope = (escalatorEndY - escalatorStartY) / (escalatorEndX - escalatorStartX);
          newState.trumpPosition.x += newState.escalatorSpeed * 0.8; // Move right along escalator
          
          // Update Y position to stay on escalator surface
          newState.trumpPosition.y = escalatorStartY + escalatorSlope * (newState.trumpPosition.x - escalatorStartX);
          
          // Check if Trump has reached the top (UN entrance)
          if (newState.trumpPosition.x >= escalatorEndX - 50 && newState.trumpPosition.y <= escalatorEndY + 50) {
            if (!newState.celebrationActive) {
              newState.celebrationActive = true;
              // Create confetti particles
              newState.celebrationParticles = [];
              for (let i = 0; i < 50; i++) {
                newState.celebrationParticles.push({
                  x: newState.trumpPosition.x,
                  y: newState.trumpPosition.y,
                  vx: (Math.random() - 0.5) * 8,
                  vy: (Math.random() - 0.5) * 8 - 2, // Slight upward bias
                  color: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'][Math.floor(Math.random() * 6)],
                  life: 60 + Math.random() * 40 // 60-100 frames
                });
              }
            }
          }
        }
        
        // Update celebration particles
        if (newState.celebrationActive) {
          newState.celebrationParticles = newState.celebrationParticles.map(particle => ({
            ...particle,
            x: particle.x + particle.vx,
            y: particle.y + particle.vy,
            vy: particle.vy + 0.2, // Gravity
            life: particle.life - 1
          })).filter(particle => particle.life > 0);
          
          // End celebration when all particles are gone
          if (newState.celebrationParticles.length === 0) {
            newState.celebrationActive = false;
          }
        }
        
        return newState;
      });
    }, 16);

    return () => clearInterval(gameLoop);
  }, [gameState.gameStarted]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Get canvas dimensions
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    
    // Calculate escalator positions
    const escalatorStartX = canvasWidth * 0.2; // 20% from left
    const escalatorStartY = canvasHeight - 50; // Near bottom
    const escalatorEndX = canvasWidth * 0.8; // 80% from left
    const escalatorEndY = canvasHeight * 0.3; // 30% from top
    
    // Trump escalator rendering
    
    // Draw enhanced background with gradient
    const backgroundGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    backgroundGradient.addColorStop(0, '#e8e8e8');
    backgroundGradient.addColorStop(0.5, '#f0f0f0');
    backgroundGradient.addColorStop(1, '#d8d8d8');
    ctx.fillStyle = backgroundGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
    // Add subtle floor pattern (extended for larger canvas)
    ctx.fillStyle = 'rgba(200, 200, 200, 0.3)';
    for (let i = 0; i < canvasWidth; i += 40) {
      ctx.fillRect(i, canvasHeight - 20, 20, 20);
    }
    
    // Add second floor pattern at the top level
    ctx.fillStyle = 'rgba(200, 200, 200, 0.3)';
    for (let i = 0; i < canvasWidth; i += 40) {
      ctx.fillRect(i, escalatorEndY - 20, 20, 20);
    }
    
    // Add floor lines to make levels more obvious
    ctx.strokeStyle = 'rgba(150, 150, 150, 0.5)';
    ctx.lineWidth = 2;
      ctx.beginPath();
    ctx.moveTo(0, canvasHeight - 20);
    ctx.lineTo(canvasWidth, canvasHeight - 20);
      ctx.stroke();
      
      ctx.beginPath();
    ctx.moveTo(0, escalatorEndY - 20);
    ctx.lineTo(canvasWidth, escalatorEndY - 20);
      ctx.stroke();
      
    // Add some atmospheric lighting effects
    const lightGradient = ctx.createRadialGradient(canvas.width / 2, 100, 0, canvas.width / 2, 100, 300);
    lightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
    lightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = lightGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw fixed escalator structure
    const escalatorWidth = 80;
    
    // Draw escalator main structure
    ctx.save();
    
    // Create escalator path
        ctx.beginPath();
    ctx.moveTo(escalatorStartX, escalatorStartY);
    ctx.lineTo(escalatorEndX, escalatorEndY);
    ctx.lineTo(escalatorEndX, escalatorEndY + escalatorWidth);
    ctx.lineTo(escalatorStartX, escalatorStartY + escalatorWidth);
    ctx.closePath();
    
    // Escalator shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fill();
        
    // Escalator gradient
    const escalatorGradient = ctx.createLinearGradient(escalatorStartX, escalatorStartY, escalatorEndX, escalatorEndY);
    escalatorGradient.addColorStop(0, '#888888');
    escalatorGradient.addColorStop(0.5, '#666666');
    escalatorGradient.addColorStop(1, '#444444');
    ctx.fillStyle = escalatorGradient;
      ctx.fill();
      
    // Draw animated escalator steps
    const stepWidth = 30;
    const stepHeight = escalatorWidth / 4;
    const stepSpacing = 40; // Distance between step centers
    const animationOffset = gameState.escalatorAnimationOffset;
    
    // Calculate how many steps we need to cover the entire escalator plus some extra for animation
    const escalatorLength = Math.sqrt((escalatorEndX - escalatorStartX) ** 2 + (escalatorEndY - escalatorStartY) ** 2);
    const stepCount = Math.ceil(escalatorLength / stepSpacing) + 3; // Extra steps for smooth animation
    
    for (let i = -2; i < stepCount; i++) {
      // Calculate step position along the escalator path
      const stepProgress = (i * stepSpacing - animationOffset) / escalatorLength;
      
      // Skip steps that are off the escalator
      if (stepProgress < -0.1 || stepProgress > 1.1) continue;
      
      const stepX = escalatorStartX + (escalatorEndX - escalatorStartX) * stepProgress;
      const stepY = escalatorStartY + (escalatorEndY - escalatorStartY) * stepProgress;
      
      // Step shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(stepX - stepWidth/2 + 2, stepY + 2, stepWidth, stepHeight);
      
      // Step gradient
      const stepGradient = ctx.createLinearGradient(stepX - stepWidth/2, stepY, stepX + stepWidth/2, stepY + stepHeight);
      stepGradient.addColorStop(0, '#aaaaaa');
      stepGradient.addColorStop(0.5, '#888888');
      stepGradient.addColorStop(1, '#666666');
      ctx.fillStyle = stepGradient;
      ctx.fillRect(stepX - stepWidth/2, stepY, stepWidth, stepHeight);
      
      // Step highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(stepX - stepWidth/2, stepY, stepWidth, 2);
      
      // Step outline
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 1;
      ctx.strokeRect(stepX - stepWidth/2, stepY, stepWidth, stepHeight);
      
      // Add step ridges for more detail
      for (let j = 1; j < 3; j++) {
        const ridgeX = stepX - stepWidth/2 + (stepWidth * j / 3);
        ctx.strokeStyle = '#555555';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(ridgeX, stepY);
        ctx.lineTo(ridgeX, stepY + stepHeight);
        ctx.stroke();
      }
    }
    
    // Draw escalator handrails
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 6;
        ctx.beginPath();
    ctx.moveTo(escalatorStartX, escalatorStartY - 10);
    ctx.lineTo(escalatorEndX, escalatorEndY - 10);
    ctx.stroke();
        
        ctx.beginPath();
    ctx.moveTo(escalatorStartX, escalatorStartY + escalatorWidth + 10);
    ctx.lineTo(escalatorEndX, escalatorEndY + escalatorWidth + 10);
        ctx.stroke();
    
    ctx.restore();
    
    // Draw United Nations sign/door at the top of the escalator
    const unSignX = escalatorEndX - 100;
    const unSignY = escalatorEndY - 80;
    const unSignWidth = 200;
    const unSignHeight = 60;
    
    // UN sign background (white with blue border)
        ctx.fillStyle = '#ffffff';
    ctx.fillRect(unSignX, unSignY, unSignWidth, unSignHeight);
    
    // UN sign border
    ctx.strokeStyle = '#1a237e';
    ctx.lineWidth = 4;
    ctx.strokeRect(unSignX, unSignY, unSignWidth, unSignHeight);
    
    // UN logo/emblem (simplified globe)
    ctx.fillStyle = '#1a237e';
        ctx.beginPath();
    ctx.arc(unSignX + 30, unSignY + 30, 20, 0, Math.PI * 2);
        ctx.fill();
        
    // Globe lines
    ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
    ctx.arc(unSignX + 30, unSignY + 30, 20, 0, Math.PI * 2);
        ctx.stroke();
      
    // Horizontal globe line
        ctx.beginPath();
    ctx.moveTo(unSignX + 10, unSignY + 30);
    ctx.lineTo(unSignX + 50, unSignY + 30);
    ctx.stroke();
    
    // Vertical globe line
    ctx.beginPath();
    ctx.moveTo(unSignX + 30, unSignY + 10);
    ctx.lineTo(unSignX + 30, unSignY + 50);
    ctx.stroke();
    
    // "UNITED NATIONS" text
    ctx.fillStyle = '#1a237e';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('UNITED NATIONS', unSignX + unSignWidth/2, unSignY + 45);
    
    // Add some architectural details (door frame)
    ctx.fillStyle = '#8d6e63';
    ctx.fillRect(unSignX - 10, unSignY - 10, unSignWidth + 20, 10);
    ctx.fillRect(unSignX - 10, unSignY + unSignHeight, unSignWidth + 20, 10);
    ctx.fillRect(unSignX - 10, unSignY - 10, 10, unSignHeight + 20);
    ctx.fillRect(unSignX + unSignWidth, unSignY - 10, 10, unSignHeight + 20);
    
    // Door handle
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(unSignX + unSignWidth - 20, unSignY + unSignHeight/2 - 5, 8, 10);
    
    // Reset text alignment
    ctx.textAlign = 'left';
    
    // Draw Trump character in pixel art style
    const trump = gameState.trumpPosition;
    
    // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(trump.x - 12 + 2, trump.y - 8 + 2, 24, 16);
    
    // Trump shoes (dark brown/black)
    ctx.fillStyle = '#2d1810';
    ctx.fillRect(trump.x - 8, trump.y - 8, 16, 6);
    
    // Trump pants (dark blue)
    ctx.fillStyle = '#1a237e';
    ctx.fillRect(trump.x - 12, trump.y - 20, 24, 12);
    
    // Trump suit jacket (dark blue)
    ctx.fillStyle = '#1a237e';
    ctx.fillRect(trump.x - 14, trump.y - 35, 28, 15);
    
    // Suit jacket lapels
    ctx.fillStyle = '#283593';
    ctx.fillRect(trump.x - 12, trump.y - 33, 4, 8);
    ctx.fillRect(trump.x + 8, trump.y - 33, 4, 8);
    
    // White shirt collar
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(trump.x - 8, trump.y - 30, 16, 6);
    
    // Red tie
    ctx.fillStyle = '#d32f2f';
    ctx.fillRect(trump.x - 2, trump.y - 25, 4, 12);
    
    // Tie knot
    ctx.fillStyle = '#b71c1c';
    ctx.fillRect(trump.x - 3, trump.y - 28, 6, 4);
    
    // Trump head (larger, more proportional)
    ctx.fillStyle = '#ffdbac';
    ctx.fillRect(trump.x - 16, trump.y - 55, 32, 24);
      
      // Head outline
      ctx.strokeStyle = '#e6c299';
      ctx.lineWidth = 2;
    ctx.strokeRect(trump.x - 16, trump.y - 55, 32, 24);
    
    // Trump hair (blonde, swept back style)
    ctx.fillStyle = '#ffed4e';
    ctx.fillRect(trump.x - 18, trump.y - 60, 36, 8);
    
    // Hair wave/comb-over detail
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(trump.x - 16, trump.y - 62, 32, 4);
    
    // Hair outline
      ctx.strokeStyle = '#e6c200';
      ctx.lineWidth = 1;
    ctx.strokeRect(trump.x - 18, trump.y - 60, 36, 8);
    ctx.strokeRect(trump.x - 16, trump.y - 62, 32, 4);
    
    // Trump eyes (small, rectangular pixels)
      ctx.fillStyle = '#ffffff';
    ctx.fillRect(trump.x - 10, trump.y - 48, 4, 3);
    ctx.fillRect(trump.x + 6, trump.y - 48, 4, 3);
    
    // Eye pupils
      ctx.fillStyle = '#000000';
    ctx.fillRect(trump.x - 9, trump.y - 47, 2, 2);
    ctx.fillRect(trump.x + 7, trump.y - 47, 2, 2);
      
      // Eye highlights
      ctx.fillStyle = '#ffffff';
    ctx.fillRect(trump.x - 8, trump.y - 48, 1, 1);
    ctx.fillRect(trump.x + 8, trump.y - 48, 1, 1);
    
    // Eyebrows
    ctx.fillStyle = '#8d6e63';
    ctx.fillRect(trump.x - 12, trump.y - 52, 8, 2);
    ctx.fillRect(trump.x + 4, trump.y - 52, 8, 2);
    
    // Nose (simple blocky shape)
    ctx.fillStyle = '#ffdbac';
    ctx.fillRect(trump.x - 2, trump.y - 45, 4, 3);
    
    // Ears
    ctx.fillStyle = '#ffdbac';
    ctx.fillRect(trump.x - 18, trump.y - 50, 3, 6);
    ctx.fillRect(trump.x + 15, trump.y - 50, 3, 6);
    
    // Mouth (neutral or angry expression)
    if (gameState.trumpAngry) {
        // Angry mouth (frown)
      ctx.fillStyle = '#000000';
      ctx.fillRect(trump.x - 4, trump.y - 40, 8, 2);
      
      // Angry eyebrows (angled down)
      ctx.fillStyle = '#000000';
      ctx.fillRect(trump.x - 12, trump.y - 54, 6, 2);
      ctx.fillRect(trump.x + 6, trump.y - 54, 6, 2);
        
        // Angry cheeks (red)
        ctx.fillStyle = '#ff6666';
      ctx.fillRect(trump.x - 16, trump.y - 48, 3, 3);
      ctx.fillRect(trump.x + 13, trump.y - 48, 3, 3);
      } else {
      // Normal mouth (neutral line)
      ctx.fillStyle = '#000000';
      ctx.fillRect(trump.x - 3, trump.y - 40, 6, 1);
    }
    
    // Trump hands (simple fists)
    ctx.fillStyle = '#ffdbac';
    ctx.fillRect(trump.x - 20, trump.y - 20, 6, 6);
    ctx.fillRect(trump.x + 14, trump.y - 20, 6, 6);
    
    // Hand outlines
    ctx.strokeStyle = '#e6c299';
      ctx.lineWidth = 1;
    ctx.strokeRect(trump.x - 20, trump.y - 20, 6, 6);
    ctx.strokeRect(trump.x + 14, trump.y - 20, 6, 6);
    
    // Draw celebration effects
    if (gameState.celebrationActive) {
      // Draw confetti particles
      gameState.celebrationParticles.forEach(particle => {
        ctx.fillStyle = particle.color;
        ctx.fillRect(particle.x, particle.y, 4, 4);
      });
      
      // Draw victory text
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 32px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('VICTORY!', canvas.width / 2, 100);
      
      // Draw celebration message
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px Arial';
      ctx.fillText('Trump has reached the UN!', canvas.width / 2, 140);
      
      // Reset text alignment
      ctx.textAlign = 'left';
    }
    
  }, [gameState]);

  const startGame = () => {
    setGameState(prev => ({ ...prev, gameStarted: true }));
  };

  const toggleEscalator = () => {
    setGameState(prev => ({ ...prev, escalatorRunning: !prev.escalatorRunning }));
  };

  const resetGame = () => {
      setGameState({
        gameStarted: false,
      trumpPosition: { x: 50, y: 600 },
        trumpVelocity: { x: 0, y: 0 },
        escalatorSpeed: 2,
        escalatorRunning: true,
        trumpAngry: false,
      spacePressed: false,
      escalatorAnimationOffset: 0,
      celebrationActive: false,
      celebrationParticles: []
      });
  };

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 relative">
      {/* Simple Start Mission button */}
      {!gameState.gameStarted && (
              <button
                onClick={startGame}
          className="absolute top-4 left-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-lg z-10"
              >
          Start Mission
              </button>
      )}
      
      {/* Reset Mission button */}
      {gameState.gameStarted && (
              <button
                onClick={resetGame}
          className="absolute top-4 left-4 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-lg z-10"
              >
          Reset Mission
              </button>
      )}
      
      {/* Escalator control button */}
      {gameState.gameStarted && (
            <button
              onClick={toggleEscalator}
          className={`absolute top-4 right-4 px-3 py-2 rounded-lg font-bold text-white transition-colors shadow-lg z-10 ${
                gameState.escalatorRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              {gameState.escalatorRunning ? 'STOP ESCALATOR' : 'START ESCALATOR'}
            </button>
          )}
      
      {/* Full screen game canvas */}
      <canvas
        ref={canvasRef}
        width={window.innerWidth}
        height={window.innerHeight}
        className="absolute inset-0"
      />
    </div>
  );
}