import { ethers, BigNumberish } from "ethers";
import { buildSafeTransaction, executeTx, signHash, logGas, safeSignMessage } from "./execution"; // Import utility functions
import * as safeAbi from "../../build/artifacts/contracts/Safe.sol/Safe.json"
import { AddressZero } from "./constants";
import { Safe } from "../../typechain-types";

async function main() {
    // Step 1: Setup the Safe contract and signers

    const provider = new ethers.JsonRpcProvider("https://dev-rpc.oortech.com");

    const privateKeys = [
        "0xprivatekey",
        "0xprivatekey",
        "0xprivatekey"
        ];

    const account = new ethers.Wallet("0xprivakey", provider);
    const prover = new ethers.Wallet("0xprivkey", provider);
    let runner = new ethers.Wallet(privateKeys[2], provider)

    const safeAddress = "0x842cB9e2C00Ab913d70CFEe61F753299B4FCC3fe"
    

    const safeContract = new ethers.BaseContract(safeAddress, safeAbi.abi, account) as Safe;

    // Step 3: Build the Safe transaction
    const connected = await safeContract.connect(account);  // Get the current nonce from the Safe contract
    ///const safeAddress = (await connected.getAddress());
    const nonce = await safeContract.nonce();
    const owners = await safeContract.getOwners();
    console.log(owners);
    
    
    const tx = buildSafeTransaction({
        to: account.address,  // In this test, sending a transaction to the Safe itself
        value: ethers.parseUnits("0.5", "ether"), // Sending 0.1 ETH
        data: "0x",                      // No data payload
        operation: 0,                     // 0 for CALL, 1 for DELEGATECALL
        safeTxGas: 50000,                 // Gas limit for the Safe transaction
        baseGas: 21000,                   // Base gas
        //gasPrice: ethers.parseUnits("1", "gwei"),  // Gas price
        gasToken: AddressZero, // Use ETH for gas
        refundReceiver: AddressZero, // No refund receiver
        nonce: nonce                      // Safe nonce
    });

    // Step 4: Sign the transaction hash using safeSignHash
    const txHash = await connected.getTransactionHash(
        tx.to,
        tx.value,
        tx.data,
        tx.operation,
        tx.safeTxGas,
        tx.baseGas,
        tx.gasPrice,
        tx.gasToken,
        tx.refundReceiver,
        tx.nonce
    );

    console.log(tx);
    console.log(txHash);
    
    const signature = await safeSignMessage(account, safeAddress, tx)
    const sig = await safeSignMessage(prover, safeAddress, tx)

    console.log(signature, `Signature`);

    const complete = await executeTx(connected, tx, [signature, sig])
    console.log(complete.hash);

    console.log("Transaction executed successfully and emitted ExecutionSuccess.");
}

// Run the script
main().catch((error) => {
    console.error("Error executing transaction:", error);
    process.exit(1);
});
