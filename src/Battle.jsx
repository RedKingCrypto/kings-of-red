import React, { useState, useEffect } from 'react';
import { Swords, Heart, Trophy, Skull, ArrowLeft, Zap, Shield, Crown, Target } from 'lucide-react';

export default function BattlePage({ connected, walletAddress, onNavigate }) {
  // Battle State
  const [gameState, setGameState] = useState('arena-intro'); // arena-intro, enemy-select, pre-battle, fighting, victory, defeat, complete
  const [currentEnemy, setCurrentEnemy] = useState(null); // 1, 2, or 3
  const [enemiesDefeated, setEnemiesDefeated] = useState([]);
  
  // HP Tracking
  const [fighterHP, setFighterHP] = useState(3);
  const [enemyHP, setEnemyHP] = useState(3);
  
  // Combat Flow
  const [currentTurn, setCurrentTurn] = useState('player');
  const [isAnimating, setIsAnimating] = useState(false);
  const [weaponAnimation, setWeaponAnimation] = useState(null); // video playing
  const [outcomeText, setOutcomeText] = useState(''); // "Fighter Hits", "Enemy Misses", etc.
  const [battleLog, setBattleLog] = useState([]);
  const [round, setRound] = useState(1);

  // Arena Configuration
  const arena = {
    name: "The Castle Grounds",
    clan: "Witkastle",
    description: "Ancient battleground where honor meets treachery",
    backgroundVideo: "/videos/castle_grounds_arena.mp4",
    staticImage: "/images/castle_grounds_arena.png" // Fallback image
  };

  // Enemy Configurations
  const enemies = {
    1: {
      name: "Zimrek",
      title: "Professional Assassin",
      description: "Discreet, lethal, not noble-born but trusted for dirty work",
      weapon: "Blunderbuss",
      weaponVideo: "/videos/blunderbuss_fire.mp4",
      characterVideo: "/videos/zimrek.mp4",
      staticImage: "/images/zimrek.png",
      hp: 3
    },
    2: {
      name: "Lord Jeroboam",
      title: "Elite Conspirator",
      description: "Wealthy, calculated antagonist — educated, dangerous and elite",
      weapon: "Flintlock Pistol",
      weaponVideo: "/videos/flintlock_fire.mp4",
      characterVideo: "/videos/lord_jeroboam.mp4",
      staticImage: "/images/lord_jeroboam.png",
      hp: 3
    },
    3: {
      name: "Nebchud Baddon",
      title: "Corrupted Ruler",
      description: "Intimidating, mythical — a corrupted ruler, not a common brute",
      weapon: "Gilded Sceptre",
      weaponVideo: "/videos/gilded_sceptre_strike.mp4",
      characterVideo: "/videos/nebchud_baddon.mp4",
      staticImage: "/images/nebchud_baddon.png",
      hp: 3
    }
  };

  // Calculate Fighter's Hit Chance based on rarity and enemy
  const calculateFighterAccuracy = (fighterRarity, enemyNum) => {
    // Fighter's chance to hit enemy
    const hitChances = {
      Bronze: [20, 10, 3],   // vs Enemy 1, 2, 3
      Silver: [30, 20, 10],
      Gold: [40, 30, 20]
    };
    
    return hitChances[fighterRarity][enemyNum - 1];
  };
  
  // Calculate Enemy's Hit Chance based on enemy number and fighter rarity
  const calculateEnemyAccuracy = (enemyNum, fighterRarity) => {
    // Enemy's chance to hit fighter
    const hitChances = {
      1: { Gold: 70, Silver: 75, Bronze: 85 },  // First Enemy
      2: { Gold: 72, Silver: 80, Bronze: 90 },  // Second Enemy
      3: { Gold: 75, Silver: 85, Bronze: 95 }   // Third Enemy
    };
    
    return hitChances[enemyNum][fighterRarity];
  };

  // Fighter Configuration (will come from selected NFT later)
  const [fighter, setFighter] = useState({
    name: "Pirate Fighter",
    clan: "Witkastle",
    rarity: "Gold", // Bronze, Silver, or Gold
    weapon: "Sailor's Dirk",
    weaponVideo: "/videos/sailors_dirk.mp4",
    characterVideo: "/videos/pirate_fighter.mp4",
    staticImage: "/images/pirate_fighter.png",
    hp: 3
  });

  // Battle Configuration (Flexible - can be changed)
  const [battleConfig, setBattleConfig] = useState({
    entryCost: {
      token: 'FOOD', // FOOD, GOLD, WOOD, or REDKING
      amount: 50 // Changed from 5 to 50
    },
    rewards: {
      enemy1: { FOOD: 10, GOLD: 2, WOOD: 1 },
      enemy2: { FOOD: 25, GOLD: 5, WOOD: 3 },
      enemy3: { FOOD: 50, GOLD: 10, WOOD: 10 },
      completion: { FOOD: 20, GOLD: 5, WOOD: 5 } // Bonus for clearing all 3
    }
  });

  // Add to battle log
  const addLog = (message) => {
    setBattleLog(prev => [message, ...prev].slice(0, 8));
  };

  // Start arena (show intro)
  const startArena = () => {
    setGameState('arena-intro');
  };

  // Proceed to enemy selection
  const selectEnemyPhase = () => {
    setGameState('enemy-select');
  };

  // Select enemy and start battle
  const selectEnemy = (enemyNum) => {
    if (enemiesDefeated.includes(enemyNum)) {
      return; // Already defeated
    }
    
    // Check if this enemy is available (sequential progression)
    const isAvailable = enemyNum === 1 || enemiesDefeated.includes(enemyNum - 1);
    if (!isAvailable) {
      return; // Not available yet
    }
    
    setCurrentEnemy(enemyNum);
    setEnemyHP(enemies[enemyNum].hp);
    setFighterHP(3); // Reset fighter HP for each battle
    setBattleLog([]);
    setOutcomeText(''); // Clear outcome text
    setWeaponAnimation(null); // Clear weapon animation
    setRound(1);
    setGameState('pre-battle');
  };

  // Start fighting
  const startBattle = () => {
    setGameState('fighting');
    setCurrentTurn('player');
    setOutcomeText(''); // Clear any previous outcome text
    setWeaponAnimation(null); // Clear any previous weapon animation
    setBattleLog([]); // Clear battle log
    setRound(1); // Reset round
    addLog(`Battle begins! Round ${round}`);
  };

  // Player Attack
  const playerAttack = () => {
    if (isAnimating || gameState !== 'fighting' || currentTurn !== 'player') return;
    
    setIsAnimating(true);
    setOutcomeText(''); // Clear previous outcome
    
    // Calculate fighter's accuracy for this enemy
    const accuracy = calculateFighterAccuracy(fighter.rarity, currentEnemy);
    
    // Show fighter weapon animation
    setWeaponAnimation(fighter.weaponVideo);
    
    // Roll for hit
    const hitRoll = Math.random() * 100;
    const didHit = hitRoll <= accuracy;
    
    setTimeout(() => {
      setWeaponAnimation(null); // Hide weapon video
      
      if (didHit) {
        setOutcomeText('FIGHTER HITS!');
        const newHP = enemyHP - 1;
        setEnemyHP(newHP);
        addLog(`${fighter.name} strikes with ${fighter.weapon}! Hit! (${newHP} HP remaining)`);
        
        if (newHP <= 0) {
          setTimeout(() => {
            enemyDefeated();
          }, 2000);
        } else {
          setTimeout(() => {
            setCurrentTurn('enemy');
            setOutcomeText('');
            enemyAttack();
          }, 2000);
        }
      } else {
        setOutcomeText('FIGHTER MISSES!');
        addLog(`${fighter.name} swings ${fighter.weapon}... MISS!`);
        
        setTimeout(() => {
          setCurrentTurn('enemy');
          setOutcomeText('');
          enemyAttack();
        }, 2000);
      }
      
      setIsAnimating(false);
    }, 2000); // 2 second weapon animation (reduced from 3)
  };

  // Enemy Attack (automated)
  const enemyAttack = () => {
    setIsAnimating(true);
    
    const enemy = enemies[currentEnemy];
    
    // Calculate enemy's accuracy against this fighter
    const accuracy = calculateEnemyAccuracy(currentEnemy, fighter.rarity);
    
    // Show enemy weapon animation
    setWeaponAnimation(enemy.weaponVideo);
    
    // Roll for hit
    const hitRoll = Math.random() * 100;
    const didHit = hitRoll <= accuracy;
    
    // DEBUG: Log the calculation
    console.log(`Enemy ${currentEnemy} attacking ${fighter.rarity} Fighter:`);
    console.log(`- Accuracy: ${accuracy}%`);
    console.log(`- Roll: ${hitRoll.toFixed(2)}`);
    console.log(`- Result: ${didHit ? 'HIT' : 'MISS'}`);
    
    setTimeout(() => {
      setWeaponAnimation(null);
      
      if (didHit) {
        setOutcomeText('ENEMY HITS!');
        const newHP = fighterHP - 1;
        setFighterHP(newHP);
        addLog(`${enemy.name} attacks with ${enemy.weapon}! Hit! (${newHP} HP remaining)`);
        
        if (newHP <= 0) {
          setTimeout(() => {
            playerDefeated();
          }, 2000);
        } else {
          setTimeout(() => {
            setRound(r => r + 1);
            setCurrentTurn('player');
            setOutcomeText('');
            addLog(`Round ${round + 1} begins!`);
          }, 2000);
        }
      } else {
        setOutcomeText('ENEMY MISSES!');
        addLog(`${enemy.name} fires ${enemy.weapon}... MISS!`);
        
        setTimeout(() => {
          setRound(r => r + 1);
          setCurrentTurn('player');
          setOutcomeText('');
          addLog(`Round ${round + 1} begins!`);
        }, 2000);
      }
      
      setIsAnimating(false);
    }, 2000); // 2 seconds (reduced from 3)
  };

  // Enemy Defeated
  const enemyDefeated = () => {
    const enemy = enemies[currentEnemy];
    setGameState('victory');
    addLog(`${enemy.name} has been defeated!`);
    setEnemiesDefeated(prev => [...prev, currentEnemy]);
    
    // Check if all 3 enemies defeated
    if (enemiesDefeated.length + 1 === 3) {
      // All enemies defeated!
      setTimeout(() => {
        setGameState('complete');
      }, 3000);
    }
  };

  // Player Defeated
  const playerDefeated = () => {
    setGameState('defeat');
    addLog(`${fighter.name} has fallen...`);
  };

  // Continue to next enemy
  const continueToNextEnemy = () => {
    setCurrentEnemy(null);
    setGameState('enemy-select');
    setBattleLog([]);
  };

  // Return to dashboard
  const exitArena = () => {
    if (onNavigate) {
      onNavigate('dashboard');
    }
  };

  if (!connected) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <Swords className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-3xl font-bold mb-4">Battle Arena</h2>
        <p className="text-gray-400 mb-8">Connect your wallet to enter the arena</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Arena Intro */}
      {gameState === 'arena-intro' && (
        <div className="text-center">
          <div className="mb-8">
            <h1 className="text-5xl font-bold mb-2">{arena.name}</h1>
            <p className="text-xl text-gray-400 mb-1">{arena.clan} Clan Territory</p>
            <p className="text-gray-500">{arena.description}</p>
          </div>

          {/* Arena Video/Image */}
          <div className="relative w-full h-96 bg-gray-900 rounded-lg overflow-hidden mb-8">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
              poster={arena.staticImage}
            >
              <source src={arena.backgroundVideo} type="video/mp4" />
              {/* Fallback to static image */}
              <img src={arena.staticImage} alt={arena.name} className="w-full h-full object-cover" />
            </video>
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            
            <div className="absolute bottom-8 left-0 right-0 text-center">
              <h2 className="text-3xl font-bold text-white mb-4">Three Enemies Await</h2>
              <button
                onClick={selectEnemyPhase}
                className="bg-red-600 hover:bg-red-700 px-8 py-4 rounded-lg font-bold text-xl transition"
              >
                Enter Battle ({battleConfig.entryCost.amount} {battleConfig.entryCost.token})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enemy Selection */}
      {gameState === 'enemy-select' && (
        <div>
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold mb-2">Choose Your Opponent</h2>
            <p className="text-gray-400">{arena.name} • {enemiesDefeated.length}/3 Defeated</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map(enemyNum => {
              const enemy = enemies[enemyNum];
              const isDefeated = enemiesDefeated.includes(enemyNum);
              const isAvailable = enemyNum === 1 || enemiesDefeated.includes(enemyNum - 1);
              const isCurrent = enemyNum === (enemiesDefeated.length + 1);
              
              return (
                <div
                  key={enemyNum}
                  className={`bg-gray-800/50 border-2 rounded-lg p-6 transition ${
                    isDefeated
                      ? 'border-green-600 opacity-50'
                      : isAvailable
                      ? 'border-gray-700 hover:border-red-600 cursor-pointer'
                      : 'border-gray-800 opacity-30 cursor-not-allowed'
                  }`}
                  onClick={() => isAvailable && !isDefeated && selectEnemy(enemyNum)}
                >
                  {/* Enemy Character Video/Image */}
                  <div className="w-full h-64 bg-gray-900 rounded-lg mb-4 overflow-hidden">
                    {isCurrent && !isDefeated ? (
                      // Current available enemy - show video
                      <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                        poster={enemy.staticImage}
                      >
                        <source src={enemy.characterVideo} type="video/mp4" />
                        <img src={enemy.staticImage} alt={enemy.name} className="w-full h-full object-cover" />
                      </video>
                    ) : (
                      // Locked or defeated enemies - show static image
                      <img src={enemy.staticImage} alt={enemy.name} className="w-full h-full object-cover" />
                    )}
                  </div>

                  <div className="text-center">
                    <h3 className="text-2xl font-bold mb-1">{enemy.name}</h3>
                    <p className="text-sm text-gray-400 mb-2">{enemy.title}</p>
                    <p className="text-xs text-gray-500 mb-4">{enemy.description}</p>
                    
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <Target className="w-4 h-4 text-red-400" />
                      <span className="text-sm">Weapon: {enemy.weapon}</span>
                    </div>

                    {isDefeated ? (
                      <div className="bg-green-900/30 border border-green-600 rounded px-4 py-2">
                        <Trophy className="w-5 h-5 inline mr-2 text-green-400" />
                        <span className="text-green-400 font-bold">DEFEATED</span>
                      </div>
                    ) : isAvailable ? (
                      <div className="space-y-2">
                        <div className="text-sm font-semibold text-yellow-400">
                          Rewards: {battleConfig.rewards[`enemy${enemyNum}`].FOOD} FOOD, {battleConfig.rewards[`enemy${enemyNum}`].GOLD} GOLD, {battleConfig.rewards[`enemy${enemyNum}`].WOOD} WOOD
                        </div>
                        <button className="w-full bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-bold transition">
                          Fight {enemy.name}
                        </button>
                      </div>
                    ) : (
                      <div className="bg-gray-900/50 border border-gray-700 rounded px-4 py-2">
                        <span className="text-gray-500 font-bold">LOCKED</span>
                        <p className="text-xs text-gray-600 mt-1">Defeat Enemy #{enemyNum - 1} first</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-8">
            <button
              onClick={exitArena}
              className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg font-semibold transition"
            >
              <ArrowLeft className="w-4 h-4 inline mr-2" />
              Exit Arena
            </button>
          </div>
        </div>
      )}

      {/* Pre-Battle Screen */}
      {gameState === 'pre-battle' && currentEnemy && (
        <div className="text-center">
          <h2 className="text-4xl font-bold mb-8">Prepare for Battle</h2>
          
          {/* Fighter Rarity Selector (Temporary for Testing) */}
          <div className="mb-6 p-4 bg-gray-900/50 border border-gray-700 rounded-lg max-w-md mx-auto">
            <p className="text-sm text-gray-400 mb-2">Select Fighter Rarity (Testing):</p>
            <div className="flex gap-2 justify-center">
              {['Bronze', 'Silver', 'Gold'].map(rarity => (
                <button
                  key={rarity}
                  onClick={() => setFighter({...fighter, rarity})}
                  className={`px-4 py-2 rounded font-bold transition ${
                    fighter.rarity === rarity
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  {rarity}
                </button>
              ))}
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Fighter */}
            <div className="bg-blue-900/20 border-2 border-blue-600 rounded-lg p-6">
              <h3 className="text-2xl font-bold mb-4">{fighter.name}</h3>
              <div className="w-48 h-48 bg-gray-900 rounded-lg mx-auto mb-4 overflow-hidden">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover rounded-lg"
                  poster={fighter.staticImage}
                >
                  <source src={fighter.characterVideo} type="video/mp4" />
                  <img src={fighter.staticImage} alt={fighter.name} className="w-full h-full object-cover rounded-lg" />
                </video>
              </div>
              <p className="text-sm text-gray-400 mb-2">Rarity: {fighter.rarity}</p>
              <p className="text-sm text-gray-400 mb-2">Weapon: {fighter.weapon}</p>
              <p className="text-sm text-yellow-400">Hit Chance: {calculateFighterAccuracy(fighter.rarity, currentEnemy)}%</p>
            </div>

            {/* Enemy */}
            <div className="bg-red-900/20 border-2 border-red-600 rounded-lg p-6">
              <h3 className="text-2xl font-bold mb-4">{enemies[currentEnemy].name}</h3>
              <div className="w-48 h-48 bg-gray-900 rounded-lg mx-auto mb-4 overflow-hidden">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover rounded-lg"
                  poster={enemies[currentEnemy].staticImage}
                >
                  <source src={enemies[currentEnemy].characterVideo} type="video/mp4" />
                  <img src={enemies[currentEnemy].staticImage} alt={enemies[currentEnemy].name} className="w-full h-full object-cover rounded-lg" />
                </video>
              </div>
              <p className="text-sm text-gray-400 mb-2">Weapon: {enemies[currentEnemy].weapon}</p>
              <p className="text-sm text-red-400">Hit Chance: {calculateEnemyAccuracy(currentEnemy, fighter.rarity)}%</p>
            </div>
          </div>

          <button
            onClick={startBattle}
            className="bg-red-600 hover:bg-red-700 px-12 py-4 rounded-lg font-bold text-xl transition"
          >
            <Swords className="w-6 h-6 inline mr-2" />
            BEGIN BATTLE
          </button>
        </div>
      )}

      {/* Active Battle */}
      {gameState === 'fighting' && currentEnemy && (
        <div>
          {/* Arena Name Header */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-400">{arena.name}</h2>
            <p className="text-sm text-gray-500">Round {round}</p>
          </div>

          {/* Battle Arena */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {/* Fighter Side */}
            <div className="bg-blue-900/20 border-2 border-blue-600 rounded-lg p-6">
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold mb-2">{fighter.name}</h3>
                <div className="flex justify-center gap-1 mb-2">
                  {[...Array(3)].map((_, i) => (
                    <Heart
                      key={i}
                      className={`w-6 h-6 ${i < fighterHP ? 'text-red-500 fill-current' : 'text-gray-600'}`}
                    />
                  ))}
                </div>
              </div>
              <div className="w-full h-48 bg-gray-900 rounded-lg overflow-hidden">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                  poster={fighter.staticImage}
                >
                  <source src={fighter.characterVideo} type="video/mp4" />
                  <img src={fighter.staticImage} alt={fighter.name} className="w-full h-full object-cover" />
                </video>
              </div>
            </div>

            {/* Center Combat Area */}
            <div className="flex flex-col justify-center items-center">
              {/* Weapon Animation OR Outcome Text */}
              {weaponAnimation ? (
                <div className="w-full h-48 bg-black rounded-lg overflow-hidden mb-4">
                  <video
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-contain"
                  >
                    <source src={weaponAnimation} type="video/mp4" />
                  </video>
                </div>
              ) : outcomeText ? (
                <div className={`text-3xl font-bold mb-4 p-6 rounded-lg ${
                  outcomeText.includes('FIGHTER') 
                    ? outcomeText.includes('HITS') ? 'bg-green-900/50 text-green-400' : 'bg-gray-900/50 text-gray-400'
                    : outcomeText.includes('HITS') ? 'bg-red-900/50 text-red-400' : 'bg-gray-900/50 text-gray-400'
                }`}>
                  {outcomeText}
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center">
                  <Swords className="w-16 h-16 text-gray-600" />
                </div>
              )}

              {/* Attack Button */}
              {currentTurn === 'player' && !isAnimating && (
                <button
                  onClick={playerAttack}
                  className="bg-red-600 hover:bg-red-700 px-8 py-4 rounded-lg font-bold transition"
                >
                  <Swords className="w-5 h-5 inline mr-2" />
                  ATTACK
                </button>
              )}

              {currentTurn === 'enemy' && (
                <div className="text-gray-400">Enemy's Turn...</div>
              )}
            </div>

            {/* Enemy Side */}
            <div className="bg-red-900/20 border-2 border-red-600 rounded-lg p-6">
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold mb-2">{enemies[currentEnemy].name}</h3>
                <div className="flex justify-center gap-1 mb-2">
                  {[...Array(3)].map((_, i) => (
                    <Heart
                      key={i}
                      className={`w-6 h-6 ${i < enemyHP ? 'text-red-500 fill-current' : 'text-gray-600'}`}
                    />
                  ))}
                </div>
              </div>
              <div className="w-full h-48 bg-gray-900 rounded-lg overflow-hidden">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                  poster={enemies[currentEnemy].staticImage}
                >
                  <source src={enemies[currentEnemy].characterVideo} type="video/mp4" />
                  <img src={enemies[currentEnemy].staticImage} alt={enemies[currentEnemy].name} className="w-full h-full object-cover" />
                </video>
              </div>
            </div>
          </div>

          {/* Battle Log */}
          <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 max-h-48 overflow-y-auto">
            <h4 className="font-bold mb-2 text-gray-400">Battle Log:</h4>
            {battleLog.map((log, i) => (
              <p key={i} className="text-sm text-gray-500 mb-1">{log}</p>
            ))}
          </div>
        </div>
      )}

      {/* Victory Screen */}
      {gameState === 'victory' && currentEnemy && (
        <div className="text-center">
          <Trophy className="w-24 h-24 text-yellow-400 mx-auto mb-6" />
          <h2 className="text-5xl font-bold mb-4 text-yellow-400">VICTORY!</h2>
          <p className="text-2xl mb-8">{enemies[currentEnemy].name} has been defeated!</p>

          <div className="bg-green-900/20 border border-green-600 rounded-lg p-6 max-w-md mx-auto mb-8">
            <h3 className="font-bold mb-4">Rewards Earned:</h3>
            <div className="space-y-2">
              <p>🍖 {battleConfig.rewards[`enemy${currentEnemy}`].FOOD} FOOD</p>
              <p>🪙 {battleConfig.rewards[`enemy${currentEnemy}`].GOLD} GOLD</p>
              <p>🪵 {battleConfig.rewards[`enemy${currentEnemy}`].WOOD} WOOD</p>
            </div>
          </div>

          <div className="space-x-4">
            {enemiesDefeated.length + 1 < 3 && (
              <button
                onClick={continueToNextEnemy}
                className="bg-red-600 hover:bg-red-700 px-8 py-4 rounded-lg font-bold transition"
              >
                Fight Next Enemy
              </button>
            )}
            <button
              onClick={exitArena}
              className="bg-gray-700 hover:bg-gray-600 px-8 py-4 rounded-lg font-bold transition"
            >
              Exit Arena
            </button>
          </div>
        </div>
      )}

      {/* Defeat Screen */}
      {gameState === 'defeat' && (
        <div className="text-center">
          <Skull className="w-24 h-24 text-red-500 mx-auto mb-6" />
          <h2 className="text-5xl font-bold mb-4 text-red-500">DEFEATED</h2>
          <p className="text-2xl mb-8">{fighter.name} has fallen in battle...</p>

          <button
            onClick={exitArena}
            className="bg-gray-700 hover:bg-gray-600 px-8 py-4 rounded-lg font-bold transition"
          >
            Return to Dashboard
          </button>
        </div>
      )}

      {/* Complete Screen (All 3 Defeated) */}
      {gameState === 'complete' && (
        <div className="text-center">
          <Crown className="w-24 h-24 text-yellow-400 mx-auto mb-6 animate-pulse" />
          <h2 className="text-5xl font-bold mb-4 text-yellow-400">GRAND CHAMPION!</h2>
          <p className="text-2xl mb-8">All enemies of The Castle Grounds have been vanquished!</p>

          <div className="bg-yellow-900/20 border-2 border-yellow-600 rounded-lg p-6 max-w-md mx-auto mb-8">
            <h3 className="font-bold mb-4 text-xl">Total Rewards + Completion Bonus:</h3>
            <div className="space-y-2 text-lg">
              <p>🍖 {battleConfig.rewards.enemy1.FOOD + battleConfig.rewards.enemy2.FOOD + battleConfig.rewards.enemy3.FOOD + battleConfig.rewards.completion.FOOD} FOOD</p>
              <p>🪙 {battleConfig.rewards.enemy1.GOLD + battleConfig.rewards.enemy2.GOLD + battleConfig.rewards.enemy3.GOLD + battleConfig.rewards.completion.GOLD} GOLD</p>
              <p>🪵 {battleConfig.rewards.enemy1.WOOD + battleConfig.rewards.enemy2.WOOD + battleConfig.rewards.enemy3.WOOD + battleConfig.rewards.completion.WOOD} WOOD</p>
            </div>
          </div>

          <button
            onClick={exitArena}
            className="bg-yellow-600 hover:bg-yellow-700 px-8 py-4 rounded-lg font-bold transition"
          >
            Return Victorious
          </button>
        </div>
      )}
    </div>
  );
}