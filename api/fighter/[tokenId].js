// Debug Fighter API - Shows exactly what's failing
// File: api/fighter/[tokenId].js

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  
  const { tokenId } = req.query;
  
  const debug = {
    step: 'start',
    tokenId: tokenId,
    error: null
  };
  
  try {
    // Step 1: Validate token ID
    debug.step = 'validate';
    if (!tokenId || isNaN(tokenId)) {
      return res.status(400).json({ error: 'Invalid token ID', debug });
    }
    
    const id = parseInt(tokenId);
    debug.tokenIdParsed = id;
    
    // Step 2: Import ethers
    debug.step = 'import_ethers';
    const ethers = await import('ethers');
    debug.ethersImported = true;
    
    // Step 3: Create provider
    debug.step = 'create_provider';
    const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
    debug.providerCreated = true;
    
    // Step 4: Test provider connection
    debug.step = 'test_network';
    const network = await provider.getNetwork();
    debug.chainId = network.chainId.toString();
    
    // Step 5: Create contract
    debug.step = 'create_contract';
    const FIGHTER_ABI = [
      "function getFighter(uint256) view returns (uint8, uint8, uint8, uint32, uint32, bool)"
    ];
    const contract = new ethers.Contract(
      '0x8b2c136B30537Be53BBe1bb7511C4c43A64d6D0d',
      FIGHTER_ABI,
      provider
    );
    debug.contractCreated = true;
    
    // Step 6: Call contract
    debug.step = 'call_contract';
    const result = await contract.getFighter(id);
    debug.contractCalled = true;
    
    // Step 7: Parse result
    debug.step = 'parse_result';
    const rarity = Number(result[0]);
    const clan = Number(result[1]);
    debug.rarity = rarity;
    debug.clan = clan;
    
    // Step 8: Build image URL
    debug.step = 'build_image';
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
    
    const clanInfo = CLANS[clan];
    const rarityName = RARITY_NAMES[rarity];
    const rarityKey = RARITIES[rarity];
    
    const imageFilename = `${rarityKey}_${clanInfo.name.toLowerCase()}.jpg`;
    const imageUrl = `https://gateway.pinata.cloud/ipfs/bafybeidy2j57ufvelxbahduiht6aud34ufyufgwlp6632fcadwrh3dlr4i/${imageFilename}`;
    
    debug.imageUrl = imageUrl;
    debug.step = 'success';
    
    // Return full metadata
    const metadata = {
      name: `${rarityName} ${clanInfo.fighter} #${id}`,
      description: `A ${rarityName} Fighter from the ${clanInfo.name} Clan. This ${clanInfo.fighter} is ready for battle!`,
      image: imageUrl,
      attributes: [
        { trait_type: "Rarity", value: rarityName },
        { trait_type: "Clan", value: clanInfo.name },
        { trait_type: "Fighter Type", value: clanInfo.fighter },
        { trait_type: "Energy", value: Number(result[2]), max_value: 100 },
        { trait_type: "Wins", value: Number(result[3]), display_type: "number" },
        { trait_type: "Losses", value: Number(result[4]), display_type: "number" },
        { trait_type: "Staked", value: result[5] ? "Yes" : "No" }
      ],
      debug: debug  // Include debug info
    };
    
    return res.status(200).json(metadata);
    
  } catch (error) {
    debug.error = error.message;
    debug.errorStack = error.stack;
    
    return res.status(500).json({
      error: 'API Error',
      message: error.message,
      debug: debug
    });
  }
}