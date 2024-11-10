import { AnchorProvider, BN } from "@coral-xyz/anchor";
import { FulfillBuilder, InitBuilder, Orao } from "@orao-network/solana-vrf";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import nacl from "tweetnacl";

const VRF_PROGRAM_ID = "VRFzZoJdhFWL8rkvu87LpKM3RbcVezpMEc6X5GVDr7y";

export class OraoVrfHelper {
  private readonly vrf: Orao;
  private readonly treasury: Keypair;
  private readonly fulfillmentAuthority: Keypair;
  private readonly configAuthority: Keypair;
  private readonly connection: AnchorProvider["connection"];

  private constructor(provider: AnchorProvider) {
    this.vrf = new Orao(provider);
    this.connection = provider.connection;
    this.treasury = Keypair.generate();
    this.configAuthority = Keypair.generate();
    this.fulfillmentAuthority = Keypair.generate();
  }

  static async create(provider: AnchorProvider): Promise<OraoVrfHelper> {
    const vrfHelper = new OraoVrfHelper(provider);
    await vrfHelper.init();
    return vrfHelper;
  }

  get getVrf(): Orao {
    return this.vrf;
  }

  get getTreasury(): Keypair {
    return this.treasury;
  }

  async init(): Promise<void> {
    const programInfo = await this.connection.getAccountInfo(
      new PublicKey(VRF_PROGRAM_ID)
    );
    if (!programInfo) {
      throw new Error("Orao VRF program is not loaded into your localnet, please check it...");
    }
    
    const fee = 2 * LAMPORTS_PER_SOL;
    const fulfillmentAuthorities = [this.fulfillmentAuthority.publicKey];
    const tx = await new InitBuilder(
      this.vrf,
      this.configAuthority.publicKey,
      this.treasury.publicKey,
      fulfillmentAuthorities,
      new BN(fee)
    ).rpc();
    console.log("Your transaction signature of InitBuilder:", tx);
  }

  async mockFulfillment(seed: Buffer): Promise<void> {
    let signature = nacl.sign.detached(seed, this.fulfillmentAuthority.secretKey);
    await new FulfillBuilder(this.vrf, seed).rpc(
      this.fulfillmentAuthority.publicKey,
      signature
    );
  }
}
