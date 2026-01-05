// ==============================================================================
// KINGS OF RED - CONTRACT CONFIGURATION
// Last Updated: January 4, 2026
// Network: Base Mainnet (Chain ID: 8453)
// ==============================================================================

// ==================== CONTRACT ADDRESSES ====================

// HERALD NFT CONTRACT (Non-Upgradeable)
export const HERALD_ADDRESS = '0xb282DC4c005C88A3E81D513D09a78f48CA404311';

// HERALD STAKING CONTRACT  
export const HERALD_STAKING_ADDRESS = '0x2cd116Ba4f7710a8fCFd32974e82369d88929C91';

// FIGHTER NFT CONTRACT (UUPS Proxy - V4)
export const FIGHTER_ADDRESS = '0x303C26E8819be824f6bAEdAeEb3a2DeF3B624552';

// BATTLE CONTRACT (UUPS Proxy - V2.2)
export const BATTLE_ADDRESS = '0x8207b7aadbF253B2A087606cf01A3ED3330B3b91';

// GAMEBALANCE CONTRACT (UUPS Proxy - V4)
export const GAMEBALANCE_ADDRESS = '0x3332c61Ced87a85C09ef2Cb55aE07Bd169dB0aA6';

// TOKEN ADDRESSES
export const FOOD_ADDRESS = '0x61921e291b88045ee2bc006c5d0a3baddd8a2d22';
export const GOLD_ADDRESS = '0xB7A2C42655074736988864f4851d8Cf831629f22';
export const WOOD_ADDRESS = '0x6BACc6CF837983B49cf645bC287981388FD210E2';
export const RKT_ADDRESS = '0xd6F65D10CE2062d6dC330DA61ADd3c0693895fFf';

// WALLET ADDRESSES
export const TREASURY_ADDRESS = '0xef0f1f34c7687eb31a6b4ada2af45ce7360c04e9';
export const OWNER_ADDRESS = '0x1350Bb46F203E5cD9b59f52FcBB43FF4fa8877b4';

// ==================== HERALD ABI ====================
// This is the CORRECT ABI for Herald minting page

export const HERALD_ABI = [
  // View Functions - Prices
  "function bronzePrice() view returns (uint256)",
  "function silverPrice() view returns (uint256)",
  "function goldPrice() view returns (uint256)",
  
  // View Functions - Minted Counts
  "function bronzeMinted() view returns (uint256)",
  "function silverMinted() view returns (uint256)",
  "function goldMinted() view returns (uint256)",
  
  // View Functions - Supply Limits
  "function bronzeSupply() view returns (uint256)",
  "function silverSupply() view returns (uint256)",
  "function goldSupply() view returns (uint256)",
  
  // View Functions - Genesis & Affiliate
  "function hasGenesisBadge(address user) view returns (bool)",
  "function affiliateCode(address user) view returns (string)",
  "function isAffiliateCodeUsed(string code) view returns (bool)",
  
  // View Functions - Token Info
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function balanceOf(address owner) view returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function totalSupply() view returns (uint256)",
  
  // View Functions - Token Data
  "function tokenRarity(uint256 tokenId) view returns (uint8)",
  "function tokenClan(uint256 tokenId) view returns (uint8)",
  
  // View Functions - Sale Phase
  "function currentPhase() view returns (uint8)",
  "function mintingActive() view returns (bool)",
  
  // Write Functions - Minting
  "function mintHerald(uint8 rarity, uint256 quantity, string referralCode) payable",
  
  // Events
  "event HeraldMinted(address indexed owner, uint256 indexed tokenId, uint8 rarity, uint8 clan)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
];

// ==================== HERALD STAKING ABI ====================

