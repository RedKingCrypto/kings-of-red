// Contract Configuration - Updated for Fighter V4 & Battle System
// Last Updated: January 3, 2026

// ============ CONTRACT ADDRESSES ============

// Core Contracts - FIGHTER V4 DEPLOYED!
export const FIGHTER_V4_ADDRESS = '0x303C26E8819be824f6bAEdAeEb3a2DeF3B624552';
export const BATTLE_ADDRESS = '0x8207b7aadbF253B2A087606cf01A3ED3330B3b91'; 
export const GAME_BALANCE_V4_ADDRESS = '0x3332c61Ced87a85C09ef2Cb55aE07Bd169dB0aA6';
export const HERALD_ADDRESS = '0xb282DC4c005C88A3E81D513D09a78f48CA404311';
export const HERALD_STAKING_ADDRESS = '0x2cd116Ba4f7710a8fCFd32974e82369d88929C91';

// Backward compatibility alias
export const FIGHTER_V3_ADDRESS = FIGHTER_V4_ADDRESS;

// Legacy Contracts (kept for reference)
export const FIGHTER_V2_ADDRESS = '0xA94bd2542C5f7a3774717f067b1e2cdc4A588df6';
export const GAME_BALANCE_V3_ADDRESS = '0xebd49A32d6Ba59D1de20f71ea996287fd007DC80';

// Token Contracts
export const FOOD_TOKEN_ADDRESS = '0x61921e291b88045ee2bc006c5d0a3baddd8a2d22';
export const GOLD_TOKEN_ADDRESS = '0xB7A2C42655074736988864f4851d8Cf831629f22';
export const WOOD_TOKEN_ADDRESS = '0x6BACc6CF837983B49cf645bC287981388FD210E2';
export const REDKING_TOKEN_ADDRESS = '0xd6F65D10CE2062d6dC330DA61ADd3c0693895fFf';

// Wallets
export const TREASURY_ADDRESS = '0xef0f1f34c7687eb31a6b4ada2af45ce7360c04e9';
export const BATTLE_REWARDS_ADDRESS = '0x1c4c352561df1d61338bc729b60036e56efcd25d';

// ============ FIGHTER V4 ABI ============

export const FIGHTER_V4_ABI = [
  // ===== READ FUNCTIONS =====
  
  // Fighter data
  "function fighters(uint256) view returns (uint8 rarity, uint8 clan, uint64 energy, uint64 refuelStartTime, uint32 wins, uint32 losses, uint32 pvpWins, uint32 pvpLosses, bool isStaked, bool inBattle)",
  "function getFighterStats(uint256 tokenId) view returns (uint8 rarity, uint8 clan, uint256 energy, bool isStaked, bool inBattle, bool isRefueling, uint256 refuelCompleteTime, uint256 wins, uint256 losses, uint256 pvpWins, uint256 pvpLosses, uint256 points)",
  "function getFighterInfo(uint256 tokenId) view returns (uint8 rarity, uint8 clan)",
  
  // Ownership & balance
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "function tokensOfOwner(address owner) view returns (uint256[])",
  "function tokenURI(uint256 tokenId) view returns (string)",
  
  // Staking
  "function getUserStakedFighters(address user) view returns (uint256[])",
  "function stakedCount(address user) view returns (uint256)",
  "function stakedByClan(address user, uint8 clan) view returns (uint256)",
  
  // Energy & Refuel
  "function getRefuelTimeRemaining(uint256 tokenId) view returns (uint256)",
  "function maxEnergy() view returns (uint256)",
  "function energyPerBattle() view returns (uint256)",
  "function refuelCost() view returns (uint256)",
  "function refuelDuration() view returns (uint256)",
  
  // Prices
  "function bronzePrice() view returns (uint256)",
  "function silverPrice() view returns (uint256)",
  "function goldPrice() view returns (uint256)",
  "function getMintPrice(uint8 rarity) view returns (uint256)",
  
  // Supply
  "function totalSupply() view returns (uint256)",
  "function totalMinted() view returns (uint256)",
  "function bronzeMinted() view returns (uint256)",
  "function silverMinted() view returns (uint256)",
  "function goldMinted() view returns (uint256)",
  "function getRemainingSupply(uint8 rarity) view returns (uint256)",
  "function nextTokenId() view returns (uint256)",
  
  // Phase & Supply info
  "function currentPhase() view returns (uint256)",
  "function getPhaseSupply() view returns (uint256 phase, uint256 bronzeRemaining, uint256 silverRemaining, uint256 goldRemaining)",
  "function phaseLimits(uint256 phase, uint256 index) view returns (uint256)",
  "function phaseMinted(uint256 phase, uint256 index) view returns (uint256)",
  
  // Contract info
  "function VERSION() view returns (string)",
  "function version() view returns (string)",
  "function clanArraysInitialized() view returns (bool)",
  "function mintingPaused() view returns (bool)",
  "function stakingPaused() view returns (bool)",
  "function battlesPaused() view returns (bool)",
  
  // Authorization
  "function canUseFighter(uint256 tokenId, address user) view returns (bool)",
  "function authorizedBattleContracts(address) view returns (bool)",
  
  // ===== WRITE FUNCTIONS =====
  
  // Minting - V4 style (with quantity)
  "function mintBronze(uint256 amount) payable",
  "function mintSilver(uint256 amount) payable",
  "function mintGold(uint256 amount) payable",
  
  // Staking
  "function stake(uint256 tokenId)",
  "function unstake(uint256 tokenId)",
  
  // Refuel
  "function startRefuel(uint256 tokenId)",
  "function completeRefuel(uint256 tokenId)",
  
  // Approvals
  "function approve(address to, uint256 tokenId)",
  "function setApprovalForAll(address operator, bool approved)",
  
  // ===== EVENTS =====
  "event FighterMinted(uint256 indexed tokenId, address indexed to, uint8 rarity, uint8 clan)",
  "event FighterStaked(uint256 indexed tokenId, address indexed owner)",
  "event FighterUnstaked(uint256 indexed tokenId, address indexed owner)",
  "event RefuelStarted(uint256 indexed tokenId)",
  "event RefuelCompleted(uint256 indexed tokenId)",
  "event EnergyDeducted(uint256 indexed tokenId, uint256 remaining)",
  "event BattleRecorded(uint256 indexed tokenId, bool won, bool isPvP)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
];

