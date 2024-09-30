"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Web3 } from "web3";

const contractAddress = "0x6A032186a44303e421E2f4B8adc1cB3f9cCae6c9";
const abi = require("@/lib/abi.json");

export default function Home() {
  const [web3, setWeb3] = useState<Web3 | null>(null);
  const [contract, setContract] = useState<any | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [latestBlock, setLatestBlock] = useState<string | null>(null);
  const [accountButtonDisabled, setAccountButtonDisabled] =
    useState<boolean>(false);
  const [accounts, setAccounts] = useState<string[] | null>(null);
  const [connectedAccount, setConnectedAccount] = useState<string | null>(null);

  const [models, setModels] = useState<any[] | null>(null);
  const [modelDetails, setModelDetails] = useState<any | null>(null);

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
    async function getChainId() {
      if (web3 === null) {
        return;
      }
      setChainId(`Chain ID: ${await web3.eth.getChainId()}`);
    }

    async function getLatestBlock() {
      if (web3 === null) {
        return;
      }
      setLatestBlock(`Latest Block: ${await web3.eth.getBlockNumber()}`);
      const blockSubscription = await web3.eth.subscribe("newBlockHeaders");
      blockSubscription.on("data", (block) => {
        setLatestBlock(`Latest Block: ${block.number}`);
      });
    }

    getChainId();
    getLatestBlock();
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

  async function getModelDetails() {
    updateContract();
    const modelId = document.getElementById(
      "detailsModelId"
    ) as HTMLInputElement;
    const modelDetails = await contract.methods.getModelDetails(modelId).call();
    console.log("Model Details:", modelDetails);
    setModelDetails(modelDetails);
  }

  async function rateModel() {
    updateContract();
    const modelId = (document.getElementById("modelId") as HTMLInputElement)
      .value;
    const rating = (document.getElementById("rating") as HTMLInputElement)
      .value;
    await contract.methods.rateModel(modelId, rating).call();
  }

  async function purchaseModel() {
    updateContract();
    const modelId = (
      document.getElementById("purchaseModelId") as HTMLInputElement
    ).value;
    await contract.methods.purchaseModel(modelId).call();
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
          onClick={() => requestAccounts()}
          id="requestAccounts"
          disabled={accountButtonDisabled}>
          Request MetaMask Accounts
        </button>
      </div>
      <div className="border-slate-300 border-x-4 border-y-4">
        <h1>Model List</h1>
        <button onClick={() => getModelList()}>Refresh</button>
        <table className="table-auto">
          <thead>
            <tr>
              <th className="text-center" >Id</th>
              <th className="text-center" >Name</th>
              <th className="text-center" >Description</th>
              <th className="text-center" >Price</th>
              <th className="text-center" >Creator</th>
              <th className="text-center" >Rating Count</th>
              <th className="text-center" >Total Rating</th>
            </tr>
          </thead>
          <tbody>
            {models?.map((model, key) => (
              <tr key={key}>
                <td className="text-center" >{key}</td>
                <td className="text-center" >{model.name}</td>
                <td className="text-center" >{model.description}</td>
                <td className="text-center" >{model.price}</td>
                <td className="text-center" >{model.creator}</td>
                <td className="text-center" >{model.ratingCount}</td>
                <td className="text-center" >{model.totalRating}</td>
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
        <button onClick={() => listModel()}>List Model</button>
      </div>
      <br />

      <div>
        <h1 className="text-3xl font-bold">Purchase</h1>
        <div>
          <h2>Model ID</h2>
          <input
            className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            type="text"
            id="purchaseModelId"
          />
        </div>
        <button onClick={() => purchaseModel()}>Purchase</button>
      </div>
      <br />

      <div>
        <h1 className="text-3xl font-bold">Get model</h1>
        <div>
          <h2>Model ID</h2>
          <input
            className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            type="text"
            id="detailsModelId"
          />
        </div>
        <button onClick={() => getModelDetails()}>Get Model</button>
        <div>
          <p>Name: {modelDetails?.name}</p>
          <p>Description: {modelDetails?.description}</p>
          <p>Price: {modelDetails?.price}</p>
          <p>Creator: {modelDetails?.creator}</p>
          <p>Total Rating: {modelDetails?.totalRating}</p>
          <p>Rating Count: {modelDetails?.ratingCount}</p>
        </div>
      </div>
      <br />

      <div>
        <h1 className="text-3xl font-bold">Rate Model</h1>
        <div>
          <h2>Model ID</h2>
          <input
            className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            type="text"
            id="modelId"
          />
        </div>
        <div>
          <h2>Rating (1-10)</h2>
          <input
            className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            type="text"
            id="rating"
          />
        </div>
        <button onClick={() => rateModel()}>Rate Model</button>
      </div>
    </>
  );
}
