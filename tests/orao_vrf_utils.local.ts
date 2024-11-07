import { AnchorProvider, BN } from "@coral-xyz/anchor";
import { FulfillBuilder, InitBuilder, Orao } from "@orao-network/solana-vrf";
import { Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import nacl from "tweetnacl";


export class OraoVrfHelper {
  private readonly vrf: Orao;
  private readonly treasury: Keypair;
  private readonly fulfillmentAuthority: Keypair;
  private readonly configAuthority: Keypair;

  constructor(provider: AnchorProvider) {
    this.vrf = new Orao(provider);
    this.treasury = Keypair.generate();
    this.configAuthority = Keypair.generate();
    this.fulfillmentAuthority = Keypair.generate();
  }

  get getVrf(): Orao {
    return this.vrf;
  }

  get getTreasury(): Keypair {
    return this.treasury;
  }

  async init(): Promise<void> {
    const fee = 2 * LAMPORTS_PER_SOL;
    const fulfillmentAuthorities = [this.fulfillmentAuthority.publicKey];
    console.log("================================================")
    console.log("treasury", this.vrf.programId);
    console.log("configAuthority", this.configAuthority.publicKey.toBase58());
    await new InitBuilder(
      this.vrf,
      this.configAuthority.publicKey,
      this.treasury.publicKey,
      fulfillmentAuthorities,
      new BN(fee)
    ).rpc();
  }
  async mockFulfillment(seed: Buffer): Promise<void> {
    let signature = nacl.sign.detached(seed, this.fulfillmentAuthority.secretKey);
    await new FulfillBuilder(this.vrf, seed).rpc(
      this.fulfillmentAuthority.publicKey,
      signature
    );
  }
}
