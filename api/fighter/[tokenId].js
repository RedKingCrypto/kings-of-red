// Fighter Metadata API Endpoint
// File: api/fighter/[tokenId].js
// This generates dynamic metadata for Fighter NFTs

const FIGHTER_CONTRACT = '0x8b2c136B30537Be53BBe1bb7511C4c43A64d6D0d';
const BASE_RPC = 'https://mainnet.base.org';
const IMAGE_BASE_URL = 'https://gateway.pinata.cloud/ipfs/bafybeidy2j57ufvelxbahduiht6aud34ufyufgwlp6632fcadwrh3dlr4i';

// Clan info with fighter names
const CLANS = [
  { name: 'Smizfume', fighter: 'Kenshi Champion' },
  { name: 'Coalheart', fighter: 'Shinobi' },
  { name: 'Warmdice', fighter: 'Boarding Bruiser' },
  { name: 'Bervation', fighter: 'Templar Guard' },
  { name: 'Konfisof', fighter: 'Enforcer' },
  { name: 'Witkastle', fighter: 'Knight' },
  { name: 'Bowkin', fighter: 'Oakwood Guardian' }
];

const RARITIES = ['bronze', 'silver', 'gold'];
const RARITY_NAMES = ['Bronze', 'Silver', 'Gold'];
const RARITY_POINTS = [20, 50, 120];

// Minimal ABI for Fighter contract
const FIGHTER_ABI = [
  "function getFighter(uint256 tokenId) external view returns (uint8 rarity, uint8 clan, uint8 energy, uint32 wins, uint32 losses, bool isStaked)",
  "function getPvPStats(uint256 tokenId) external view returns (uint32 pvpWins, uint32 pvpLosses)"
];

export default async function handler(req, res) {
  const { tokenId } = req.query;
  
  // Validate tokenId
  if (!tokenId || isNaN(tokenId)) {
    return res.status(400).json({ error: 'Invalid token ID' });
  }
  
  const id = parseInt(tokenId);
  if (id < 1 || id > 1680) {
    return res.status(400).json({ error: 'Token ID must be between 1 and 1680' });
  }
  
  try {
    // Import ethers dynamically (Vercel serverless)
    const { ethers } = await import('ethers');
    
    // Connect to contract
    const provider = new ethers.providers.JsonRpcProvider(BASE_RPC);
    const contract = new ethers.Contract(FIGHTER_CONTRACT, FIGHTER_ABI, provider);
    
    // Fetch Fighter data from contract
    const fighter = await contract.getFighter(id);
    
    // Try to get PvP stats (might not exist yet if not implemented)
    let pvpWins = 0;
    let pvpLosses = 0;
    try {
      const pvpStats = await contract.getPvPStats(id);
      pvpWins = pvpStats.pvpWins.toNumber();
      pvpLosses = pvpStats.pvpLosses.toNumber();
    } catch (e) {
      // PvP stats not available yet, use 0
      console.log('PvP stats not available');
    }
    
    // Extract data
    const rarity = fighter.rarity; // 0, 1, or 2
    const clan = fighter.clan;     // 0-6
    const energy = fighter.energy;
    const wins = fighter.wins.toNumber();
    const losses = fighter.losses.toNumber();
    const isStaked = fighter.isStaked;
    
    // Get clan and rarity info
    const clanInfo = CLANS[clan];
    const rarityName = RARITY_NAMES[rarity];
    const rarityKey = RARITIES[rarity];
    const points = RARITY_POINTS[rarity];
    
    // Build image filename: bronze_smizfume.jpg
    const imageFilename = `${rarityKey}_${clanInfo.name.toLowerCase()}.jpg`;
    const imageUrl = `${IMAGE_BASE_URL}/${imageFilename}`;
    
    // Calculate stats
    const totalBattles = wins + losses;
    const winRate = totalBattles > 0 ? Math.round((wins / totalBattles) * 100) : 0;
    
    const totalPvP = pvpWins + pvpLosses;
    const pvpWinRate = totalPvP > 0 ? Math.round((pvpWins / totalPvP) * 100) : 0;
    
    // Build metadata JSON
    const metadata = {
      name: `${rarityName} ${clanInfo.fighter} #${id}`,
      description: `A ${rarityName} Fighter from the ${clanInfo.name} Clan. This ${clanInfo.fighter} has ${wins} wins and ${losses} losses in battle.`,
      image: imageUrl,
      attributes: [
        {
          trait_type: "Rarity",
          value: rarityName
        },
        {
          trait_type: "Clan",
          value: clanInfo.name
        },
        {
          trait_type: "Fighter Type",
          value: clanInfo.fighter
        },
        {
          trait_type: "Energy",
          value: energy,
          max_value: 100
        },
        {
          trait_type: "Wins",
          value: wins,
          display_type: "number"
        },
        {
          trait_type: "Losses",
          value: losses,
          display_type: "number"
        },
        {
          trait_type: "Win Rate",
          value: `${winRate}%`
        },
        {
          trait_type: "Total Battles",
          value: totalBattles,
          display_type: "number"
        },
        {
          trait_type: "PvP Wins",
          value: pvpWins,
          display_type: "number"
        },
        {
          trait_type: "PvP Losses",
          value: pvpLosses,
          display_type: "number"
        },
        {
          trait_type: "PvP Win Rate",
          value: `${pvpWinRate}%`
        },
        {
          trait_type: "Points",
          value: points,
          display_type: "number"
        },
        {
          trait_type: "Staked",
          value: isStaked ? "Yes" : "No"
        }
      ]
    };
    
    // Return JSON
    res.status(200).json(metadata);
    
  } catch (error) {
    console.error('Error fetching Fighter metadata:', error);
    res.status(500).json({ 
      error: 'Failed to fetch metadata',
      details: error.message 
    });
  }
}