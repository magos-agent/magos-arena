import { createPublicClient, http, formatEther, formatUnits } from 'viem';
import { base } from 'viem/chains';

const WALLET_ADDRESS = '0x15693347309100bb08354E92D9E1BB8Ea083ac2b';
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // USDC on Base

const client = createPublicClient({
  chain: base,
  transport: http('https://mainnet.base.org'),
});

// Check ETH balance
const ethBalance = await client.getBalance({ address: WALLET_ADDRESS });
console.log('ETH Balance:', formatEther(ethBalance), 'ETH');

// Check USDC balance
const usdcBalance = await client.readContract({
  address: USDC_ADDRESS,
  abi: [{ name: 'balanceOf', type: 'function', inputs: [{ name: 'account', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] }],
  functionName: 'balanceOf',
  args: [WALLET_ADDRESS],
});
console.log('USDC Balance:', formatUnits(usdcBalance, 6), 'USDC');