// Backward compatibility alias
export const FIGHTER_V3_ABI = FIGHTER_V4_ABI;

// ============ BATTLE CONTRACT ABI ============

export const BATTLE_ABI = [
  // Read Functions
  "function arenas(uint8) view returns (uint8 arenaId, string name, uint8 clan, bool active, uint256 totalBattles)",
  "function arenaEnemies(uint8 arenaId, uint8 enemyId) view returns (uint8 enemyId, string name, string title, uint8 hp, uint256[3] hitChances)",
  "function activeBattles(uint256 fighterId) view returns (uint256 fighterId, address player, uint8 arenaId, uint8 currentEnemy, uint256 startTime, bool active, uint8 battleType)",
  "function canEnterBattle(uint256 fighterId, uint8 arenaId) view returns (bool)",
  "function canFightEnemy(uint256 fighterId, uint8 arenaId, uint8 enemyId) view returns (bool)",
  "function hasDefeatedEnemy(uint256 fighterId, uint8 arenaId, uint8 enemyId) view returns (bool)",
  "function getDefeatedEnemies(uint256 fighterId, uint8 arenaId) view returns (uint8[])",
  "function getFighterAccuracy(uint256 fighterId, uint8 enemyId) view returns (uint256)",
  "function getEnemyAccuracy(uint256 fighterId, uint8 enemyId) view returns (uint256)",
  "function hasGoldHeraldStaked(address player) view returns (bool)",
  "function entryConfig() view returns (uint8 tokenId, uint256 cost, uint256 burnPercent, uint256 ownerPercent, uint256 treasuryPercent)",
  "function goldHeraldBonus() view returns (uint256)",
  "function fighterHitChances(uint8 rarity, uint8 enemyNum) view returns (uint256)",
  "function getEnemy1Rewards(uint8 arenaId) view returns (tuple(uint8 tokenId, uint256 minAmount, uint256 maxAmount)[])",
  "function getEnemy2Rewards(uint8 arenaId) view returns (tuple(uint8 tokenId, uint256 minAmount, uint256 maxAmount)[])",
  "function getEnemy3Rewards(uint8 arenaId) view returns (tuple(uint8 tokenId, uint256 minAmount, uint256 maxAmount)[])",
  
  // Write Functions  
  "function enterArena(uint256 fighterId, uint8 arenaId, uint8 enemyId)",
  "function claimVictory(uint256 fighterId, uint8 enemyId)",
  "function claimDefeat(uint256 fighterId)",
  "function timeoutBattle(uint256 fighterId)",
  
  // Events
  "event BattleStarted(uint256 indexed fighterId, uint8 arenaId, uint8 enemyId, address player)",
  "event BattleWon(uint256 indexed fighterId, uint8 arenaId, uint8 enemyId, address player)",
  "event BattleLost(uint256 indexed fighterId, uint8 arenaId, uint8 enemyId, address player)",
  "event RewardDistributed(uint256 indexed fighterId, uint8 tokenId, uint256 amount)",
  "event EntryFeePaid(address indexed player, uint8 tokenId, uint256 amount)"
];