export const HERALD_STAKING_ABI = [
  // View Functions
  "function stakedHeralds(address user) view returns (uint256[])",
  "function isStaked(uint256 tokenId) view returns (bool)",
  "function getStakedInfo(uint256 tokenId) view returns (address owner, uint256 stakedAt, getHeraldImageUrl, uint256 lastClaimed)",
  "function getPendingRewards(uint256 tokenId) view returns (uint256)",
  "function getTotalPendingRewards(address user) view returns (uint256)",
  "function hasClanStaked(address user, uint8 clan) view returns (bool)",
  "function getStakedByClan(address user, uint8 clan) view returns (uint256)",
  
  // Write Functions
  "function stake(uint256 tokenId)",
  "function unstake(uint256 tokenId)",
  "function claimRewards(uint256 tokenId)",
  "function claimAllRewards()",
  
  // Events
  "event Staked(address indexed user, uint256 indexed tokenId)",
  "event Unstaked(address indexed user, uint256 indexed tokenId)",
  "event RewardsClaimed(address indexed user, uint256 indexed tokenId, uint256 amount)"
];

// ==================== FIGHTER ABI ====================

export const FIGHTER_ABI = [
  // View Functions - Prices
  "function bronzePrice() view returns (uint256)",
  "function silverPrice() view returns (uint256)",
  "function goldPrice() view returns (uint256)",
  
  // View Functions - Minted Counts
  "function bronzeMinted() view returns (uint256)",
  "function silverMinted() view returns (uint256)",
  "function goldMinted() view returns (uint256)",
  
  // View Functions - Phase System
  "function currentPhase() view returns (uint8)",
  "function getPhaseSupply(uint8 phase) view returns (uint256 bronze, uint256 silver, uint256 gold)",
  "function mintingPaused() view returns (bool)",
  
  // View Functions - Token Info
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function balanceOf(address owner) view returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function totalSupply() view returns (uint256)",
  
  // View Functions - Fighter Data
  "function getFighter(uint256 tokenId) view returns (uint8 rarity, uint8 clan, uint8 energy, uint32 wins, uint32 losses, bool isStaked, uint256 lastRefuelTime)",
  "function tokenRarity(uint256 tokenId) view returns (uint8)",
  "function tokenClan(uint256 tokenId) view returns (uint8)",
  
  // View Functions - Staking
  "function isStaked(uint256 tokenId) view returns (bool)",
  "function stakedFighters(address user) view returns (uint256[])",
  
  // Write Functions - Minting
  "function mintBronze(uint256 quantity) payable",
  "function mintSilver(uint256 quantity) payable",
  "function mintGold(uint256 quantity) payable",
  
  // Write Functions - Staking
  "function stake(uint256 tokenId)",
  "function unstake(uint256 tokenId)",
  
  // Write Functions - Refuel
  "function refuel(uint256 tokenId)",
  
  // Events
  "event FighterMinted(address indexed owner, uint256 indexed tokenId, uint8 rarity, uint8 clan)",
  "event FighterStaked(address indexed owner, uint256 indexed tokenId)",
  "event FighterUnstaked(address indexed owner, uint256 indexed tokenId)",
  "event FighterRefueled(uint256 indexed tokenId, uint8 newEnergy)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
];

// ==================== BATTLE ABI ====================

