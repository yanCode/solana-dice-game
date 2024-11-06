import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import { SolanaDiceGame } from "../target/types/solana_dice_game";
import { PublicKey, SystemProgram } from "@solana/web3.js";

describe("solana-dice-game", () => {
  const room_id = "some_random_room_id";
  const amount = 100;
  const payer = anchor.Wallet.local().payer
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.SolanaDiceGame as Program<SolanaDiceGame>;
  const [coinflip] = PublicKey.findProgramAddressSync(
    [Buffer.from("coinflip"), Buffer.from(room_id)],
    program.programId
  );

  it("should create coinflip", async () => {

    const tx = await program.methods.createCoinflip(room_id, new BN(10))
      .accounts({
        coinflip,
        user: payer.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    console.log("Your transaction signature", tx);
  });
});
