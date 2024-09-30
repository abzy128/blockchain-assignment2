// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract AiModelContract {
    struct Model {
        string name;
        string description;
        uint256 price;
        address creator;
        uint256 totalRating;
        uint256 ratingCount;
        uint256 balance;
    }

    Model[] public models;

    function getModels() public view returns (Model[] memory) {
        return models;
    }

    function listModel(string memory name, string memory description, uint256 price) public {
        models.push(Model(name, description, price, msg.sender, 0, 0, 0));
    }
    
    function purchaseModel(uint256 modelId, uint userBalance) public {
        Model storage model = models[modelId];
        require(userBalance >= model.price, "Insufficient funds");
        model.balance += model.price;
    }
    
    function rateModel(uint256 modelId, uint8 rating) public {
        Model storage model = models[modelId];
        require(rating >= 0 && rating <= 10, "Rating must be between 0 and 10");
        model.totalRating += rating;
        model.ratingCount++;
    }

    function withdrawFunds() public view returns (uint256) {
        uint256 totalBalance = 0;
        for (uint i = 0; i < models.length; i++) {
            Model storage model = models[i];
            if (model.creator == msg.sender) {
                totalBalance += model.balance;
            }
        }
        return totalBalance;
    }
    
    function getModelDetails(uint256 modelId) public view returns (string memory, string memory, uint256, address, uint256) {
        Model storage model = models[modelId];
        return (model.name, model.description, model.price, model.creator, model.totalRating / (model.ratingCount == 0 ? 1 : model.ratingCount));
    }
}