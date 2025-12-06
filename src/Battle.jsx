import React, { useState, useEffect } from 'react';
import { Swords, Heart, Trophy, Skull, ArrowLeft, Zap, Shield } from 'lucide-react';

export default function BattlePage({ onNavigate }) {
  const [gameState, setGameState] = useState('pre-battle'); // pre-battle, fighting, victory, defeat
  const [fighterHP, setFighterHP] = useState(3);
  const [monsterHP, setMonsterHP] = useState(3);
  const [currentTurn, setCurrentTurn] = useState('player'); // player or monster
  const [battleLog, setBattleLog] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [attackAnimation, setAttackAnimation] = useState(null); // staff, bullets, hit, miss
  const [round, setRound] = useState(1);

  // Fighter stats
  const fighter = {
    name: "Holy Guard",
    weapon: "Sacred Wooden Staff",
    damage: "1 HP",
    accuracy: 70, // 70% hit chance
    description: "A devout bodyguard wielding a blessed wooden club"
  };

  // Monster stats
  const monster = {
    name: "Cyber Sentinel",
    weapon: "Dual Machine Guns",
    damage: "1 HP",
    accuracy: 65, // 65% hit chance
    description: "A futuristic killing machine from the year 2525"
  };

  const addLog = (message) => {
    setBattleLog(prev => [message, ...prev].slice(0, 5)); // Keep last 5 messages
  };

  const playerAttack = () => {
    if (isAnimating || gameState !== 'fighting') return;
    
    setIsAnimating(true);
    
    // Random hit chance
    const hitRoll = Math.random() * 100;
    const didHit = hitRoll <= fighter.accuracy;
    
    // Staff swing animation
    setAttackAnimation('staff-swing');
    
    setTimeout(() => {
      if (didHit) {
        setAttackAnimation('staff-hit');
        const newHP = monsterHP - 1;
        setMonsterHP(newHP);
        addLog(`⚔️ ${fighter.name} swings his staff - DIRECT HIT! (-1 HP)`);
        
        if (newHP <= 0) {
          setTimeout(() => {
            setGameState('victory');
            addLog(`🏆 VICTORY! ${monster.name} has been defeated!`);
          }, 1000);
        } else {
          // Monster's turn after delay
          setTimeout(() => {
            setCurrentTurn('monster');
            monsterAttack();
          }, 1500);
        }
      } else {
        setAttackAnimation('miss');
        addLog(`💨 ${fighter.name} swings but misses!`);
        
        // Monster's turn after delay
        setTimeout(() => {
          setCurrentTurn('monster');
          monsterAttack();
        }, 1500);
      }
      
      setTimeout(() => {
        setAttackAnimation(null);
        setIsAnimating(false);
      }, 1000);
    }, 800);
  };

  const monsterAttack = () => {
    setIsAnimating(true);
    
    const hitRoll = Math.random() * 100;
    const didHit = hitRoll <= monster.accuracy;
    
    // Bullets animation
    setAttackAnimation('bullets');
    
    setTimeout(() => {
      if (didHit) {
        setAttackAnimation('bullet-hit');
        const newHP = fighterHP - 1;
        setFighterHP(newHP);
        addLog(`🔫 ${monster.name} fires machine guns - HIT! (-1 HP)`);
        
        if (newHP <= 0) {
          setTimeout(() => {
            setGameState('defeat');
            addLog(`💀 DEFEAT! ${fighter.name} has fallen!`);
          }, 1000);
        } else {
          // Player's turn
          setTimeout(() => {
            setCurrentTurn('player');
            setRound(prev => prev + 1);
          }, 1500);
        }
      } else {
        setAttackAnimation('miss');
        addLog(`💨 ${monster.name}'s bullets miss the target!`);
        
        // Player's turn
        setTimeout(() => {
          setCurrentTurn('player');
          setRound(prev => prev + 1);
        }, 1500);
      }
      
      setTimeout(() => {
        setAttackAnimation(null);
        setIsAnimating(false);
      }, 1000);
    }, 800);
  };

  const startBattle = () => {
    setGameState('fighting');
    setCurrentTurn('player');
    addLog(`⚔️ BATTLE START! Round 1 begins!`);
  };

  const resetBattle = () => {
    setGameState('pre-battle');
    setFighterHP(3);
    setMonsterHP(3);
    setCurrentTurn('player');
    setBattleLog([]);
    setRound(1);
    setAttackAnimation(null);
  };

  const renderHearts = (hp, color) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3].map((i) => (
          <Heart
            key={i}
            className={`w-8 h-8 ${
              i <= hp 
                ? color === 'red' ? 'fill-red-500 text-red-500' : 'fill-blue-500 text-blue-500'
                : 'fill-gray-700 text-gray-700'
            } transition-all duration-300`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/uploads/Arena_-_Castle_battleground.mp4" type="video/mp4" />
      </video>

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => onNavigate('staking')}
            className="flex items-center gap-2 bg-gray-900/80 hover:bg-gray-800/80 px-4 py-2 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Staking
          </button>
          <h1 className="text-3xl font-bold text-white drop-shadow-lg">
            BATTLE ARENA
          </h1>
          <div className="w-32" /> {/* Spacer */}
        </div>

        {/* Pre-Battle Screen */}
        {gameState === 'pre-battle' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-black/80 backdrop-blur border border-red-800 rounded-lg p-8 text-center">
              <Swords className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-4xl font-bold mb-4">PREPARE FOR BATTLE</h2>
              
              <div className="grid md:grid-cols-2 gap-6 my-8">
                {/* Fighter Info */}
                <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-6">
                  <h3 className="text-2xl font-bold text-blue-400 mb-2">{fighter.name}</h3>
                  <div className="aspect-square bg-gray-900 rounded-lg mb-4 overflow-hidden">
                    <video autoPlay loop muted playsInline className="w-full h-full object-cover">
                      <source src="/uploads/Fighter.mp4" type="video/mp4" />
                    </video>
                  </div>
                  <div className="text-left space-y-2 text-sm">
                    <p><strong>Weapon:</strong> {fighter.weapon}</p>
                    <p><strong>Damage:</strong> {fighter.damage}</p>
                    <p><strong>Accuracy:</strong> {fighter.accuracy}%</p>
                    <p className="text-xs text-gray-400 italic">{fighter.description}</p>
                  </div>
                </div>

                {/* Monster Info */}
                <div className="bg-red-900/30 border border-red-700 rounded-lg p-6">
                  <h3 className="text-2xl font-bold text-red-400 mb-2">{monster.name}</h3>
                  <div className="aspect-square bg-gray-900 rounded-lg mb-4 overflow-hidden">
                    <video autoPlay loop muted playsInline className="w-full h-full object-cover">
                      <source src="/uploads/Monster.mp4" type="video/mp4" />
                    </video>
                  </div>
                  <div className="text-left space-y-2 text-sm">
                    <p><strong>Weapon:</strong> {monster.weapon}</p>
                    <p><strong>Damage:</strong> {monster.damage}</p>
                    <p><strong>Accuracy:</strong> {monster.accuracy}%</p>
                    <p className="text-xs text-gray-400 italic">{monster.description}</p>
                  </div>
                </div>
              </div>

              <button
                onClick={startBattle}
                className="bg-red-600 hover:bg-red-700 px-12 py-4 rounded-lg font-bold text-2xl transition transform hover:scale-105"
              >
                ⚔️ FIGHT!
              </button>
            </div>
          </div>
        )}

        {/* Battle Screen */}
        {gameState === 'fighting' && (
          <div className="max-w-6xl mx-auto">
            {/* Round Counter */}
            <div className="text-center mb-4">
              <div className="inline-block bg-black/80 px-6 py-2 rounded-lg border border-yellow-600">
                <p className="text-yellow-400 font-bold text-xl">ROUND {round}</p>
              </div>
            </div>

            {/* Battle Arena */}
            <div className="bg-black/60 backdrop-blur border border-gray-700 rounded-lg p-6 mb-6">
              <div className="grid grid-cols-3 gap-4 items-center min-h-[400px]">
                {/* Fighter */}
                <div className="relative">
                  <div className="text-center mb-2">
                    <h3 className="text-xl font-bold text-blue-400">{fighter.name}</h3>
                    {renderHearts(fighterHP, 'blue')}
                  </div>
                  <div className="aspect-square bg-blue-900/20 border-2 border-blue-700 rounded-lg overflow-hidden relative">
                    <video autoPlay loop muted playsInline className="w-full h-full object-cover">
                      <source src="/uploads/Fighter.mp4" type="video/mp4" />
                    </video>
                    {currentTurn === 'player' && !isAnimating && (
                      <div className="absolute inset-0 border-4 border-yellow-400 rounded-lg animate-pulse" />
                    )}
                  </div>
                  <div className="text-center mt-2">
                    <p className="text-xs text-gray-400">{fighter.weapon}</p>
                  </div>
                </div>

                {/* Battle Effects */}
                <div className="flex items-center justify-center relative h-full">
                  {attackAnimation === 'staff-swing' && (
                    <div className="text-8xl animate-ping">🪵</div>
                  )}
                  {attackAnimation === 'staff-hit' && (
                    <div className="text-8xl animate-bounce">💥</div>
                  )}
                  {attackAnimation === 'bullets' && (
                    <div className="flex gap-2">
                      <div className="text-6xl animate-ping">🔫</div>
                      <div className="text-4xl">💨💨💨</div>
                    </div>
                  )}
                  {attackAnimation === 'bullet-hit' && (
                    <div className="text-8xl animate-bounce">💥</div>
                  )}
                  {attackAnimation === 'miss' && (
                    <div className="text-6xl">💨</div>
                  )}
                  {!attackAnimation && (
                    <div className="text-6xl text-gray-600">⚔️</div>
                  )}
                </div>

                {/* Monster */}
                <div className="relative">
                  <div className="text-center mb-2">
                    <h3 className="text-xl font-bold text-red-400">{monster.name}</h3>
                    {renderHearts(monsterHP, 'red')}
                  </div>
                  <div className="aspect-square bg-red-900/20 border-2 border-red-700 rounded-lg overflow-hidden relative">
                    <video autoPlay loop muted playsInline className="w-full h-full object-cover">
                      <source src="/uploads/Monster.mp4" type="video/mp4" />
                    </video>
                    {currentTurn === 'monster' && !isAnimating && (
                      <div className="absolute inset-0 border-4 border-red-500 rounded-lg animate-pulse" />
                    )}
                  </div>
                  <div className="text-center mt-2">
                    <p className="text-xs text-gray-400">{monster.weapon}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex justify-center gap-4">
                <button
                  onClick={playerAttack}
                  disabled={currentTurn !== 'player' || isAnimating}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-8 py-3 rounded-lg font-bold text-lg transition transform hover:scale-105 flex items-center gap-2"
                >
                  <Zap className="w-5 h-5" />
                  ATTACK
                </button>
                <button
                  disabled
                  className="bg-gray-700 cursor-not-allowed px-8 py-3 rounded-lg font-bold text-lg flex items-center gap-2 opacity-50"
                >
                  <Shield className="w-5 h-5" />
                  DEFEND
                </button>
              </div>

              {/* Turn Indicator */}
              <div className="mt-4 text-center">
                {currentTurn === 'player' && !isAnimating && (
                  <p className="text-yellow-400 font-bold animate-pulse">YOUR TURN</p>
                )}
                {currentTurn === 'monster' && !isAnimating && (
                  <p className="text-red-400 font-bold animate-pulse">ENEMY TURN</p>
                )}
                {isAnimating && (
                  <p className="text-gray-400">Attacking...</p>
                )}
              </div>
            </div>

            {/* Battle Log */}
            <div className="bg-black/80 border border-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-bold mb-2 text-gray-300">Battle Log</h3>
              <div className="space-y-1 font-mono text-sm">
                {battleLog.map((log, i) => (
                  <p key={i} className="text-gray-400">{log}</p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Victory Screen */}
        {gameState === 'victory' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-gradient-to-br from-yellow-900/90 to-orange-900/90 backdrop-blur border-4 border-yellow-500 rounded-lg p-12 text-center">
              <Trophy className="w-24 h-24 text-yellow-400 mx-auto mb-6 animate-bounce" />
              <h2 className="text-5xl font-bold mb-4 text-yellow-300">VICTORY!</h2>
              <p className="text-2xl mb-8">You have defeated the {monster.name}!</p>
              
              <div className="bg-black/50 rounded-lg p-6 mb-8">
                <h3 className="text-xl font-bold mb-4 text-yellow-400">Rewards</h3>
                <div className="space-y-2">
                  <p className="text-lg">🍖 +50 FOOD</p>
                  <p className="text-lg">🪙 +10 GOLD</p>
                  <p className="text-lg">⭐ +100 XP</p>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={resetBattle}
                  className="bg-green-600 hover:bg-green-700 px-8 py-3 rounded-lg font-bold text-lg transition"
                >
                  Battle Again
                </button>
                <button
                  onClick={() => onNavigate('staking')}
                  className="bg-gray-700 hover:bg-gray-600 px-8 py-3 rounded-lg font-bold text-lg transition"
                >
                  Return to Staking
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Defeat Screen */}
        {gameState === 'defeat' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-gradient-to-br from-gray-900/90 to-red-900/90 backdrop-blur border-4 border-red-700 rounded-lg p-12 text-center">
              <Skull className="w-24 h-24 text-red-500 mx-auto mb-6" />
              <h2 className="text-5xl font-bold mb-4 text-red-400">DEFEAT</h2>
              <p className="text-2xl mb-8">The {monster.name} has bested you in combat.</p>
              
              <div className="bg-black/50 rounded-lg p-6 mb-8">
                <p className="text-lg text-gray-400">
                  Your fighter needs rest. Try again with better strategy!
                </p>
              </div>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={resetBattle}
                  className="bg-red-600 hover:bg-red-700 px-8 py-3 rounded-lg font-bold text-lg transition"
                >
                  Try Again
                </button>
                <button
                  onClick={() => onNavigate('staking')}
                  className="bg-gray-700 hover:bg-gray-600 px-8 py-3 rounded-lg font-bold text-lg transition"
                >
                  Return to Staking
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}