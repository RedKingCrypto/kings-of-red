// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract HeraldNFT is ERC721, ERC2981, Ownable, ReentrancyGuard {
    
    // ============ ENUMS ============
    
    enum Rarity { Bronze, Silver, Gold }
    enum Clan { Smizfume, Coalheart, Warmdice, Bervation, Konfisof, Witkastle, Bowkin }
    enum SalePhase { None, Genesis, EarlyBird, PublicA, PublicB }
    
    // ============ STRUCTS ============
    
    struct Herald {
        Rarity rarity;
        Clan clan;
        uint256 mintedAt;
    }
    
    struct SupplyConfig {
        uint256 bronze;
        uint256 silver;
        uint256 gold;
    }
    
    // ============ STATE VARIABLES ============
    
    // Total supply limits (all 1,610 Heralds)
    uint256 public constant MAX_BRONZE = 770;
    uint256 public constant MAX_SILVER = 558;
    uint256 public constant MAX_GOLD = 282;
    uint256 public constant MAX_SUPPLY = 1610;
    
    // Current minted counts
    uint256 public bronzeMinted;
    uint256 public silverMinted;
    uint256 public goldMinted;
    uint256 private _tokenIdCounter;
    
    // Pricing (adjustable by owner)
    uint256 public bronzePrice = 0.0025 ether;  // $7 at $2800/ETH
    uint256 public silverPrice = 0.00821 ether; // $23
    uint256 public goldPrice = 0.01393 ether;   // $39
    
    // Sale phase management
    SalePhase public currentPhase = SalePhase.None;
    mapping(SalePhase => SupplyConfig) public phaseLimits;
    mapping(SalePhase => SupplyConfig) public phaseMinted;
    
    // Time-lock
    uint256 public genesisLaunchTime;
    bool public mintingActive = false;
    
    // Metadata
    string public baseTokenURI = "ipfs://bafybeidqkydr7cfpwvgoozqe7r35zzhae57rga2rtqhqutkdgh4inm624m/";
    
    // NFT data
    mapping(uint256 => Herald) public heralds;
    
    // Affiliate system
    mapping(address => string) public affiliateCode;
    mapping(string => address) public codeToWallet;
    mapping(address => bool) public hasGeneratedCode;
    
    // Genesis badge tracking
    mapping(address => bool) public hasGenesisBadge;
    
    // ============ EVENTS ============
    
    event HeraldMinted(
        uint256 indexed tokenId, 
        address indexed minter, 
        Rarity rarity, 
        Clan clan
    );
    event PhaseChanged(SalePhase newPhase);
    event PricesUpdated(uint256 bronze, uint256 silver, uint256 gold);
    event AffiliateCodeGenerated(address indexed holder, string code);
    event CommissionPaid(address indexed referrer, uint256 amount);
    
    // ============ CONSTRUCTOR ============
    
    constructor() 
        ERC721("Kings of Red Herald", "KORH") 
        Ownable(msg.sender) 
    {
        _setDefaultRoyalty(msg.sender, 300); // 3% royalty
        
        // Set Genesis sale limits (100/77/43)
        phaseLimits[SalePhase.Genesis] = SupplyConfig(100, 77, 43);
        
        // Set Early Bird limits (140/100/77)
        phaseLimits[SalePhase.EarlyBird] = SupplyConfig(140, 100, 77);
        
        // Set Public A limits (265/181/91)
        phaseLimits[SalePhase.PublicA] = SupplyConfig(265, 181, 91);
        
        // Set Public B limits (265/181/90)
        phaseLimits[SalePhase.PublicB] = SupplyConfig(265, 181, 90);
    }
    
    // ============ MINTING FUNCTIONS ============
    
    function mintHerald(
        uint8 rarity, 
        uint256 quantity,
        string memory refCode
    ) external payable nonReentrant {
        require(mintingActive, "Minting not active");
        require(currentPhase != SalePhase.None, "No active sale phase");
        require(quantity > 0 && quantity <= 7, "Mint 1-7 NFTs per transaction");
        require(rarity <= 2, "Invalid rarity");
        
        Rarity rarityEnum = Rarity(rarity);
        uint256 price = getMintPrice(rarityEnum);
        uint256 totalPrice = price * quantity;
        
        require(msg.value >= totalPrice, "Insufficient payment");
        
        // Check supply limits for current phase
        _checkPhaseSupply(rarityEnum, quantity);
        
        // Check global supply limits
        _checkGlobalSupply(rarityEnum, quantity);
        
        // Process referral commission if valid
        uint256 ownerPayment = totalPrice;
        address referrer = codeToWallet[refCode];
        
        if (referrer != address(0) && 
            referrer != msg.sender && 
            hasGeneratedCode[referrer]) {
            
            uint256 commission = (totalPrice * 7) / 100; // 7%
            ownerPayment = totalPrice - commission;
            
            payable(referrer).transfer(commission);
            emit CommissionPaid(referrer, commission);
        }
        
        // Pay owner (minus commission if applicable)
        payable(owner()).transfer(ownerPayment);
        
        // Mint the NFTs
        for (uint256 i = 0; i < quantity; i++) {
            _mintSingleHerald(msg.sender, rarityEnum);
        }
        
        // Generate affiliate code for first-time minters
        if (!hasGeneratedCode[msg.sender]) {
            _generateAffiliateCode(msg.sender);
        }
        
        // Award Genesis badge if this is Genesis phase
        if (currentPhase == SalePhase.Genesis) {
            hasGenesisBadge[msg.sender] = true;
        }
        
        // Refund excess payment
        if (msg.value > totalPrice) {
            payable(msg.sender).transfer(msg.value - totalPrice);
        }
    }
    
    function _mintSingleHerald(address to, Rarity rarity) internal {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        // Randomly assign clan
        Clan clan = Clan(uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            msg.sender,
            tokenId
        ))) % 7);
        
        // Store Herald data
        heralds[tokenId] = Herald({
            rarity: rarity,
            clan: clan,
            mintedAt: block.timestamp
        });
        
        // Update counters
        if (rarity == Rarity.Bronze) {
            bronzeMinted++;
            phaseMinted[currentPhase].bronze++;
        } else if (rarity == Rarity.Silver) {
            silverMinted++;
            phaseMinted[currentPhase].silver++;
        } else {
            goldMinted++;
            phaseMinted[currentPhase].gold++;
        }
        
        _safeMint(to, tokenId);
        emit HeraldMinted(tokenId, to, rarity, clan);
    }
    
    // ============ SUPPLY CHECKS ============
    
    function _checkPhaseSupply(Rarity rarity, uint256 quantity) internal view {
        SupplyConfig memory limits = phaseLimits[currentPhase];
        SupplyConfig memory minted = phaseMinted[currentPhase];
        
        if (rarity == Rarity.Bronze) {
            require(minted.bronze + quantity <= limits.bronze, "Phase Bronze limit reached");
        } else if (rarity == Rarity.Silver) {
            require(minted.silver + quantity <= limits.silver, "Phase Silver limit reached");
        } else {
            require(minted.gold + quantity <= limits.gold, "Phase Gold limit reached");
        }
    }
    
    function _checkGlobalSupply(Rarity rarity, uint256 quantity) internal view {
        if (rarity == Rarity.Bronze) {
            require(bronzeMinted + quantity <= MAX_BRONZE, "Max Bronze supply reached");
        } else if (rarity == Rarity.Silver) {
            require(silverMinted + quantity <= MAX_SILVER, "Max Silver supply reached");
        } else {
            require(goldMinted + quantity <= MAX_GOLD, "Max Gold supply reached");
        }
    }
    
    // ============ AFFILIATE SYSTEM ============
    
    function _generateAffiliateCode(address holder) internal {
        bytes32 hash = keccak256(abi.encodePacked(holder, block.timestamp));
        string memory code = string(abi.encodePacked(
            "KOR-",
            _toHexString(uint256(hash), 6)
        ));
        
        affiliateCode[holder] = code;
        codeToWallet[code] = holder;
        hasGeneratedCode[holder] = true;
        
        emit AffiliateCodeGenerated(holder, code);
    }
    
    function _toHexString(uint256 value, uint256 length) internal pure returns (string memory) {
        bytes memory buffer = new bytes(2 * length);
        for (uint256 i = 2 * length; i > 0; --i) {
            buffer[i - 1] = bytes1(uint8(48 + uint8(value & 0xf)));
            if (buffer[i - 1] > '9') {
                buffer[i - 1] = bytes1(uint8(buffer[i - 1]) + 39);
            }
            value >>= 4;
        }
        return string(buffer);
    }
    
    // ============ VIEW FUNCTIONS ============
    
    function getMintPrice(Rarity rarity) public view returns (uint256) {
        if (rarity == Rarity.Bronze) return bronzePrice;
        if (rarity == Rarity.Silver) return silverPrice;
        return goldPrice;
    }
    
    function getHerald(uint256 tokenId) external view returns (
        Rarity rarity,
        Clan clan,
        uint256 mintedAt
    ) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        Herald memory herald = heralds[tokenId];
        return (herald.rarity, herald.clan, herald.mintedAt);
    }
    
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter;
    }
    
    function getPhaseSupply(SalePhase phase) external view returns (
        uint256 bronzeLimit,
        uint256 silverLimit,
        uint256 goldLimit,
        uint256 bronzeMintedInPhase,
        uint256 silverMintedInPhase,
        uint256 goldMintedInPhase
    ) {
        SupplyConfig memory limits = phaseLimits[phase];
        SupplyConfig memory minted = phaseMinted[phase];
        return (
            limits.bronze, limits.silver, limits.gold,
            minted.bronze, minted.silver, minted.gold
        );
    }
    
    // ============ OWNER FUNCTIONS ============
    
    function setPhase(SalePhase newPhase) external onlyOwner {
        currentPhase = newPhase;
        emit PhaseChanged(newPhase);
    }
    
    function setPrices(
        uint256 _bronze,
        uint256 _silver,
        uint256 _gold
    ) external onlyOwner {
        bronzePrice = _bronze;
        silverPrice = _silver;
        goldPrice = _gold;
        emit PricesUpdated(_bronze, _silver, _gold);
    }
    
    function setLaunchTime(uint256 _timestamp) external onlyOwner {
        genesisLaunchTime = _timestamp;
    }
    
    function activateMinting() external onlyOwner {
        require(
            genesisLaunchTime == 0 || block.timestamp >= genesisLaunchTime,
            "Too early to activate"
        );
        mintingActive = true;
    }
    
    function deactivateMinting() external onlyOwner {
        mintingActive = false;
    }
    
    function setBaseURI(string memory newBaseURI) external onlyOwner {
        baseTokenURI = newBaseURI;
    }
    
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        payable(owner()).transfer(balance);
    }
    
    // ============ METADATA ============
    
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        
        Herald memory herald = heralds[tokenId];
        
        string memory rarityStr = herald.rarity == Rarity.Gold ? "gold" :
                                   herald.rarity == Rarity.Silver ? "silver" : "bronze";
        
        string memory clanStr = _getClanName(herald.clan);
        
        return string(abi.encodePacked(
            baseTokenURI,
            clanStr,
            "_",
            rarityStr,
            ".json"
        ));
    }
    
    function _getClanName(Clan clan) internal pure returns (string memory) {
        if (clan == Clan.Smizfume) return "smizfume";
        if (clan == Clan.Coalheart) return "coalheart";
        if (clan == Clan.Warmdice) return "warmdice";
        if (clan == Clan.Bervation) return "bervation";
        if (clan == Clan.Konfisof) return "konfisof";
        if (clan == Clan.Witkastle) return "witkastle";
        return "bowkin";
    }
    
    // ============ REQUIRED OVERRIDES ============
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}