// Contract configuration for Kings of Red on Base Mainnet

// ============ CONTRACT ADDRESSES ============
export const HERALD_CONTRACT_ADDRESS = "0xb282DC4c005C88A3E81D513D09a78f48CA404311";
export const FOOD_TOKEN_ADDRESS = "0x61921e291b88045ee2bc006c5d0a3baddd8a2d22";
export const GOLD_TOKEN_ADDRESS = "0xb7a2c42655074736988864f4851d8cf831629f22";
export const GAME_BALANCE_ADDRESS = "0xacD622935D2C3856DAd272029A5A3E36D1AcE923"; // v2
export const HERALD_STAKING_ADDRESS = "0xE8d717084C6a25837C923559760a7a3580FDb571";

// ============ IPFS IMAGE CONFIG ============
export const IPFS_IMAGE_BASE = "https://emerald-adequate-eagle-845.mypinata.cloud/ipfs/bafybeigvh7vjqgpj3jguhdbwktfdntvgqypmuu456usxpgsnrxxlh6pln4";

export const CLAN_NAMES = ['Smizfume', 'Coalheart', 'Warmdice', 'Bervation', 'Konfisof', 'Witkastle', 'Bowkin'];
export const RARITY_NAMES = ['Bronze', 'Silver', 'Gold'];

// Helper function to get Herald image URL
export const getHeraldImageUrl = (clan, rarity) => {
  const clanName = CLAN_NAMES[clan].toLowerCase();
  const rarityName = RARITY_NAMES[rarity].toLowerCase();
  return `${IPFS_IMAGE_BASE}/herald_${clanName}_${rarityName}.png`;
};

// ============ NETWORK CONFIG ============
export const BASE_MAINNET_CONFIG = {
  chainId: '0x2105', // 8453 in hex
  chainName: 'Base',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18
  },
  rpcUrls: ['https://mainnet.base.org'],
  blockExplorerUrls: ['https://basescan.org']
};

// ============ TOKEN ABIs ============
export const FOOD_TOKEN_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)"
];

export const GOLD_TOKEN_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)"
];

// ============ GAME BALANCE MANAGER ABI ============
export const GAME_BALANCE_ABI = [
  "function inGameFood(address) view returns (uint256)",
  "function inGameGold(address) view returns (uint256)",
  "function getBalances(address user) view returns (uint256 food, uint256 gold)",
  "function depositFood(uint256 amount)",
  "function depositGold(uint256 amount)",
  "function withdrawFood(uint256 amount)",
  "function withdrawGold(uint256 amount)",
  "function swapFoodForGold(uint256 foodAmount)",
  "function swapGoldForFood(uint256 goldAmount)",
  "function canWithdrawFood(address) view returns (bool)",
  "function canWithdrawGold(address) view returns (bool)",
  "function timeUntilFoodWithdrawal(address) view returns (uint256)",
  "function timeUntilGoldWithdrawal(address) view returns (uint256)",
  "function getRemainingFoodWithdrawal(address) view returns (uint256)",
  "function getRemainingGoldWithdrawal(address) view returns (uint256)",
  "function swapRatio() view returns (uint256)",
  "function lastFoodWithdrawal(address) view returns (uint256)",
  "function lastGoldWithdrawal(address) view returns (uint256)",
  "event Deposited(address indexed user, string tokenType, uint256 amount)",
  "event Withdrawn(address indexed user, string tokenType, uint256 amount, uint256 tax)",
  "event Swapped(address indexed user, string fromToken, string toToken, uint256 amountIn, uint256 amountOut, uint256 fee)"
];

// ============ HERALD STAKING ABI ============
export const HERALD_STAKING_ABI = [
  "function stakeHerald(uint256 tokenId)",
  "function unstakeHerald(uint256 tokenId)",
  "function claimRewards()",
  "function getUserStakedHeralds(address user) view returns (uint256[])",
  "function getPendingRewards(address user) view returns (uint256 totalRewards, uint256 readyCount)",
  "function getTimeUntilClaim(uint256 tokenId) view returns (uint256)",
  "function getStakeInfo(uint256 tokenId) view returns (address owner, uint256 stakedAt, uint256 lastClaim, uint8 clan, uint8 rarity, bool canClaim)",
  "function hasClanStaked(address user, uint8 clan) view returns (bool)",
  "function totalStaked() view returns (uint256)",
  "function bronzeProduction() view returns (uint256)",
  "function silverProduction() view returns (uint256)",
  "function goldProduction() view returns (uint256)",
  "function claimCost() view returns (uint256)",
  "function claimCooldown() view returns (uint256)",
  "event HeraldStaked(address indexed user, uint256 indexed tokenId, uint8 clan, uint8 rarity)",
  "event HeraldUnstaked(address indexed user, uint256 indexed tokenId)",
  "event RewardsClaimed(address indexed user, uint256 amount, uint256 goldBurned)"
];

