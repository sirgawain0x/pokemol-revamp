import {
  ConnectButton,
  useActiveAccount,
  useActiveWalletChain,
  useSwitchActiveWalletChain,
  MediaRenderer,
  useReadContract,
} from "thirdweb/react";
import {
  createThirdwebClient,
  getContract,
  NATIVE_TOKEN_ADDRESS,
} from "thirdweb";
import { Account, inAppWallet, createWallet } from "thirdweb/wallets";
import { sepolia } from "thirdweb/chains";
import { resolveContractAbi } from "thirdweb/contract";
import { getNFT } from "thirdweb/extensions/erc721";
import { useState } from "react";
import { useWriteContract } from "wagmi";
import { Skeleton } from "./components/ui/skeleton";

/**
 * In this example, we will be connecting wallet to the app using thirdweb
 * and then mint the NFTs using wagmi
 *
 * The purpose of this demo is to showcase how you can use thirdweb sdk with wagmi
 */
function App() {
  const activeAccount = useActiveAccount();
  return (
    <div className="flex flex-col p-4 pt-12 justify-center gap-3">
      <div className="text-center mx-auto max-w-[600px]">
        In this example, we will be connecting wallet to the app using thirdweb
        and then mint the NFTs using wagmi{"'"}useContractWrite hook.
      </div>
      <div className="mx-auto">
        <ConnectButton
          client={thirdwebClient}
          accountAbstraction={{
            factoryAddress: "0xE90DebFD907F5B655f22bfC16083E45994d708bE",
            chain: sepolia,
            sponsorGas: false,
          }}
          autoConnect={true}
          wallets={[
            inAppWallet({
              auth: {
                options: [
                  "farcaster",
                  "discord",
                  "passkey",
                  "apple",
                  "google",
                  "email",
                  "phone",
                ],
              },
            }),
            createWallet("io.metamask"),
            createWallet("com.coinbase.wallet"),
            createWallet("global.safe"),
            createWallet("walletConnect"),
          ]}
        />
      </div>

      {activeAccount ? (
        <MintNftWithWagmi thirdwebAccount={activeAccount} />
      ) : (
        <div className="mx-auto">Connect wallet to mint</div>
      )}
    </div>
  );
}

export default App;

const contractAddress = "0x8E231895043BF1A87639eCCA786d84c972f83a2C";
export const thirdwebClient = createThirdwebClient({
  // If not using Vite, then use `process.env.NEXT_PUBLIC_CLIENT_ID`
  clientId: import.meta.env.VITE_CLIENT_ID,
});

const thirdwebContract = getContract({
  address: contractAddress,
  chain: sepolia,
  client: thirdwebClient,
});

const MintNftWithWagmi = ({
  thirdwebAccount,
}: {
  thirdwebAccount: Account;
}) => {
  const switchChain = useSwitchActiveWalletChain();
  const walletChain = useActiveWalletChain();
  const [isLoading, setIsLoading] = useState(false);
  const { writeContractAsync } = useWriteContract();

  // Once the wallet is connected (using thirdweb Connect)
  // this wagmi hook should automatically pick up the connected account!
  // const account = useAccount();

  const claimNFT = async () => {
    setIsLoading(true);
    // Make sure user is on the right chain
    if (walletChain?.id !== sepolia?.id) await switchChain(sepolia);

    /**
     * Step 1: Preparing contract call params (we will be calling the `claim` function)
     * To keep a lean scope for this demo, we will be hard-coding a few variables
     * For example: you will be able to claim (for free) only 1 NFT (quantity = 1) at a time
     * However in most real world scenario you need to make things "dynamic"
     */
    const quantity = 1;
    // const tokenId = 0; // The Edition contract in this repo has only 1 token
    const currency = NATIVE_TOKEN_ADDRESS;
    const receiver = thirdwebAccount.address;
    const pricePerToken = 0;
    const addressZero = "0x";
    const allowListProof = {
      proof: [
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      ],
      quantityLimitPerWallet: 0,
      pricePerToken,
      currency: NATIVE_TOKEN_ADDRESS,
    };

    /**
     * Step 2: Use thirdweb sdk to get the ABI of the contract
     */
    const abi = await resolveContractAbi(thirdwebContract);

    /**
     * Step 3: Execute the transaction using wagmi
     */
    try {
      const hash = await writeContractAsync({
        abi,
        address: contractAddress,
        functionName: "claim",
        args: [
          receiver,
          quantity,
          currency,
          pricePerToken,
          allowListProof,
          addressZero,
        ],
      });
      console.log({ hash });
      alert("Transaction submitted: " + hash);
    } catch (err) {
      console.error(err);
    }
    setIsLoading(false);
  };

  const { data } = useReadContract(getNFT, {
    contract: thirdwebContract,
    tokenId: 1n,
  });
  return (
    <div className="mx-auto mt-10 lg:w-[600px] flex flex-col gap-4">
      {isLoading ? (
        <div className="flex items-center space-x-4">
          <Skeleton className="max-h-48 w-[500px]" />
        </div>
      ) : (
        <div className="mx-auto">
          <MediaRenderer client={thirdwebClient} src={data?.metadata.image} />
        </div>
      )}
      <button
        className="bg-purple-700 text-white rounded-2xl py-3 w-[250px] mx-auto hover:bg-purple-500"
        onClick={claimNFT}
      >
        {isLoading ? "Claiming..." : "Claim an NFT"}
      </button>
    </div>
  );
};
