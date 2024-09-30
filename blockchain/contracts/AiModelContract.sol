// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract AiModelContract {
    uint256 private id = 0;
    struct Model {
        uint256 id;
        string name;
        string description;
        uint256 price;
        address creator;
        uint256 totalRating;
        uint256 ratingCount;
        uint256 balance;
    }

    Model[] public models;
    mapping(uint256 => Model) public modelById;
    mapping(address => uint256) public userBalances;

    mapping(address => Model[]) public userModels;

    function getModels() public view returns (Model[] memory) {
        return models;
    }

    function getUserOwnedModels() public view returns (Model[] memory) {
        return userModels[msg.sender];
    }

    function listModel(
        string memory name,
        string memory description,
        uint256 price
    ) public {
        models.push(
            Model({
                id: id,
                name: name,
                description: description,
                price: price,
                creator: msg.sender,
                totalRating: 0,
                ratingCount: 0,
                balance: 0
            })
        );
        id++;
    }

    function purchaseModel(uint256 modelId) public payable {
        Model storage model = models[modelId];
        require(msg.value >= model.price, "Insufficient funds");
        model.balance += msg.value;
        userBalances[model.creator] += msg.value;
        userModels[msg.sender].push(model);
    }

    function rateModel(uint256 modelId, uint8 rating) public {
        Model storage model = models[modelId];
        require(rating >= 0 && rating <= 10, "Rating must be between 0 and 10");
        model.totalRating += rating;
        model.ratingCount++;
    }

    function withdrawFunds() public {
        uint256 balance = userBalances[msg.sender];
        require(balance > 0, "No funds to withdraw");
        userBalances[msg.sender] = 0;
        payable(msg.sender).transfer(balance);
    }

    function getModelDetails(
        uint256 modelId
    )
        public
        view
        returns (uint256, string memory, string memory, uint256, address, uint256)
    {
        Model storage model = models[modelId];
        return (
            model.id,
            model.name,
            model.description,
            model.price,
            model.creator,
            model.totalRating / (model.ratingCount == 0 ? 1 : model.ratingCount)
        );
    }

    function getUserBalance() public view returns (uint256) {
        return userBalances[msg.sender];
    }
}
