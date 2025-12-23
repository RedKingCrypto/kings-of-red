// Fighter Metadata API Endpoint
// File: api/fighter/[tokenId].js

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

export default async function handler(req, res) {
  // Enable CORS for OpenSea
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Content-Type', 'application/json');
  
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
    // Dynamic import for ethers
    const ethers = await import('ethers');
    
    // Minimal ABI
    const FIGHTER_ABI = [
      "function getFighter(uint256) view returns (uint8, uint8, uint8, uint32, uint32, bool)"
    ];
    
    // Connect to Base
    const provider = new ethers.JsonRpcProvider(BASE_RPC);
    const contract = new ethers.Contract(FIGHTER_CONTRACT, FIGHTER_ABI, provider);
    
    // Fetch data with timeout
    const result = await Promise.race([
      contract.getFighter(id),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 10000)
      )
    ]);
    
    // Parse result
    const rarity = Number(result[0]);
    const clan = Number(result[1]);
    const energy = Number(result[2]);
    const wins = Number(result[3]);
    const losses = Number(result[4]);
    const isStaked = Boolean(result[5]);
    
    // Validate data
    if (rarity > 2 || clan > 6) {
      throw new Error('Invalid contract data');
    }
    
    const clanInfo = CLANS[clan];
    const rarityName = RARITY_NAMES[rarity];
    const rarityKey = RARITIES[rarity];
    const points = RARITY_POINTS[rarity];
    
    // Build image URL
    const imageFilename = `${rarityKey}_${clanInfo.name.toLowerCase()}.jpg`;
    const imageUrl = `${IMAGE_BASE_URL}/${imageFilename}`;
    
    // Calculate win rate
    const totalBattles = wins + losses;
    const winRate = totalBattles > 0 ? Math.round((wins / totalBattles) * 100) : 0;
    
    // Build metadata
    const metadata = {
      name: `${rarityName} ${clanInfo.fighter} #${id}`,
      description: `A ${rarityName} Fighter from the ${clanInfo.name} Clan. This ${clanInfo.fighter} is ready for battle!`,
      image: imageUrl,
      external_url: `https://kingsofred.com`,
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
    
    // Cache for 5 minutes
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    
    return res.status(200).json(metadata);
    
  } catch (error) {
    console.error('API Error:', error.message);
    
    // Return fallback metadata if contract fails
    const fallbackMetadata = {
      name: `Fighter #${id}`,
      description: `Fighter NFT #${id} from Kings of Red`,
      image: `${IMAGE_BASE_URL}/bronze_smizfume.jpg`,
      attributes: [
        {
          trait_type: "Status",
          value: "Loading..."
        }
      ]
    };
    
    return res.status(200).json(fallbackMetadata);
  }
}