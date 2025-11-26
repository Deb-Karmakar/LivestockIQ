const hre = require("hardhat");

async function main() {
    console.log("🚀 Deploying AuditAnchor contract to Polygon Amoy...\n");

    // Check if private key is configured
    if (!process.env.BLOCKCHAIN_PRIVATE_KEY) {
        console.log("❌ Error: BLOCKCHAIN_PRIVATE_KEY not found in .env file!");
        console.log("\n📝 Add this to your .env file:");
        console.log("BLOCKCHAIN_PRIVATE_KEY=your_private_key_here");
        console.log("\n💡 Get your private key from MetaMask:");
        console.log("   1. Open MetaMask");
        console.log("   2. Click the 3 dots → Account Details");
        console.log("   3. Export Private Key");
        console.log("   4. Enter password");
        console.log("   5. Copy the key (without 0x prefix)");
        process.exit(1);
    }

    // Get the deployer account
    let deployer;
    try {
        [deployer] = await hre.ethers.getSigners();

        if (!deployer) {
            throw new Error("No signer available");
        }

        console.log("📍 Deploying with account:", deployer.address);
    } catch (error) {
        console.log("❌ Error getting signer:", error.message);
        console.log("\n💡 Make sure BLOCKCHAIN_PRIVATE_KEY is set correctly in .env");
        console.log("   (without the 0x prefix)");
        process.exit(1);
    }

    // Check balance
    try {
        const balance = await hre.ethers.provider.getBalance(deployer.address);
        console.log("💰 Account balance:", hre.ethers.formatEther(balance), "POL (MATIC)\n");

        if (balance === 0n) {
            console.log("❌ Error: Account has no POL!");
            console.log("Get test POL from: https://faucet.polygon.technology/");
            console.log("   1. Select 'Polygon Amoy'");
            console.log("   2. Enter your address:", deployer.address);
            console.log("   3. Click Submit");
            console.log("   4. Wait 1-2 minutes");
            process.exit(1);
        }
    } catch (error) {
        console.log("⚠️  Warning: Could not check balance:", error.message);
        console.log("Continuing with deployment...\n");
    }

    console.log("⏳ Deploying contract...");

    const AuditAnchor = await hre.ethers.getContractFactory("AuditAnchor");
    const auditAnchor = await AuditAnchor.deploy();

    console.log("⏳ Waiting for deployment confirmation...");
    await auditAnchor.waitForDeployment();

    const address = await auditAnchor.getAddress();

    console.log("\n✅ AuditAnchor deployed successfully!");
    console.log("📍 Contract address:", address);
    console.log("\n📝 Add this to your .env file:");
    console.log(`AUDIT_ANCHOR_ADDRESS=${address}`);
    console.log("\n🔍 View on PolygonScan:");
    console.log(`https://amoy.polygonscan.com/address/${address}`);
    console.log("\n🎉 Deployment complete! Now restart your backend server.");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ Deployment failed:");
        console.error(error);
        process.exit(1);
    });
