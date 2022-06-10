const serverUrl = "https://lk9bpdyn1vsq.usemoralis.com:2053/server"; //Server url from moralis.io
const appId = "1lcc8oJfE3QD5Bq0GzDEliMLgfR4Eb2XrlIxgXt5"; // Application id from moralis.io

let deemuAddress = '0xbb0Aca21AE4860Ab9e52C36D5a571A431280E6cA' //DMU oficial  
let wbnbAddress = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c' //WBNB
let currentUser;
let walletAddress;

async function init() {
  await Moralis.start({ serverUrl, appId });
  await Moralis.enableWeb3();
  document.getElementById("swap_button").disabled = true;
}

async function login() {
  try {

    currentUser = await Moralis.authenticate();
    walletAddress = currentUser.get("ethAddress")
    document.getElementById("swap_button").disabled = false;
  } catch (error) {
    console.log(error);
  }
}

async function getTxDetails() 
{
//Get token price on PancakeSwap v2 BSC
const options = {
  address: wbnbAddress, //using wbnb to get price estability
  chain: "bsc",
  exchange: "PancakeSwapv2",
};
const price = await Moralis.Web3API.token.getTokenPrice(options);

let tokenAmount = document.getElementById("to_amount").value;
let wnbnAmount = document.getElementById("from_amount").value;
let transactionValue = wnbnAmount * price.usdPrice; //DMU amount * Price.


document.getElementById("liquidity_fee").innerHTML = (tokenAmount * 0.02).toFixed(0);
document.getElementById("develop_fee").innerHTML = (tokenAmount * 0.03).toFixed(0);
document.getElementById("reflex_fee").innerHTML = (tokenAmount * 0.05).toFixed(0);
document.getElementById("buy_amount").innerHTML = (tokenAmount * 1).toFixed(0);
document.getElementById("total_fee").innerHTML = (tokenAmount * 0.10).toFixed(0);
document.getElementById("total_amount").innerHTML = (tokenAmount -= tokenAmount * 0.10).toFixed(0);
document.getElementById("usd_estimate").innerHTML = transactionValue.toFixed(6);
}


async function getQuote() {
  if (!document.getElementById("from_amount").value) return;

  let amount = Number(document.getElementById("from_amount").value * 10 ** 18);

  const quote = await Moralis.Plugins.oneInch.quote({
    chain: "bsc", // The blockchain you want to use (eth/bsc/polygon)
    fromTokenAddress: wbnbAddress, // The token you want to swap
    toTokenAddress: deemuAddress, // The token you want to receive
    amount: amount,
  });

  console.log(quote);
  document.getElementById("gas_estimate").innerHTML = quote.estimatedGas;
  document.getElementById("to_amount").value = quote.toTokenAmount / 10 ** quote.toToken.decimals;
  getTxDetails();
}  



async function getQuoteTo() {
  if (!document.getElementById("to_amount").value) return;

  let auxValue = 0.000001 * 10 ** 18; //Fixed value to do calculation
  let amountDMU = Number(document.getElementById("to_amount").value); //Get inserted token amount

  const quote = await Moralis.Plugins.oneInch.quote({
    chain: "bsc", // The blockchain you want to use (eth/bsc/polygon)
    fromTokenAddress: wbnbAddress, // The token you want to swap
    toTokenAddress: deemuAddress, // The token you want to receive
    amount: auxValue,
  });

  console.log(quote);
  document.getElementById("gas_estimate").innerHTML = quote.estimatedGas;
  let estimateDMU = quote.toTokenAmount / 10 ** quote.toToken.decimals;
  document.getElementById("from_amount").value = (amountDMU * 0.000001 / estimateDMU).toFixed(8); 
  getTxDetails();
} 




async function trySwap() {
  let address = walletAddress;
  let amount = Number(document.getElementById("from_amount").value * 10 ** 18);

  const allowance = await Moralis.Plugins.oneInch.hasAllowance({
    chain: "bsc", // The blockchain you want to use (eth/bsc/polygon)
    fromTokenAddress: wbnbAddress, // The token you want to swap
    fromAddress: address, // Your wallet address
    amount: amount,
  });
  console.log(allowance);
  if (!allowance) {
    await Moralis.Plugins.oneInch.approve({
      chain: "bsc", // The blockchain you want to use (eth/bsc/polygon)
      tokenAddress: wbnbAddress, // The token you want to swap
      fromAddress: address, // Your wallet address
    });
  }

  try {
    let receipt = await doSwap(address, amount);
    alert("Swap Complete");
  } catch (error) {
    console.log(error);
  }
}

function doSwap(userAddress, amount) {
  return Moralis.Plugins.oneInch.swap({
    chain: "bsc", // The blockchain you want to use (eth/bsc/polygon)
    fromTokenAddress: wbnbAddress, // The token you want to swap
    toTokenAddress: deemuAddress, // The token you want to receive
    amount: amount,
    fromAddress: userAddress, // Your wallet address
    slippage: 12,
  });
}

init();
document.getElementById("login_button").onclick = login;
document.getElementById("from_amount").onblur = getQuote;
document.getElementById("to_amount").onblur = getQuoteTo;
document.getElementById("swap_button").onclick = trySwap;
getTxDetails(); 