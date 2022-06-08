const serverUrl = "https://lk9bpdyn1vsq.usemoralis.com:2053/server"; //Server url from moralis.io
const appId = "1lcc8oJfE3QD5Bq0GzDEliMLgfR4Eb2XrlIxgXt5"; // Application id from moralis.io

let deemuAddress = '0xbA2aE424d960c26247Dd6c32edC70B295c744C43' //DMU oficial  
let wnbAddress = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c' //WBNB

async function init() {
  await Moralis.start({ serverUrl, appId });
  await Moralis.enableWeb3();
  currentUser = Moralis.User.current();
  if (currentUser) {
    document.getElementById("swap_button").disabled = false;
  }
}

async function login() {
  try {
    currentUser = Moralis.User.current();
    if (!currentUser) {
      currentUser = await Moralis.authenticate();
    }
    document.getElementById("swap_button").disabled = false;
  } catch (error) {
    console.log(error);
  }
}

async function getQuote() {
  if (!document.getElementById("from_amount").value) return;

  let amount = Number(document.getElementById("from_amount").value * 10 ** 18);

  const quote = await Moralis.Plugins.oneInch.quote({
    chain: "bsc", // The blockchain you want to use (eth/bsc/polygon)
    fromTokenAddress: wnbAddress, // The token you want to swap
    toTokenAddress: deemuAddress, // The token you want to receive
    amount: amount,
  });
  console.log(quote);
  document.getElementById("gas_estimate").innerHTML = quote.estimatedGas;
  document.getElementById("to_amount").value = quote.toTokenAmount / 10 ** quote.toToken.decimals;
}

async function trySwap() {
  let address = Moralis.User.current().get("ethAddress");
  let amount = Number(document.getElementById("from_amount").value * 10 ** 18);
  const allowance = await Moralis.Plugins.oneInch.hasAllowance({
    chain: "bsc", // The blockchain you want to use (eth/bsc/polygon)
    fromTokenAddress: wnbAddress, // The token you want to swap
    fromAddress: address, // Your wallet address
    amount: amount,
  });
  console.log(allowance);
  if (!allowance) {
    await Moralis.Plugins.oneInch.approve({
      chain: "bsc", // The blockchain you want to use (eth/bsc/polygon)
      tokenAddress: wnbAddress, // The token you want to swap
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
    fromTokenAddress: wnbAddress, // The token you want to swap
    toTokenAddress: deemuAddress, // The token you want to receive
    amount: amount,
    fromAddress: userAddress, // Your wallet address
    slippage: 1,
  });
}

init();
document.getElementById("login_button").onclick = login;
document.getElementById("from_amount").onblur = getQuote;
document.getElementById("swap_button").onclick = trySwap;