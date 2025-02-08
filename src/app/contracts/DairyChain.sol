// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title DairyChain - A Dairy Supply Chain Management Smart Contract
 * @notice IMPORTANT: This is a proof of concept contract with known limitations:
 * - Stores significant data on-chain which can be costly in production
 * - May have high gas costs for data retrieval and storage
 * - Simplified reward mechanism for demonstration
 * - Limited error handling and recovery mechanisms
 *
 * @dev This contract tracks dairy products from farm to retailer and rewards participants
 * with DAIRY tokens. It inherits from OpenZeppelin's ERC20 for token functionality.
 */
contract DairyChain is ERC20("DairyChain Token", "DAIRY") {
    // ========== Constants ==========

    /// @notice Quality threshold constants for milk parameters
    /// @dev Values for pH, fat, and protein are multiplied by 10 to avoid decimals
    uint256 public constant MAX_TEMPERATURE = 4; // 4°C
    uint256 public constant MIN_PH = 66; // 6.6 (multiplied by 10)
    uint256 public constant MAX_PH = 68; // 6.8 (multiplied by 10)
    uint256 public constant MIN_FAT_CONTENT = 35; // 3.5% (multiplied by 10)
    uint256 public constant MIN_PROTEIN_CONTENT = 32; // 3.2% (multiplied by 10)
    uint256 public constant MAX_BACTERIAL_COUNT = 100000; // 100,000 CFU/ml

    /// @notice Amount of DAIRY tokens awarded for completing tasks
    uint256 public constant REWARD_AMOUNT = 10;

    // ========== State Variables ==========

    /// @notice Addresses of authorized participants in the supply chain
    address public milkCollector;
    address public milkInspector;
    address public milkProcessor;
    address public productionManager;
    address public productionDispatcher;
    address public distributor;
    address public retailer;

    /// @notice Batch tracking variables
    mapping(uint256 => Batch) public batches;
    uint256 public nextBatchId;
    mapping(uint256 => FarmerMilkCollection) public farmerMilkCollections;

    // ========== Enums ==========

    /// @notice Represents the current state of a milk batch in the supply chain
    enum BatchStatus {
        BatchSentToProcessingPlant, // Set by Milk Collector
        BatchSentToMilkProcessor, // Set by Milk Inspector
        ProcessingStarted, // Set by Milk Processor
        ProcessingCompleted, // Set by Milk Processor
        ProductionStarted, // Set by Production Manager
        ProductionCompleted, // Set by Production Manager
        DispatchedToDistribution, // Set by Production Dispatcher
        DispatchedToRetailer, // Set by Distributor
        OrderReceivedAtRetailerStore // Set by Retailer
    }

    // ========== Structs ==========

    /// @notice Stores milk quality parameters
    /// @dev Values for pH, fat, and protein should be multiplied by 10
    struct MilkQuality {
        uint256 temperature; // in Celsius
        uint256 pH; // multiplied by 10 (e.g., 6.8 = 68)
        uint256 fatContent; // percentage multiplied by 10
        uint256 proteinContent; // percentage multiplied by 10
        uint256 bacterialCount; // CFU/ml
    }

    /// @notice Records milk collection details from farmers
    struct FarmerMilkCollection {
        uint256 farmerId;
        uint256 totalMilkQuantity;
        MilkQuality quality;
        bool isMilkAccepted;
        uint256 timestamp;
    }

    struct InspectionData {
        uint256 truckNumber;
        uint256 receivedMilkQuantity;
        MilkQuality quality;
        uint256 inspectionTimestamp;
        bool isBatchAccepted;
    }

    struct ProcessingData {
        uint256 processingStartTime;
        uint256 processingEndTime;
        uint256 processedMilkQuantity;
        MilkQuality processedQuality;
    }

    struct ProductionData {
        uint256 productionStartTime;
        uint256 productionEndTime;
        uint256 totalBottlesProduced;
        MilkQuality productionQuality;
    }

    struct ProductionDispatchedData {
        uint256 bottlesReceived;
        uint256 dispatcherTimestamp;
        uint256 bottlesDispatched;
    }

    struct DistributionData {
        uint256 dispatcherTimestamp;
        uint256 bottlesReceived;
        uint256 bottlesDispatched;
        uint256 distributorReceivedTimestamp;
        uint256 distributorDispatchedTimestamp;
    }

    struct RetailerData {
        uint256 retailerReceivedTimestamp;
        uint256 retailerTotalBottlesReceived;
    }

    // Input parameter structs
    struct BatchCreationParams {
        string truckNumber;
        uint256 totalMilkQuantity;
        MilkQuality quality;
        uint256 batchCreationTimestamp;
    }

    // Simplified Batch struct using component structs
    struct Batch {
        uint256 batchId;
        BatchStatus status;
        BatchCreationParams batchCreationParams;
        InspectionData inspection;
        ProcessingData processing;
        ProductionData production;
        ProductionDispatchedData dispatched;
        DistributionData distribution;
        RetailerData retail;
    }

    // ========== Events ==========

    /// @notice Emitted when milk is collected from a farmer
    /// @param farmerId Unique identifier of the farmer
    /// @param totalMilkQuantity Amount of milk collected in liters
    /// @param quality Quality parameters of collected milk
    /// @param timestamp Time of collection
    event FarmerMilkCollected(
        uint256 indexed farmerId,
        uint256 totalMilkQuantity,
        MilkQuality quality,
        uint256 timestamp
    );
    event BatchCreated(
        uint256 indexed batchId,
        string truckNumber,
        uint256 totalMilkQuantity,
        MilkQuality quality,
        uint256 timestamp
    );
    event BatchInspected(
        uint256 indexed batchId,
        address indexed inspector,
        uint256 totalMilkQuantity,
        MilkQuality quality,
        uint256 timestamp,
        bool isBatchAccepted
    );
    event ProcessingStarted(
        uint256 indexed batchId,
        address indexed processor,
        uint256 processingStartTime
    );
    event ProcessingCompleted(
        uint256 indexed batchId,
        address indexed processor,
        uint256 processingEndTime
    );
    event ProductionStarted(
        uint256 indexed batchId,
        address indexed manager,
        uint256 productionStartTime
    );
    event ProductionCompleted(
        uint256 indexed batchId,
        address indexed manager,
        uint256 productionEndTime,
        uint256 totalBottlesProduced
    );
    event ProductionDispatched(
        uint256 indexed batchId,
        address indexed dispatcher,
        uint256 dispatcherTimestamp,
        uint256 bottlesReceived,
        uint256 bottlesDispatched
    );
    event MilkDistributed(
        uint256 indexed batchId,
        address indexed distributor,
        uint256 bottlesReceived,
        uint256 distributorReceivedTimestamp,
        uint256 distributorDispatchedTimestamp
    );
    event OrderReceived(
        uint256 indexed batchId,
        address indexed retailer,
        uint256 retailerReceivedTimestamp
    );
    event RewardIssued(
        address indexed agent,
        uint256 amount,
        uint256 indexed batchId,
        string action
    );

    // ========== Modifiers ==========

    /// @notice Ensures function caller is the authorized milk collector
    modifier onlyMilkCollector() {
        require(
            msg.sender == milkCollector,
            "Not authorized: Milk Collector only"
        );
        _;
    }
    modifier onlyMilkInspector() {
        require(
            msg.sender == milkInspector,
            "Not authorized: Milk Inspector only"
        );
        _;
    }
    modifier onlyMilkProcessor() {
        require(
            msg.sender == milkProcessor,
            "Not authorized: Milk Processor only"
        );
        _;
    }
    modifier onlyProductionManager() {
        require(
            msg.sender == productionManager,
            "Not authorized: Production Manager only"
        );
        _;
    }
    modifier onlyProductionDispatcher() {
        require(
            msg.sender == productionDispatcher,
            "Not authorized: Production Dispatcher only"
        );
        _;
    }
    modifier onlyDistributor() {
        require(msg.sender == distributor, "Not authorized: Distributor only");
        _;
    }
    modifier onlyRetailer() {
        require(msg.sender == retailer, "Not authorized: Retailer only");
        _;
    }

    // ========== Constructor ==========

    /// @notice Initializes the contract with authorized participants
    /// @param _milkCollector Address of authorized milk collector
    /// @param _milkInspector Address of authorized milk inspector
    /// @param _milkProcessor Address of authorized milk processor
    /// @param _productionManager Address of authorized production manager
    /// @param _productionDispatcher Address of authorized production dispatcher
    /// @param _distributor Address of authorized distributor
    /// @param _retailer Address of authorized retailer
    constructor(
        address _milkCollector,
        address _milkInspector,
        address _milkProcessor,
        address _productionManager,
        address _productionDispatcher,
        address _distributor,
        address _retailer
    ) {
        milkCollector = _milkCollector;
        milkInspector = _milkInspector;
        milkProcessor = _milkProcessor;
        productionManager = _productionManager;
        productionDispatcher = _productionDispatcher;
        distributor = _distributor;
        retailer = _retailer;
        nextBatchId = 1;
    }

    // ========== Public Functions ==========

    /// @notice Validates if milk quality parameters are within acceptable ranges
    /// @param quality MilkQuality struct containing the parameters to check
    /// @return bool True if all parameters are within acceptable ranges
    function isQualityAcceptable(MilkQuality memory quality)
        public
        pure
        returns (bool)
    {
        return (quality.temperature <= MAX_TEMPERATURE && // Must be ≤ 4°C
            quality.pH >= MIN_PH && // Must be ≥ 6.6
            quality.pH <= MAX_PH && // Must be ≤ 6.8
            quality.fatContent >= MIN_FAT_CONTENT && // Must be ≥ 3.5%
            quality.proteinContent >= MIN_PROTEIN_CONTENT && // Must be ≥ 3.2%
            quality.bacterialCount <= MAX_BACTERIAL_COUNT); // Must be ≤ 100,000 CFU/ml
    }

    /// @notice Retrieves complete information about a specific batch
    /// @param batchId The ID of the batch to query
    /// @return Batch Complete batch information
    function getBatchById(uint256 batchId) public view returns (Batch memory) {
        require(batchId < nextBatchId, "Batch ID does not exist");
        return batches[batchId];
    }

    /// @notice Gets the DAIRY token balance of an account
    /// @param account The address to query
    /// @return uint256 The number of DAIRY tokens owned by the account
    function getRewardBalance(address account) public view returns (uint256) {
        return balanceOf(account);
    }

    // ========== Milk Collector Functions ==========

    // Collect milk from a farmer.
    function collectMilk(
        uint256 farmerId,
        uint256 totalMilkQuantity,
        MilkQuality memory quality,
        bool isMilkAccepted
    ) public onlyMilkCollector {
        require(
            isQualityAcceptable(quality),
            "Milk quality parameters out of acceptable range"
        );

        FarmerMilkCollection
            memory farmerMilkCollection = FarmerMilkCollection({
                farmerId: farmerId,
                totalMilkQuantity: totalMilkQuantity,
                quality: quality,
                timestamp: block.timestamp,
                isMilkAccepted: isMilkAccepted
            });
        farmerMilkCollections[farmerId] = farmerMilkCollection;
        emit FarmerMilkCollected(
            farmerId,
            totalMilkQuantity,
            quality,
            block.timestamp
        );
    }

    // Called by Milk Collector to create a new batch from collected milk.
    function createBatch(BatchCreationParams memory params)
        public
        onlyMilkCollector
    {
        require(
            isQualityAcceptable(params.quality),
            "Milk quality parameters out of acceptable range"
        );
        uint256 batchId = nextBatchId;
        _initializeBatch(batchId, params);

        emit BatchCreated(
            batchId,
            params.truckNumber,
            params.totalMilkQuantity,
            params.quality,
            block.timestamp
        );

        _issueReward(msg.sender, batchId, "BatchCreated");
        nextBatchId++;
    }

    function _initializeBatch(
        uint256 batchId,
        BatchCreationParams memory params
    ) internal {
        BatchCreationParams memory batchCreationParams = BatchCreationParams({
            truckNumber: params.truckNumber,
            totalMilkQuantity: params.totalMilkQuantity,
            quality: params.quality,
            batchCreationTimestamp: params.batchCreationTimestamp
        });

        batches[batchId] = Batch({
            batchId: batchId,
            status: BatchStatus.BatchSentToProcessingPlant,
            batchCreationParams: batchCreationParams,
            inspection: InspectionData(
                0,
                0,
                MilkQuality(0, 0, 0, 0, 0),
                0,
                false
            ),
            processing: ProcessingData(0, 0, 0, MilkQuality(0, 0, 0, 0, 0)),
            production: ProductionData(0, 0, 0, MilkQuality(0, 0, 0, 0, 0)),
            dispatched: ProductionDispatchedData(0, 0, 0),
            distribution: DistributionData(0, 0, 0, 0, 0),
            retail: RetailerData(0, 0)
        });
    }

    // ========== Milk Inspector Functions ==========

    // Example of simplified inspection function using structs
    struct InspectionParams {
        uint256 truckNumber;
        uint256 receivedMilkQuantity;
        MilkQuality quality;
        uint256 inspectionTimestamp;
        bool isBatchAccepted;
    }

    function inspectBatch(uint256 batchId, InspectionParams memory params)
        public
        onlyMilkInspector
    {
        require(
            isQualityAcceptable(params.quality),
            "Milk quality parameters out of acceptable range"
        );
        Batch storage b = batches[batchId];
        require(b.batchId != 0, "Batch does not exist");

        b.inspection.receivedMilkQuantity = params.receivedMilkQuantity;
        b.inspection.quality = params.quality;
        b.inspection.inspectionTimestamp = block.timestamp;
        b.inspection.isBatchAccepted = params.isBatchAccepted;
        b.status = BatchStatus.BatchSentToMilkProcessor;

        emit BatchInspected(
            batchId,
            msg.sender,
            params.receivedMilkQuantity,
            params.quality,
            block.timestamp,
            params.isBatchAccepted
        );

        _issueReward(msg.sender, batchId, "BatchInspected");
    }

    // ========== Milk Processor Functions ==========

    function startProcessing(uint256 batchId) public onlyMilkProcessor {
        Batch storage b = batches[batchId];
        require(b.batchId != 0, "Batch does not exist");
        b.processing.processingStartTime = block.timestamp;
        b.status = BatchStatus.ProcessingStarted;

        emit ProcessingStarted(batchId, msg.sender, block.timestamp);
        _issueReward(msg.sender, batchId, "ProcessingStarted");
    }

    function completeProcessing(
        uint256 batchId,
        uint256 processedMilkQuantity,
        MilkQuality memory processedQuality
    ) public onlyMilkProcessor {
        Batch storage b = batches[batchId];
        require(b.batchId != 0, "Batch does not exist");
        require(
            b.status == BatchStatus.ProcessingStarted,
            "Processing not started"
        );
        b.processing.processingEndTime = block.timestamp;
        b.processing.processedMilkQuantity = processedMilkQuantity;
        b.processing.processedQuality = MilkQuality({
            temperature: processedQuality.temperature,
            pH: processedQuality.pH,
            fatContent: processedQuality.fatContent,
            proteinContent: processedQuality.proteinContent,
            bacterialCount: processedQuality.bacterialCount
        });
        b.status = BatchStatus.ProcessingCompleted;

        emit ProcessingCompleted(batchId, msg.sender, block.timestamp);
        _issueReward(msg.sender, batchId, "ProcessingCompleted");
    }

    // ========== Production Manager Functions ==========

    function startProduction(
        uint256 batchId,
        MilkQuality memory productionQuality
    ) public onlyProductionManager {
        Batch storage b = batches[batchId];
        require(b.batchId != 0, "Batch does not exist");
        b.production.productionStartTime = block.timestamp;
        b.production.productionQuality = MilkQuality({
            temperature: productionQuality.temperature,
            pH: productionQuality.pH,
            fatContent: productionQuality.fatContent,
            proteinContent: productionQuality.proteinContent,
            bacterialCount: productionQuality.bacterialCount
        });
        b.status = BatchStatus.ProductionStarted;

        emit ProductionStarted(batchId, msg.sender, block.timestamp);
        _issueReward(msg.sender, batchId, "ProductionStarted");
    }

    function completeProduction(uint256 batchId, uint256 totalBottlesProduced)
        public
        onlyProductionManager
    {
        Batch storage b = batches[batchId];
        require(b.batchId != 0, "Batch does not exist");
        require(
            b.status == BatchStatus.ProductionStarted,
            "Production not started"
        );
        b.production.productionEndTime = block.timestamp;
        b.production.totalBottlesProduced = totalBottlesProduced;
        b.status = BatchStatus.ProductionCompleted;

        emit ProductionCompleted(
            batchId,
            msg.sender,
            block.timestamp,
            totalBottlesProduced
        );
        _issueReward(msg.sender, batchId, "ProductionCompleted");
    }

    // ========== Production Dispatcher Functions ==========

    function dispatchProduction(
        uint256 batchId,
        uint256 bottlesReceived,
        uint256 bottlesDispatched
    ) public onlyProductionDispatcher {
        Batch storage b = batches[batchId];
        require(b.batchId != 0, "Batch does not exist");
        b.dispatched.bottlesReceived = bottlesReceived;
        b.dispatched.bottlesDispatched = bottlesDispatched;
        b.dispatched.dispatcherTimestamp = block.timestamp;
        b.status = BatchStatus.DispatchedToDistribution;

        emit ProductionDispatched(
            batchId,
            msg.sender,
            block.timestamp,
            bottlesReceived,
            bottlesDispatched
        );
        _issueReward(msg.sender, batchId, "ProductionDispatched");
    }

    // ========== Distributor Functions ==========

    function distributeMilk(
        uint256 batchId,
        uint256 bottlesReceived,
        uint256 orderDispatchedToRetailerTimestamp
    ) public onlyDistributor {
        Batch storage b = batches[batchId];
        require(b.batchId != 0, "Batch does not exist");
        b.distribution.bottlesReceived = bottlesReceived;
        b.distribution.distributorReceivedTimestamp = block.timestamp;
        b
            .distribution
            .distributorDispatchedTimestamp = orderDispatchedToRetailerTimestamp;
        b.status = BatchStatus.DispatchedToRetailer;

        emit MilkDistributed(
            batchId,
            msg.sender,
            bottlesReceived,
            block.timestamp,
            orderDispatchedToRetailerTimestamp
        );
        _issueReward(msg.sender, batchId, "MilkDistributed");
    }

    // ========== Retailer Functions ==========

    function retailerConfirm(uint256 batchId, uint256 totalBottlesReceived)
        public
        onlyRetailer
    {
        Batch storage b = batches[batchId];
        require(b.batchId != 0, "Batch does not exist");
        b.retail.retailerReceivedTimestamp = block.timestamp;
        b.retail.retailerTotalBottlesReceived = totalBottlesReceived;
        b.status = BatchStatus.OrderReceivedAtRetailerStore;

        emit OrderReceived(batchId, msg.sender, block.timestamp);
        _issueReward(msg.sender, batchId, "OrderReceived");
    }

    // ========== Internal Reward Mechanism ==========
    // In this MVP, rewards are issued by minting DairyToken tokens.
    function _issueReward(
        address agent,
        uint256 batchId,
        string memory action
    ) internal {
        _mint(agent, REWARD_AMOUNT * (10**decimals()));
        emit RewardIssued(agent, REWARD_AMOUNT, batchId, action);
    }
}
