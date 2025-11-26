// Quick test to check if BLOCKCHAIN_PRIVATE_KEY is loading
import dotenv from 'dotenv';
dotenv.config();

console.log('\n🔍 Environment Variable Check:\n');
console.log('BLOCKCHAIN_PRIVATE_KEY exists:', !!process.env.BLOCKCHAIN_PRIVATE_KEY);
console.log('BLOCKCHAIN_PRIVATE_KEY length:', process.env.BLOCKCHAIN_PRIVATE_KEY ? process.env.BLOCKCHAIN_PRIVATE_KEY.length : 0);

if (process.env.BLOCKCHAIN_PRIVATE_KEY) {
    console.log('First 10 chars:', process.env.BLOCKCHAIN_PRIVATE_KEY.substring(0, 10) + '...');
    console.log('\n✅ Private key is loaded correctly!');
    console.log('\nNow try deploying again with:');
    console.log('npx hardhat run scripts/deploy.cjs --network amoy --config hardhat.config.cjs');
} else {
    console.log('\n❌ Private key is NOT loaded!');
    console.log('\nCheck your .env file has this line:');
    console.log('BLOCKCHAIN_PRIVATE_KEY=dc125366a8c31d23320bde96b110ad1dfaa237cfe439f26aad1873aa9e3ece94');
}
