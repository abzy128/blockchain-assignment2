"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Web3 } from "web3";

const contractAddress = "0x6A032186a44303e421E2f4B8adc1cB3f9cCae6c9";
const abi = require("@/lib/abi.json");

class Model {
  name: string;
  description: string;
  price: string;
  creator: string;
  rating: string;

  constructor(
    name: string,
    description: string,
    price: string,
    creator: string,
    rating: string
  ) {
    this.name = name;
    this.description = description;
    this.price = price;
    this.creator = creator;
    this.rating = rating;
  }
}

export default function Home() {
  const [web3, setWeb3] = useState<Web3 | null>(null);
  const [contract, setContract] = useState<any | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [accountButtonDisabled, setAccountButtonDisabled] =
    useState<boolean>(false);
  const [accounts, setAccounts] = useState<string[] | null>(null);
  const [connectedAccount, setConnectedAccount] = useState<string | null>(null);

  const [models, setModels] = useState<any[] | null>(null);
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
  }
  async function updateContract() {
    if (contract === null) {
      setContract(new web3!.eth.Contract(abi, contractAddress));
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
    const models = await contract.methods.getModels().call();
    console.log(models);
    setModels(models);
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
      modelDetails["4"] + ""
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
    await contract.methods.rateModel(modelId, intRating).call();
    alert(`Model ${models![modelId].name} rated with ${intRating}/10`);
  }

  async function purchaseModel(modelId: number) {
    updateContract();
    const balance = await web3!.eth.getBalance(accounts![0]);
    console.log(`Purchasing model ${modelId} with balance ${balance}`);
    await contract.methods.purchaseModel(modelId, balance).call();
    alert("Model purchased");
  }

  return (
    <>
      <div id="warn" style={{ color: "red" }}>
        {warning}
      </div>
      <div id="provider">{provider}</div>

      <div id="connectedAccount">{connectedAccount}</div>
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
