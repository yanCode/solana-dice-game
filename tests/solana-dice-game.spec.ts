import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import { SolanaDiceGame } from "../target/types/solana_dice_game";
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL, Keypair } from "@solana/web3.js";
import { assert } from "chai";
import { randomnessAccountAddress, networkStateAccountAddress } from "@orao-network/solana-vrf";
import { OraoVrfTestHelper } from "./orao_vrf_utils.local";

describe("solana-dice-game", async () => {
  const room_id = "some_random_room_id";
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
  let vrfTestHelper: OraoVrfTestHelper;
  before(async () => {
    vrfTestHelper = await OraoVrfTestHelper.create(provider);
    // Airdrop SOL to user_2 for testing
    const signature = await connection.requestAirdrop(
      user_2.publicKey,
      10 * LAMPORTS_PER_SOL
    );
    const latestBlockhash = await connection.getLatestBlockhash();
    await connection.confirmTransaction({ signature, ...latestBlockhash });

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
    await program.methods.createCoinflip(room_id, new BN(2 * LAMPORTS_PER_SOL))
      .accounts({
        coinflip,
        user: payer.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const coinflipAccount = await program.account.coinFlip.fetch(coinflip);
    console.log("🏂 After creating, coinflip account has amount:", coinflipAccount.amount.div(new BN(LAMPORTS_PER_SOL)).toNumber());
    const balance = await connection.getBalance(coinflip);
    assert.equal(coinflipAccount.amount.lt(new BN(balance)), true);
    assert.equal(coinflipAccount.amount.eq(new BN(2 * LAMPORTS_PER_SOL)), true);

  });

  it("should join coinflip successfully", async () => {
    await program.methods.joinCoinflip(room_id)
      .accounts({
        coinflip,
        user: user_2.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([user_2])
      .rpc();
    const coinflipAccount = await program.account.coinFlip.fetch(coinflip);
    console.log("🤼 After joining, coinflip account has amount:", coinflipAccount.amount.div(new BN(LAMPORTS_PER_SOL)).toNumber());
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

    const tx = await program.methods.playCoinflip(room_id, [...force.toBuffer()])
      .accounts({
        coinflip,
        user: payer.publicKey,
        random: random_pda,
        vrf: OraoVrfTestHelper.VRF_PROGRAM_ID,
        treasury: vrfTestHelper.treasuryAccount.publicKey,
        config: networkStateAccountAddress(),
        systemProgram: SystemProgram.programId,
      }).rpc();
    const coinflipAccount = await program.account.coinFlip.fetch(coinflip);
    assert.deepEqual(coinflipAccount.state, { waitingForResult: {} });
  });

  it("Randomness fulfilled", async () => {
    await vrfTestHelper.mockFulfillment(force.toBuffer())
    console.log("🔄 Waiting for randomness to be fulfilled, it might take a while...")
    await vrfTestHelper.waitFulfilled(force.toBuffer())
    console.log("🎲 Randomness now is fulfilled, we can call the result function")
  })

  it('should process result successfully', async () => {

    await program.methods.resultCoinflip(room_id, [...force.toBuffer()])
      .accounts({
        coinflip,
        user1: payer.publicKey,
        user2: user_2.publicKey,
        treasury: vrfTestHelper.treasuryAccount.publicKey,
        random: random_pda,
        vrf: OraoVrfTestHelper.VRF_PROGRAM_ID,
        config: networkStateAccountAddress(),
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const coinflipAccount = await program.account.coinFlip.fetch(coinflip);
    assert.deepEqual(coinflipAccount.state, { finished: {} });
    const coinflipInfo = await program.account.coinFlip.fetch(coinflip);
    assert.oneOf(coinflipInfo.winner.toBase58(), [coinflipInfo.user1.toBase58(), coinflipInfo.user2.toBase58()]);
  })
});



