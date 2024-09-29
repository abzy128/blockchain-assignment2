// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ModelContract {
    struct Model {
        string name;
        string description;
        uint256 price;
        address creator;
        uint256 totalRating;
        uint256 ratingCount;
    }

    Model[] public models;
    mapping(address => uint256[]) public creatorModels;
    mapping(uint256 => address) public modelOwner;
    mapping(uint256 => uint256[]) public modelRatings;

    address public owner;

    constructor() {
        owner = msg.sender;
    }

    function listModel(
        string memory name,
        string memory description,
        uint256 price
    ) public {
        Model memory newModel = Model({
            name: name,
            description: description,
            price: price,
            creator: msg.sender,
            totalRating: 0,
            ratingCount: 0
        });

        models.push(newModel);
        uint256 newModelId = models.length - 1;
        creatorModels[msg.sender].push(newModelId);
        modelOwner[newModelId] = msg.sender;
    }

    function purchaseModel(uint256 modelId) public payable {
        require(modelId < models.length, "Model ID does not exist");
        Model storage model = models[modelId];
        require(msg.value >= model.price, "Insufficient funds to purchase");
        address payable creator = payable(model.creator);
        creator.transfer(msg.value);
        modelOwner[modelId] = msg.sender;
    }

    function rateModel(uint256 modelId, uint8 rating) public {
        require(modelId < models.length, "Model ID does not exist");
        Model storage model = models[modelId];
        require(modelOwner[modelId] == msg.sender, "Model not owned by user");
        require(rating >= 1 && rating <= 10, "Rating must be between 1 and 10");
        model.totalRating += rating;
        model.ratingCount += 1;
        modelRatings[modelId].push(rating);
    }

    function withdrawFunds() public {
        require(msg.sender == owner, "Only owner can withdraw funds");
        payable(owner).transfer(address(this).balance);
    }

    function getModelDetails(uint256 modelId)
        public
        view
        returns (
            string memory,
            string memory,
            uint256,
            address,
            uint256
        )
    {
        require(modelId < models.length, "Model ID does not exist");
        Model storage model = models[modelId];
        return (model.name, model.description, model.price, model.creator, model.totalRating / model.ratingCount);
    }
}