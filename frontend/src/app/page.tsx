"use client";
import { useEffect, useState } from "react";
import { Web3 } from "web3";

const contractAddress = "0xc7eFa61c14c4AA2811Fb078639dCA63E7e88eD6c";
import abi from "@/lib/abi.json";
import { get } from "http";

class Model {
  id: string;
  name: string;
  description: string;
  price: string;
  creator: string;
  rating: string;

  constructor(
    id: string,
    name: string,
    description: string,
    price: string,
    creator: string,
    rating: string
  ) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.price = price;
    this.creator = creator;
    this.rating = rating;
  }
}

const chainIdToName = (chainId: BigInt | null) => {
  if (chainId === null) {
    return "No chain ID detected";
  }
  switch (chainId) {
    case BigInt(1):
      return "Ethereum Mainnet";
    case BigInt(11155111):
      return "Sepolia Testnet";
    case BigInt(17000):
      return "Holesky Testnet";
    default:
      return "Unknown";
  }
};

export default function Home() {
  const [web3, setWeb3] = useState<Web3 | null>(null);
  const [chainId, setChainId] = useState<BigInt | null>(null);
  const [chainName, setChainName] = useState<string | null>(null);
  const [contract, setContract] = useState<any | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [accountButtonDisabled, setAccountButtonDisabled] =
    useState<boolean>(false);
  const [accounts, setAccounts] = useState<string[] | null>(null);
  const [connectedAccount, setConnectedAccount] = useState<string | null>(null);

  const [models, setModels] = useState<any[] | null>(null);
  const [userModels, setUserModels] = useState<any[] | null>(null);
  const [modelDetails, setModelDetails] = useState<Model | null>(null);

  useEffect(() => {
    if (window.ethereum) {
      setWeb3(new Web3(window.ethereum));
      if (window.ethereum.isMetaMask) {
        setProvider("Connected to Ethereum with MetaMask.");
      } else {
        setProvider("Non-MetaMask Ethereum provider detected.");
      }
    } else {
      setWarning("Please install MetaMask");
      setAccountButtonDisabled(true);
    }
  }, []);

  useEffect(() => {
    if (web3 === null) {
      return;
    } else {
      setContract(new web3!.eth.Contract(abi, contractAddress));
    }
  }, [web3]);

  async function requestAccounts() {
    if (web3 === null) {
      return;
    }
    await window.ethereum.request({ method: "eth_requestAccounts" });
    document.getElementById("requestAccounts")?.remove();
    const allAccounts = await web3.eth.getAccounts();
    setAccounts(allAccounts);
    setConnectedAccount(`Account: ${allAccounts[0]}`);
    getChainId();
  }

  async function getChainId() {
    if (web3 === null) {
      return;
    }
    const chainId = await web3.eth.getChainId();
    setChainId(chainId);
    if (chainId != BigInt(17000)) {
      setWarning("Please connect to Holesky Testnet");
    }
    setChainName(chainIdToName(chainId));
  }

  async function updateContract() {
    if (contract === null) {
      setContract(new web3!.eth.Contract(abi, contractAddress));
    }
  }

  async function getUserOwnedModels() {
    if (web3 === null) {
      return;
    }
    updateContract();
    try {
      const models = await contract.methods
        .getUserOwnedModels()
        .call({ from: accounts![0] });
      if (models != null) {
        setUserModels(models);
      }
    } catch (error) {
      console.error("Error listing model:", error);
    }
  }
  async function listModel() {
    if (web3 === null) {
      return;
    }
    updateContract();
    try {
      const name = (document.getElementById("name") as HTMLInputElement).value;
      const description = (
        document.getElementById("description") as HTMLInputElement
      ).value;
      const price = (document.getElementById("price") as HTMLInputElement)
        .value;

      const tx = await contract.methods
        .listModel(name, description, price)
        .send({ from: accounts![0] });
      console.log("Model listed. Transaction Hash:", tx.transactionHash);
    } catch (error) {
      console.error("Error listing model:", error);
    }
  }

  async function getModelList() {
    updateContract();
    getUserOwnedModels();
    const blockchainModels = await contract.methods.getModels().call();
    console.log(models);
    if (userModels == null) return;

    for (let i = 0; i < blockchainModels.length; i++) {
      blockchainModels[i].isOwned = false;
      for (let j = 0; j < userModels.length; j++) {
        if (blockchainModels[i].id == userModels[j].id) {
          blockchainModels[i].isOwned = true;
          break;
        }
      }
    }
    setModels(blockchainModels);
  }

  async function getDetiledModel() {
    updateContract();
    let intModelId = 0;
    try {
      intModelId = parseInt(
        (document.getElementById("detailsModelId") as HTMLInputElement).value
      );
    } catch (e) {
      alert("Model ID must be a number");
      return;
    }
    const modelDetails = await contract.methods
      .getModelDetails(intModelId)
      .call();
    const modelInfo = new Model(
      modelDetails["0"] + "",
      modelDetails["1"] + "",
      modelDetails["2"] + "",
      modelDetails["3"] + "",
      modelDetails["4"] + "",
      modelDetails["5"] + ""
    );
    console.log("Model Details:", modelDetails);
    setModelDetails(modelInfo);
  }

  async function rateAiModel(modelId: number) {
    updateContract();
    const rating = prompt("Enter rating (1-10)");
    if (rating === null || rating === "") {
      return;
    }
    let intRating = 0;
    try {
      intRating = parseInt(rating);
    } catch (e) {
      alert("Rating must be a number");
      return;
    }

    if (intRating < 1 || intRating > 10) {
      alert("Rating must be between 1 and 10");
      return;
    }
    await contract.methods
      .rateModel(modelId, intRating)
      .send({ from: accounts![0] });
    alert(`Model ${models![modelId].name} rated with ${intRating}/10`);
  }

  async function purchaseModel(modelId: number) {
    updateContract();
    const currentBalance = await web3!.eth.getBalance(accounts![0]);
    const price = models![modelId].price;
    if (currentBalance < price) {
      alert("Insufficient funds");
      return;
    }
    try {
      await contract.methods
        .purchaseModel(modelId)
        .send({ from: accounts![0], value: price });
    } catch (e) {
      alert("Error purchasing model: " + e);
      return;
    }
    alert(`Model ${models![modelId].name} purchased`);
  }

  async function withdraw() {
    updateContract();
    await contract.methods.withdrawFunds().send({ from: accounts![0] });
    alert("Funds withdrawn");
  }

  return (
    <>
      <div id="warn" style={{ color: "red" }}>
        {warning}
      </div>
      <div id="provider">{provider}</div>
      <div id="connectedAccount">{connectedAccount}</div>
      <div id="connectedTo">Chain name: {chainName}</div>
      <div>
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded"
          onClick={() => requestAccounts()}
          id="requestAccounts"
          disabled={accountButtonDisabled}>
          Request MetaMask Accounts
        </button>
      </div>
      <br />
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded my-3"
        onClick={() => withdraw()}>
        Widraw Funds
      </button>
      <br />
      <div>
        <h1 className="text-3xl">Model List</h1>
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded my-3"
          onClick={() => getModelList()}>
          Refresh
        </button>
        <table className="table-auto border border-collapse border-slate-300 border-x-4 border-y-4">
          <thead>
            <tr>
              <th className="border border-white px-4 py-2 text-center w-12">
                Is owned?
              </th>
              <th className="border border-white px-4 py-2 text-center w-12">
                Id
              </th>
              <th className="border border-white px-4 py-2 text-center">
                Name
              </th>
              <th className="border border-white px-4 py-2 text-center">
                Description
              </th>
              <th className="border border-white px-4 py-2 text-center">
                Price
              </th>
              <th className="border border-white px-4 py-2 text-center">
                Creator
              </th>
              <th className="border border-white px-4 py-2 text-center w-16">
                Rating Count
              </th>
              <th className="border border-white px-4 py-2 text-center w-16">
                Total Rating
              </th>
              <th className="border border-white px-4 py-2 text-center">
                Purchase
              </th>
              <th className="border border-white px-4 py-2 text-center">
                Rate
              </th>
            </tr>
          </thead>
          <tbody>
            {models?.map((model, key) => (
              <tr key={key}>
                <td className="border border-white px-4 py-2 text-center">
                  {model.isOwned ? "Yes" : "No"}
                </td>
                <td className="border border-white px-4 py-2 text-center">
                  {key}
                </td>
                <td className="border border-white px-4 py-2 text-center">
                  {model.name}
                </td>
                <td className="border border-white px-4 py-2 text-center">
                  {model.description}
                </td>
                <td className="border border-white px-4 py-2 text-center">
                  {"" + model.price}
                </td>
                <td className="border border-white px-4 py-2 text-center">
                  {model.creator}
                </td>
                <td className="border border-white px-4 py-2 text-center">
                  {"" + model.ratingCount}
                </td>
                <td className="border border-white px-4 py-2 text-center">
                  {"" + model.totalRating}
                </td>
                <td className="border border-white px-4 py-2 text-center">
                  <button
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded"
                    onClick={() => purchaseModel(key)}>
                    Purchase
                  </button>
                </td>
                <td className="text-center">
                  <button
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded"
                    onClick={() => rateAiModel(key)}>
                    Rate
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <br />
      <div>
        <h1 className="text-3xl font-bold">List a new model</h1>
        <div>
          <h2>Name</h2>
          <input
            className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="name"
          />
        </div>
        <div>
          <h2>Description</h2>
          <input
            className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            type="text"
            id="description"
          />
        </div>
        <div>
          <h2>Price</h2>
          <input
            className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            type="text"
            id="price"
          />
        </div>
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded"
          onClick={() => listModel()}>
          List Model
        </button>
      </div>
      <br />

      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Get model details</h1>
        <div>
          <h2>Model ID</h2>
          <input
            className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            type="text"
            id="detailsModelId"
          />
        </div>
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded"
          onClick={() => getDetiledModel()}>
          Get
        </button>
        <div>
          <p>Name: {modelDetails?.name}</p>
          <p>Description: {modelDetails?.description}</p>
          <p>Price: {modelDetails?.price}</p>
          <p>Creator: {modelDetails?.creator}</p>
          <p>Rating: {modelDetails?.rating}</p>
        </div>
      </div>
      <br />
    </>
  );
}