// ============ HERALD NFT ABI ============
export const HERALD_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "numerator", "type": "uint256" },
      { "internalType": "uint256", "name": "denominator", "type": "uint256" }
    ],
    "name": "ERC2981InvalidDefaultRoyalty",
    "type": "error"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "receiver", "type": "address" }
    ],
    "name": "ERC2981InvalidDefaultRoyaltyReceiver",
    "type": "error"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" },
      { "internalType": "uint256", "name": "numerator", "type": "uint256" },
      { "internalType": "uint256", "name": "denominator", "type": "uint256" }
    ],
    "name": "ERC2981InvalidTokenRoyalty",
    "type": "error"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" },
      { "internalType": "address", "name": "receiver", "type": "address" }
    ],
    "name": "ERC2981InvalidTokenRoyaltyReceiver",
    "type": "error"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "sender", "type": "address" },
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" },
      { "internalType": "address", "name": "owner", "type": "address" }
    ],
    "name": "ERC721IncorrectOwner",
    "type": "error"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "operator", "type": "address" },
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" }
    ],
    "name": "ERC721InsufficientApproval",
    "type": "error"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "approver", "type": "address" }
    ],
    "name": "ERC721InvalidApprover",
    "type": "error"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "operator", "type": "address" }
    ],
    "name": "ERC721InvalidOperator",
    "type": "error"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "owner", "type": "address" }
    ],
    "name": "ERC721InvalidOwner",
    "type": "error"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "receiver", "type": "address" }
    ],
    "name": "ERC721InvalidReceiver",
    "type": "error"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "sender", "type": "address" }
    ],
    "name": "ERC721InvalidSender",
    "type": "error"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" }
    ],
    "name": "ERC721NonexistentToken",
    "type": "error"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "owner", "type": "address" }
    ],
    "name": "OwnableInvalidOwner",
    "type": "error"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "account", "type": "address" }
    ],
    "name": "OwnableUnauthorizedAccount",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ReentrancyGuardReentrantCall",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "holder", "type": "address" },
      { "indexed": false, "internalType": "string", "name": "code", "type": "string" }
    ],
    "name": "AffiliateCodeGenerated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "owner", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "approved", "type": "address" },
      { "indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256" }
    ],
    "name": "Approval",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "owner", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "operator", "type": "address" },
      { "indexed": false, "internalType": "bool", "name": "approved", "type": "bool" }
    ],
    "name": "ApprovalForAll",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "referrer", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "CommissionPaid",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "minter", "type": "address" },
      { "indexed": false, "internalType": "enum HeraldNFT.Rarity", "name": "rarity", "type": "uint8" },
      { "indexed": false, "internalType": "enum HeraldNFT.Clan", "name": "clan", "type": "uint8" }
    ],
    "name": "HeraldMinted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "previousOwner", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "newOwner", "type": "address" }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": false, "internalType": "enum HeraldNFT.SalePhase", "name": "newPhase", "type": "uint8" }
    ],
    "name": "PhaseChanged",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": false, "internalType": "uint256", "name": "bronze", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "silver", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "gold", "type": "uint256" }
    ],
    "name": "PricesUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "from", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "to", "type": "address" },
      { "indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256" }
    ],
    "name": "Transfer",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "MAX_BRONZE",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MAX_GOLD",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MAX_SILVER",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MAX_SUPPLY",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "activateMinting",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "name": "affiliateCode",
    "outputs": [
      { "internalType": "string", "name": "", "type": "string" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" }
    ],
    "name": "approve",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "owner", "type": "address" }
    ],
    "name": "balanceOf",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "baseTokenURI",
    "outputs": [
      { "internalType": "string", "name": "", "type": "string" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "bronzeMinted",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "bronzePrice",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "", "type": "string" }
    ],
    "name": "codeToWallet",
    "outputs": [
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "currentPhase",
    "outputs": [
      { "internalType": "enum HeraldNFT.SalePhase", "name": "", "type": "uint8" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "deactivateMinting",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "genesisLaunchTime",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" }
    ],
    "name": "getApproved",
    "outputs": [
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" }
    ],
    "name": "getHerald",
    "outputs": [
      { "internalType": "enum HeraldNFT.Rarity", "name": "rarity", "type": "uint8" },
      { "internalType": "enum HeraldNFT.Clan", "name": "clan", "type": "uint8" },
      { "internalType": "uint256", "name": "mintedAt", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "enum HeraldNFT.Rarity", "name": "rarity", "type": "uint8" }
    ],
    "name": "getMintPrice",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "enum HeraldNFT.SalePhase", "name": "phase", "type": "uint8" }
    ],
    "name": "getPhaseSupply",
    "outputs": [
      { "internalType": "uint256", "name": "bronzeLimit", "type": "uint256" },
      { "internalType": "uint256", "name": "silverLimit", "type": "uint256" },
      { "internalType": "uint256", "name": "goldLimit", "type": "uint256" },
      { "internalType": "uint256", "name": "bronzeMintedInPhase", "type": "uint256" },
      { "internalType": "uint256", "name": "silverMintedInPhase", "type": "uint256" },
      { "internalType": "uint256", "name": "goldMintedInPhase", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "goldMinted",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "goldPrice",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "name": "hasGeneratedCode",
    "outputs": [
      { "internalType": "bool", "name": "", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "name": "hasGenesisBadge",
    "outputs": [
      { "internalType": "bool", "name": "", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "name": "heralds",
    "outputs": [
      { "internalType": "enum HeraldNFT.Rarity", "name": "rarity", "type": "uint8" },
      { "internalType": "enum HeraldNFT.Clan", "name": "clan", "type": "uint8" },
      { "internalType": "uint256", "name": "mintedAt", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "owner", "type": "address" },
      { "internalType": "address", "name": "operator", "type": "address" }
    ],
    "name": "isApprovedForAll",
    "outputs": [
      { "internalType": "bool", "name": "", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint8", "name": "rarity", "type": "uint8" },
      { "internalType": "uint256", "name": "quantity", "type": "uint256" },
      { "internalType": "string", "name": "refCode", "type": "string" }
    ],
    "name": "mintHerald",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "mintingActive",
    "outputs": [
      { "internalType": "bool", "name": "", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [
      { "internalType": "string", "name": "", "type": "string" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" }
    ],
    "name": "ownerOf",
    "outputs": [
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "enum HeraldNFT.SalePhase", "name": "", "type": "uint8" }
    ],
    "name": "phaseLimits",
    "outputs": [
      { "internalType": "uint256", "name": "bronze", "type": "uint256" },
      { "internalType": "uint256", "name": "silver", "type": "uint256" },
      { "internalType": "uint256", "name": "gold", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "enum HeraldNFT.SalePhase", "name": "", "type": "uint8" }
    ],
    "name": "phaseMinted",
    "outputs": [
      { "internalType": "uint256", "name": "bronze", "type": "uint256" },
      { "internalType": "uint256", "name": "silver", "type": "uint256" },
      { "internalType": "uint256", "name": "gold", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" },
      { "internalType": "uint256", "name": "salePrice", "type": "uint256" }
    ],
    "name": "royaltyInfo",
    "outputs": [
      { "internalType": "address", "name": "receiver", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "from", "type": "address" },
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" }
    ],
    "name": "safeTransferFrom",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "from", "type": "address" },
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" },
      { "internalType": "bytes", "name": "data", "type": "bytes" }
    ],
    "name": "safeTransferFrom",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "operator", "type": "address" },
      { "internalType": "bool", "name": "approved", "type": "bool" }
    ],
    "name": "setApprovalForAll",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "newBaseURI", "type": "string" }
    ],
    "name": "setBaseURI",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_timestamp", "type": "uint256" }
    ],
    "name": "setLaunchTime",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "enum HeraldNFT.SalePhase", "name": "newPhase", "type": "uint8" }
    ],
    "name": "setPhase",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_bronze", "type": "uint256" },
      { "internalType": "uint256", "name": "_silver", "type": "uint256" },
      { "internalType": "uint256", "name": "_gold", "type": "uint256" }
    ],
    "name": "setPrices",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "silverMinted",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "silverPrice",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "bytes4", "name": "interfaceId", "type": "bytes4" }
    ],
    "name": "supportsInterface",
    "outputs": [
      { "internalType": "bool", "name": "", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [
      { "internalType": "string", "name": "", "type": "string" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" }
    ],
    "name": "tokenURI",
    "outputs": [
      { "internalType": "string", "name": "", "type": "string" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "from", "type": "address" },
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" }
    ],
    "name": "transferFrom",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "newOwner", "type": "address" }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];