export const BATTLE_ABI = [
  // View Functions - Arena Info
  "function getArenaInfo(uint8 arenaId) view returns (string name, bool active, uint8 enemyCount)",
  "function getEnemyInfo(uint8 arenaId, uint8 enemyId) view returns (string name, uint8 health, uint8 bronzeHitChance, uint8 silverHitChance, uint8 goldHitChance, bool active)",
  "function getRewardConfig(uint8 arenaId, uint8 enemyId) view returns (uint256 foodMin, uint256 foodMax, uint256 goldMin, uint256 goldMax, uint256 woodMin, uint256 woodMax, uint256 rktMin, uint256 rktMax)",
  
  // View Functions - Battle State
  "function getBattleState(uint256 fighterId) view returns (bool inBattle, uint8 arenaId, uint8 enemyId, uint8 enemyHealth, uint8 fighterHealth, uint256 battleStartTime)",
  "function isInBattle(uint256 fighterId) view returns (bool)",
  "function canClaimVictory(uint256 fighterId) view returns (bool)",
  "function canClaimDefeat(uint256 fighterId) view returns (bool)",
  
  // View Functions - Config
  "function entryFee() view returns (uint256)",
  "function battleTimeout() view returns (uint256)",
  
  // Write Functions - Battle Actions
  "function enterArena(uint256 fighterId, uint8 arenaId, uint8 enemyId)",
  "function attack(uint256 fighterId)",
  "function claimVictory(uint256 fighterId)",
  "function claimDefeat(uint256 fighterId)",
  
  // Events
  "event BattleStarted(uint256 indexed fighterId, uint8 arenaId, uint8 enemyId)",
  "event AttackPerformed(uint256 indexed fighterId, bool fighterHit, bool enemyHit, uint8 fighterDamage, uint8 enemyDamage)",
  "event BattleWon(uint256 indexed fighterId, uint8 arenaId, uint8 enemyId)",
  "event BattleLost(uint256 indexed fighterId, uint8 arenaId, uint8 enemyId)",
  "event RewardsDistributed(address indexed player, uint256 food, uint256 gold, uint256 wood, uint256 rkt)"
];

// ==================== GAMEBALANCE ABI ====================

export const GAMEBALANCE_ABI = [
  // View Functions - Balances
  "function getBalance(address user, uint8 tokenId) view returns (uint256)",
  "function getAllBalances(address user) view returns (uint256 food, uint256 gold, uint256 wood, uint256 rkt)",
  
  // View Functions - Withdrawal Info
  "function getDailyWithdrawLimit(uint8 tokenId) view returns (uint256)",
  "function getWithdrawTax(uint8 tokenId) view returns (uint256)",
  "function getLastWithdraw(address user, uint8 tokenId) view returns (uint256)",
  "function canWithdraw(address user, uint8 tokenId) view returns (bool)",
  
  // Write Functions
  "function deposit(uint8 tokenId, uint256 amount)",
  "function withdraw(uint8 tokenId, uint256 amount)",
  
  // Events
  "event Deposited(address indexed user, uint8 tokenId, uint256 amount)",
  "event Withdrawn(address indexed user, uint8 tokenId, uint256 amount, uint256 tax)"
];

// ==================== ERC20 ABI (For Token Approvals) ====================

export const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)"
];

// ==================== CONSTANTS ====================

export const CLANS = [
  { id: 0, name: 'Smizfume', color: 'from-red-600 to-orange-500' },
  { id: 1, name: 'Coalheart', color: 'from-gray-600 to-slate-400' },
  { id: 2, name: 'Warmdice', color: 'from-purple-600 to-indigo-500' },
  { id: 3, name: 'Bervation', color: 'from-blue-600 to-cyan-500' },
  { id: 4, name: 'Konfisof', color: 'from-green-600 to-emerald-500' },
  { id: 5, name: 'Witkastle', color: 'from-yellow-500 to-amber-400' },
  { id: 6, name: 'Bowkin', color: 'from-rose-600 to-red-700' }
];

export const RARITIES = {
  BRONZE: 0,
  SILVER: 1,
  GOLD: 2
};

export const TOKEN_IDS = {
  FOOD: 1,
  GOLD: 2,
  WOOD: 3,
  RKT: 4
};

// Daily production rates (per Herald)
export const HERALD_DAILY_PRODUCTION = {
  0: 20,   // Bronze: 20 FOOD/day
  1: 65,   // Silver: 65 FOOD/day
  2: 100   // Gold: 100 FOOD/day
};

// Fighter energy costs
export const FIGHTER_BATTLE_ENERGY_COST = 20;
export const FIGHTER_MAX_ENERGY = 100;
export const FIGHTER_REFUEL_COST = 50; // FOOD tokens
export const FIGHTER_REFUEL_TIME = 3 * 60 * 60; // 3 hours in seconds

// Battle entry fee
export const BATTLE_ENTRY_FEE = 50; // FOOD tokens

// Herald claim cost
export const HERALD_CLAIM_COST = 7; // GOLD tokens