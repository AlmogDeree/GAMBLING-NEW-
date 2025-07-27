import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface GameAnimationProps {
  isPlaying: boolean;
  countdown?: number;
  winChance?: number;
  result?: 'win' | 'lose' | 'nearMiss';
  nearMissLevel?: number;
}

const GameAnimation: React.FC<GameAnimationProps> = ({ 
  isPlaying, 
  countdown = 3, 
  winChance = 0,
  result,
  nearMissLevel = 0
}) => {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number }>>([]);

  useEffect(() => {
    if (result === 'win') {
      // Generate celebration particles
      const newParticles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight
      }));
      setParticles(newParticles);
    }
  }, [result]);

  return (
    <AnimatePresence>
      {isPlaying && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center"
        >
          {/* Countdown Animation */}
          {countdown > 0 && (
            <motion.div
              key={countdown}
              initial={{ scale: 0.5, opacity: 0, rotate: -180 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="text-8xl font-bold text-yellow-400 drop-shadow-2xl"
            >
              {countdown}
            </motion.div>
          )}

          {/* Rolling Animation */}
          {countdown === 0 && !result && (
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-32 h-32 border-8 border-yellow-400 border-t-transparent rounded-full mx-auto mb-4"
              />
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-2xl text-yellow-400"
              >
                Rolling the dice...
              </motion.div>
              
              {/* Win Chance Meter */}
              <div className="mt-8 w-64 mx-auto">
                <div className="text-sm text-gray-400 mb-2">Win Probability</div>
                <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    animate={{ width: `${winChance}%` }}
                    transition={{ duration: 0.3 }}
                    className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Result Animation */}
          {result && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", duration: 0.8 }}
              className="text-center"
            >
              {result === 'win' && (
                <>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    className="text-8xl mb-4"
                  >
                    🎉
                  </motion.div>
                  <div className="text-6xl font-bold text-green-400">WINNER!</div>
                </>
              )}
              
              {result === 'lose' && nearMissLevel === 0 && (
                <>
                  <div className="text-8xl mb-4">😢</div>
                  <div className="text-4xl font-bold text-red-400">Try Again!</div>
                </>
              )}
              
              {result === 'nearMiss' && nearMissLevel > 0 && (
                <>
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.3, repeat: 3 }}
                    className="text-8xl mb-4"
                  >
                    😮
                  </motion.div>
                  <div className="text-4xl font-bold text-yellow-400">
                    {nearMissLevel === 3 ? 'SO CLOSE!' :
                     nearMissLevel === 2 ? 'Almost There!' :
                     'Near Miss!'}
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* Win Particles */}
          {result === 'win' && particles.map(particle => (
            <motion.div
              key={particle.id}
              initial={{ 
                x: particle.x, 
                y: particle.y,
                scale: 0
              }}
              animate={{ 
                y: particle.y - 500,
                scale: [0, 1, 0],
                rotate: 360
              }}
              transition={{ duration: 2, ease: "easeOut" }}
              className="absolute text-4xl"
              style={{ left: particle.x, top: particle.y }}
            >
              ✨
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GameAnimation;