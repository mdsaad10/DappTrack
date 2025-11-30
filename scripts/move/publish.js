require("dotenv").config();
const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("child_process");
const aptosSDK = require("@aptos-labs/ts-sdk");

async function publish() {
  if (!process.env.VITE_MODULE_PUBLISHER_ACCOUNT_ADDRESS) {
    throw new Error(
      "VITE_MODULE_PUBLISHER_ACCOUNT_ADDRESS variable is not set"
    );
  }

  if (!process.env.VITE_MODULE_PUBLISHER_ACCOUNT_PRIVATE_KEY) {
    throw new Error(
      "VITE_MODULE_PUBLISHER_ACCOUNT_PRIVATE_KEY variable is not set"
    );
  }

  console.log("📦 Compiling Move package...");
  
  // First compile the package
  try {
    execSync(
      `npx aptos move compile --package-dir contract --named-addresses dapptrack_addr=${process.env.VITE_MODULE_PUBLISHER_ACCOUNT_ADDRESS} --save-metadata`,
      { stdio: "inherit" }
    );
  } catch (error) {
    console.error("❌ Compilation failed");
    throw error;
  }

  console.log("\n🚀 Publishing to testnet...");

  // Initialize Aptos client without API key (to avoid rate limits on key validation)
  const config = new aptosSDK.AptosConfig({
    network: aptosSDK.Network.TESTNET,
    fullnode: "https://api.testnet.aptoslabs.com/v1"
  });
  const aptos = new aptosSDK.Aptos(config);

  // Create account from private key
  const privateKey = new aptosSDK.Ed25519PrivateKey(
    process.env.VITE_MODULE_PUBLISHER_ACCOUNT_PRIVATE_KEY.replace("0x", "")
  );
  const account = aptosSDK.Account.fromPrivateKey({ privateKey });

  console.log("Publisher address:", account.accountAddress.toString());

  // Read the compiled modules (both V1 and V2)
  const packageMetadata = fs.readFileSync(
    path.join(process.cwd(), "contract/build/DappTrack/package-metadata.bcs")
  );
  const module1 = fs.readFileSync(
    path.join(process.cwd(), "contract/build/DappTrack/bytecode_modules/dapptrack.mv")
  );
  const module2 = fs.readFileSync(
    path.join(process.cwd(), "contract/build/DappTrack/bytecode_modules/dapptrack_v2.mv")
  );

  try {
    // Build publish transaction with both modules
    const transaction = await aptos.publishPackageTransaction({
      account: account.accountAddress,
      metadataBytes: packageMetadata,
      moduleBytecode: [module1, module2],
    });

    // Sign and submit
    const committedTxn = await aptos.signAndSubmitTransaction({
      signer: account,
      transaction,
    });

    console.log("✅ Transaction submitted:", committedTxn.hash);
    console.log("⏳ Waiting for confirmation...");

    // Wait for transaction
    const executedTransaction = await aptos.waitForTransaction({
      transactionHash: committedTxn.hash,
    });

    console.log("\n✅ Contract published successfully!");
    console.log("Module address:", account.accountAddress.toString());
    console.log("Transaction hash:", committedTxn.hash);
    console.log(
      `View on explorer: https://explorer.aptoslabs.com/txn/${committedTxn.hash}?network=testnet`
    );
  } catch (error) {
    console.error("❌ Publishing failed:", error.message);
    throw error;
  }
}

publish();