// ============ GAMEBALANCE V4 ABI ============

export const GAME_BALANCE_V4_ABI = [
  // Read Functions
  "function inGameBalances(address user, uint8 tokenId) view returns (uint256)",
  "function getBalance(address user, uint8 tokenId) view returns (uint256)",
  "function getBalances(address user) view returns (uint256 food, uint256 gold, uint256 wood, uint256 redking)",
  "function canWithdrawToken(address user, uint8 tokenId) view returns (bool)",
  "function supportedTokens(uint8 tokenId) view returns (address tokenAddress, bool active, string symbol, bool withdrawalEnabled)",
  "function lastWithdrawal(address user, uint8 tokenId) view returns (uint256)",
  "function withdrawnToday(address user, uint8 tokenId) view returns (uint256)",
  "function dailyWithdrawalLimits(uint8 tokenId) view returns (uint256)",
  
  // Backward compatibility
  "function inGameFood(address user) view returns (uint256)",
  "function inGameGold(address user) view returns (uint256)",
  "function inGameWood(address user) view returns (uint256)",
  "function canWithdrawFood(address user) view returns (bool)",
  "function canWithdrawGold(address user) view returns (bool)",
  "function canWithdrawWood(address user) view returns (bool)",
  
  // Write Functions
  "function depositToken(uint8 tokenId, uint256 amount)",
  "function withdrawToken(uint8 tokenId, uint256 amount)",
  "function depositFood(uint256 amount)",
  "function depositGold(uint256 amount)",
  "function depositWood(uint256 amount)",
  "function depositRedking(uint256 amount)",
  
  // Events
  "event Deposited(address indexed user, uint8 tokenId, uint256 amount)",
  "event Withdrawn(address indexed user, uint8 tokenId, uint256 amount, uint256 tax)",
  "event TokensSpent(address indexed user, uint8 tokenId, uint256 amount)",
  "event TokensDeposited(address indexed user, uint8 tokenId, uint256 amount)"
];

// ============ HERALD STAKING ABI ============

export const HERALD_STAKING_ABI = [
  "function stake(uint256 tokenId)",
  "function unstake(uint256 tokenId)",
  "function getUserStakedHeralds(address user) view returns (uint256[])",
  "function hasClanStaked(address user, uint8 clan) view returns (bool)",
  "function stakedHeralds(uint256) view returns (address owner, uint256 stakedAt)",
  "event Staked(address indexed user, uint256 indexed tokenId)",
  "event Unstaked(address indexed user, uint256 indexed tokenId)"
];

// ============ HERALD NFT ABI ============

export const HERALD_ABI = [
  "function getHerald(uint256 tokenId) view returns (uint8 rarity, uint8 clan, uint256 mintedAt)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function approve(address to, uint256 tokenId)",
  "function setApprovalForAll(address operator, bool approved)"
];

// ============ ERC20 TOKEN ABI ============

export const ERC20_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

// ============ CONSTANTS ============

export const CLAN_NAMES = [
  'Smizfume',
  'Coalheart', 
  'Warmdice',
  'Bervation',
  'Konfisof',
  'Witkastle',
  'Bowkin'
];

export const RARITY_NAMES = [
  'Bronze',
  'Silver',
  'Gold'
];

export const RARITY_COLORS = {
  0: '#CD7F32', // Bronze
  1: '#C0C0C0', // Silver
  2: '#FFD700'  // Gold
};

export const TOKEN_IDS = {
  FOOD: 1,
  GOLD: 2,
  WOOD: 3,
  REDKING: 4
};

