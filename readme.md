# Solana Dice Game

## TL;DR

This project provides a minial but out of box example of how to integrate [ORAO VRF](https://www.orao.network/) into your Solana program. it comes with detailed explanation which may not be easy to find from the official website. If you are new to the Verifiable Random Function and [ORAO VRF](https://www.orao.network/), this is the project that may save you tons of time. 

### what does it do?
+ how to use `orao-solana-vrf` with anchor `0.30.1`, which is current not supported by `orao-solana-vrf`
+ how to setup `orao-solana-vrf` in test environment
+ how to mock a fullfillment of `orao-solana-vrf` in test environment



## takeaways

- Current version v0.4.0 of [orao-solana-vrf](https://crates.io/crates/orao-solana-vrf) in crates.io was published 6 months ago, in which it still points to the old version of `anchor 0.29.0`, to make it work with the latest version of `0.30.1`, I forked the repo and updated anchor related dependencies then refer orao-solana-vrf from my forked repo.
  ```toml
  [dependencies]
  orao-solana-vrf = {git = "https://github.com/yanCode/solana-vrf.git", branch = "anchor-lang_0.30.1", features = ["cpi"], default-features = false}
  ```

  > 🔐 You can directly refer to this forked repo but it can be wiser to fork it for you own project and double check what changes has been made to avoid any potential security issues.

- In `localnet` started by `solana-test-validator`, `orao-solana-vrf` program is not deployed by default, to use it in test environment, you need to configure `test.genesis` on `Anchor.toml` to make it automatically loaded.

  ```toml
  [[test.genesis]]
  address = "VRFzZoJdhFWL8rkvu87LpKM3RbcVezpMEc6X5GVDr7y"
  program = "tests/prebuilt/orao_vrf.so"
  ```
  1. `VRFzZoJdhFWL8rkvu87LpKM3RbcVezpMEc6X5GVDr7y` is the address of `orao-solana-vrf` program you can find from [ORAO VRF](https://www.orao.network/), please keep it consistent in your localnet.

  2. `tests/prebuilt/orao_vrf.so` is the program of `orao-solana-vrf`. You can directly copy from my project, but it's highly recommended to build it from source. Or directly download from `mainnet` using `solana program dump <program_address>`. which can avoid copying any maliciously programs.
  > 🧯 Thinking as a hacker, may help your program to be more secure.
- In test environment, you have to manually mock the fulfillment of `orao-solana-vrf` program to generate a random number. as in `solana-dice-game.spec.ts`
 
    ```typescript
      /**
      * Mock fulfillment for testing to trigger the fulfillment so that to generate a random  number. which is usually done by an oracle in the mainnet.
      * @param seed - The seed to use for the fulfillment
      */
      async mockFulfillment(seed: Buffer): Promise<void> {
        let signature = nacl.sign.detached(seed, this.fulfillmentAuthority.secretKey);
        await new FulfillBuilder(this.vrf, seed).rpc(
          this.fulfillmentAuthority.publicKey,
          signature
        );
      }
  ```
  > 🎲 You will only get a random number from the Oracle in the mainnet after you setup the payment for orao vrf.

- According to an offical reply on a PR [orao-network/solana-vrf#13](https://github.com/orao-network/solana-vrf/pull/13) opened by me, it will soon release a new version to support callback of random number fulfillment.

## How to run:

ensure you have installed `solana-test-validator` and `anchor` of `v0.30.1` in your local machine. then run:

```bash
anchor test
```

## Q&A:


> ☕️ Q: Why VRF is usually for pay while regular data feeds are free?

> 💡 A: Regular data feeds (like exchange rates) come from observable real-world data, which can be used by anyone. By contrast, VRF needs to be computed for yourself while guaranteeing it to be both unpredictable AND verifiable. The computations for VRF consume more resources and processing power.  This is kind of like in the era of television, watching news was generally free. However, if you wanted to request a song for your loved ones, you had to pay. 


