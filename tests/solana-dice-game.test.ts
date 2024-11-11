import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import { SolanaDiceGame } from "../target/types/solana_dice_game";
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL, Keypair } from "@solana/web3.js";
import { assert } from "chai";
import { randomnessAccountAddress, networkStateAccountAddress } from "@orao-network/solana-vrf";
import { OraoVrfHelper } from "./orao_vrf_utils.local";

describe("solana-dice-game", async () => {
  const room_id = "some_random_room_id";
  const amount = 100;
  const payer = anchor.Wallet.local().payer
  const user_2 = Keypair.generate();
  const force = Keypair.generate().publicKey;
  const provider = anchor.AnchorProvider.env();
  const random_pda = randomnessAccountAddress(force.toBuffer());

  anchor.setProvider(provider);
  const connection = provider.connection;
  const program = anchor.workspace.SolanaDiceGame as Program<SolanaDiceGame>;
  const [coinflip] = PublicKey.findProgramAddressSync(
    [Buffer.from("coinflip"), Buffer.from(room_id)],
    program.programId
  );
  let vrfHelper: OraoVrfHelper;
  before(async () => {
    vrfHelper = await OraoVrfHelper.create(provider);
    // Airdrop SOL to user_2 for testing
    const signature = await connection.requestAirdrop(
      user_2.publicKey,
      10 * LAMPORTS_PER_SOL
    );
    await connection.confirmTransaction(signature);
    const balance = await connection.getBalance(user_2.publicKey);
    console.log(" after airdrop, user_2 has balance:", balance / LAMPORTS_PER_SOL);
  })
  it("should fail if amount is less than 0.05 SOL", async () => {
    try {
      await program.methods.createCoinflip(room_id, new BN(0.01 * LAMPORTS_PER_SOL))
        .accounts({
          coinflip,
          user: payer.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      assert.fail("Expected transaction to fail");
    } catch (err) {
      assert.equal(err.error.errorMessage, "Amount must be greater than 0.05 SOL");
      assert.equal(err.error.errorCode.code, "InvalidAmount");
    }

  });

  it("should create coinflip successfully", async () => {
    const tx = await program.methods.createCoinflip(room_id, new BN(2 * LAMPORTS_PER_SOL))
      .accounts({
        coinflip,
        user: payer.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    console.log("Your transaction signature", tx);
    const coinflipAccount = await program.account.coinFlip.fetch(coinflip);
    console.log("After creating, coinflip account has amount:", coinflipAccount.amount.div(new BN(LAMPORTS_PER_SOL)).toNumber());
    const balance = await program.provider.connection.getBalance(coinflip);
    assert.equal(coinflipAccount.amount.lt(new BN(balance)), true);
    assert.equal(coinflipAccount.amount.eq(new BN(2 * LAMPORTS_PER_SOL)), true);

  });
  it("should join coinflip successfully", async () => {
    const tx = await program.methods.joinCoinflip(room_id)
      .accounts({
        coinflip,
        user: user_2.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([user_2])
      .rpc();
    const coinflipAccount = await program.account.coinFlip.fetch(coinflip);
    console.log("After joining, coinflip account has amount:", coinflipAccount.amount.div(new BN(LAMPORTS_PER_SOL)).toNumber());
    assert.equal(coinflipAccount.amount.eq(new BN(4 * LAMPORTS_PER_SOL)), true);
    assert.equal(coinflipAccount.user2.equals(user_2.publicKey), true);
    assert.deepEqual(coinflipAccount.state, { processing: {} });
  });

  it("should fail if user tries to join coinflip twice", async () => {
    try {
      const tx = await program.methods.joinCoinflip(room_id)
        .accounts({
          coinflip,
          user: user_2.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([user_2])
        .rpc();
      assert.fail("Expected transaction to fail");
    } catch (err) {
      assert.equal(err.error.errorMessage, "Coinflip already has 2 players");
      assert.equal(err.error.errorCode.code, "CoinflipAlreadyHasTwoPlayers");
    }
  })
  it("should play coinflip successfully", async () => {

    // const treasury = new PublicKey("9ZTHWWZDpB36UFe1vszf2KEpt83vwi27jDqtHQ7NSXyR");
    const tx = await program.methods.playCoinflip(room_id, [...force.toBuffer()])
      .accounts({
        coinflip,
        user: payer.publicKey,
        random: random_pda,
        vrf: vrfHelper.getVrf.programId,
        treasury: vrfHelper.getTreasury.publicKey,
        config: networkStateAccountAddress(),
        systemProgram: SystemProgram.programId,
      }).rpc();
    const coinflipAccount = await program.account.coinFlip.fetch(coinflip);
    console.log("After playing, coinflip account has state:", coinflipAccount.state);
    assert.deepEqual(coinflipAccount.state, { waitingForResult: {} });
  });
  it("Randomness fulfilled", async () => {
    console.log("Waiting for randomness to be fulfilled, it might take a while...")
    await vrfHelper.mockFulfillment(force.toBuffer())
    let randomnessFulfilled = await vrfHelper.getVrf.waitFulfilled(force.toBuffer())
    console.log("Randomness is fulfilled, we can call the result function")
  })
  it('should process result successfully', async () => {

    await program.methods.resultCoinflip(room_id, [...force.toBuffer()])
      .accounts({
        coinflip,
        user1: payer.publicKey,
        user2: user_2.publicKey,
        treasury: vrfHelper.getTreasury.publicKey,
        random: random_pda,
        vrf: vrfHelper.getVrf.programId,
        config: networkStateAccountAddress(),
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const coinflipAccount = await program.account.coinFlip.fetch(coinflip);
    console.log("After processing result, coinflip account has state:", coinflipAccount.state);

  })
});