export const ARENA_IDS = {
  SMIZFUME: 0,
  COALHEART: 1,
  WARMDICE: 2,
  BERVATION: 3,
  KONFISOF: 4,
  WITKASTLE: 5,
  BOWKIN: 6
};

// Fighter V4 Constants
export const MAX_BRONZE = 777;
export const MAX_SILVER = 560;
export const MAX_GOLD = 343;
export const MAX_SUPPLY = 1680;
export const MAX_MINT_PER_TX = 7;
export const MAX_STAKED_PER_WALLET = 7;

export const ENERGY_PER_BATTLE = 20;
export const MAX_ENERGY = 100;
export const REFUEL_COST = 50; // FOOD tokens
export const REFUEL_DURATION = 3 * 60 * 60; // 3 hours in seconds
export const BATTLE_ENTRY_FEE = 50; // FOOD tokens
export const BATTLE_TIMEOUT = 60 * 60; // 1 hour in seconds

// Phase limits
export const PHASE_LIMITS = {
  1: { bronze: 98, silver: 77, gold: 49 },    // Genesis
  2: { bronze: 210, silver: 140, gold: 70 },  // Early Bird
  3: { bronze: 231, silver: 168, gold: 112 }, // Public A
  4: { bronze: 238, silver: 175, gold: 112 }  // Public B
};

// ============ HELPER FUNCTIONS ============

export const getClanName = (clanId) => CLAN_NAMES[clanId] || 'Unknown';
export const getRarityName = (rarityId) => RARITY_NAMES[rarityId] || 'Unknown';
export const getRarityColor = (rarityId) => RARITY_COLORS[rarityId] || '#FFFFFF';

export const formatTokenAmount = (amount, decimals = 18) => {
  return (Number(amount) / Math.pow(10, decimals)).toFixed(2);
};

export const parseTokenAmount = (amount, decimals = 18) => {
  return BigInt(Math.floor(amount * Math.pow(10, decimals)));
};

// Herald Image URL Generator
export const getHeraldImageUrl = (clan, rarity) => {
  const baseUrl = 'https://emerald-adequate-eagle-845.mypinata.cloud/ipfs/bafybeigvh7vjqgpj3jguhdbwktfdntvgqypmuu456usxpgsnrxxlh6pln4';
  const rarityName = RARITY_NAMES[rarity].toLowerCase();
  const clanName = CLAN_NAMES[clan].toLowerCase();
  return `${baseUrl}/${rarityName}_${clanName}.png`;
};

// Backward compatibility aliases
export const HERALD_CONTRACT_ADDRESS = HERALD_ADDRESS;
export const FOOD_TOKEN_ABI = ERC20_ABI;
export const GOLD_TOKEN_ABI = ERC20_ABI;
export const WOOD_TOKEN_ABI = ERC20_ABI;
export const REDKING_TOKEN_ABI = ERC20_ABI;
export const GAME_BALANCE_ADDRESS = GAME_BALANCE_V4_ADDRESS;
export const GAME_BALANCE_ABI = GAME_BALANCE_V4_ABI;

export default {
  // Addresses
  FIGHTER_V4_ADDRESS,
  FIGHTER_V3_ADDRESS, // Alias to V4
  BATTLE_ADDRESS,
  GAME_BALANCE_V4_ADDRESS,
  HERALD_ADDRESS,
  HERALD_STAKING_ADDRESS,
  FOOD_TOKEN_ADDRESS,
  GOLD_TOKEN_ADDRESS,
  WOOD_TOKEN_ADDRESS,
  REDKING_TOKEN_ADDRESS,
  
  // ABIs
  FIGHTER_V4_ABI,
  FIGHTER_V3_ABI, // Alias to V4
  BATTLE_ABI,
  GAME_BALANCE_V4_ABI,
  HERALD_STAKING_ABI,
  HERALD_ABI,
  ERC20_ABI,
  
  // Constants
  CLAN_NAMES,
  RARITY_NAMES,
  RARITY_COLORS,
  TOKEN_IDS,
  ARENA_IDS,
  PHASE_LIMITS,
  MAX_BRONZE,
  MAX_SILVER,
  MAX_GOLD,
  MAX_SUPPLY,
  
  // Helpers
  getClanName,
  getRarityName,
  getRarityColor,
  formatTokenAmount,
  parseTokenAmount,
  getHeraldImageUrl
};