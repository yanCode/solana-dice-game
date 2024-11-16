import { AnchorProvider, BN } from "@coral-xyz/anchor";
import { FulfillBuilder, InitBuilder, Orao } from "@orao-network/solana-vrf";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import nacl from "tweetnacl";



export class OraoVrfTestHelper {
  static readonly VRF_PROGRAM_ID = new PublicKey("VRFzZoJdhFWL8rkvu87LpKM3RbcVezpMEc6X5GVDr7y");
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
  /**
   * Create a new `OraoVrfTestHelper instance, which helps to run OraoVrf in localnet, where you don't have the oracle to generate the Vrf values.
   * 
   * Before using this helper, you need to have the Orao VRF program loaded into your localnet.
   * in which, 
   * @field `configAuthority` is the authority of the config account, kept by the VRF program.
   * @field `treasury` is the treasury account,which the user uses to pay the fee for the VRF service. this account is also kept by the VRF program.
   * @field `fulfillmentAuthority` is the authority of the fulfillment account. it's required to sign for each fulfillment from the user's request.
   * @param provider - The provider you normally use in your anchor test code.
   * @returns A new OraoVrfHelper instance
   */
  static async create(provider: AnchorProvider): Promise<OraoVrfTestHelper> {
    const vrfHelper = new OraoVrfTestHelper(provider);
    await vrfHelper.init();
    return vrfHelper;
  }

  get treasuryAccount(): Keypair {
    return this.treasury;
  }

  /**
   * Initialize the Orao VRF program in your localnet. this function should be called 
   * @throws Error if the Orao VRF program is not loaded into your localnet
   */
  private async init(): Promise<void> {
    const programInfo = await this.connection.getAccountInfo(OraoVrfTestHelper.VRF_PROGRAM_ID);
    if (!programInfo) {
      throw new Error("Orao VRF program is not loaded into your localnet, please check it...");
    }

    const fee = 2 * LAMPORTS_PER_SOL;
    const fulfillmentAuthorities = [this.fulfillmentAuthority.publicKey];
    await new InitBuilder(
      this.vrf,
      this.configAuthority.publicKey,
      this.treasury.publicKey,
      fulfillmentAuthorities,
      new BN(fee)
    ).rpc();
  }
  /**
     * Mock fulfillment for testing to trigger the fulfillment so that to generate a random number. which is usually done by an oracle in the mainnet.
     * @param seed - The seed to use for the fulfillment
     */
  async mockFulfillment(seed: Buffer): Promise<void> {
    let signature = nacl.sign.detached(seed, this.fulfillmentAuthority.secretKey);
    await new FulfillBuilder(this.vrf, seed).rpc(
      this.fulfillmentAuthority.publicKey,
      signature
    );
  }
  /**
   * after a fulfillment is mocked, you have to wait for the fulfillment to be fulfilled before you can use the random number.
   * @param seed - The seed to use for the fulfillment
   */
  async waitFulfilled(seed: Buffer): Promise<void> {
    await this.vrf.waitFulfilled(seed);
  }
}
