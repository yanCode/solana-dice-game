mod instructions;
mod pda;
pub mod constants;
mod errors;
use anchor_lang::prelude::*;
use instructions::*;
use pda::*;

declare_id!("8TdE8ycHXpH1FBUpUTpZK5gCCppZ1yGyesvKv5JFvSXG");

#[program]
pub mod solana_dice_game {
    use super::*;

    pub fn create_coinflip(
        ctx: Context<CreateCoinflip>,
        room_id: String,
        amount: u64,
    ) -> Result<()> {
        create_coinflip_handler(ctx, room_id, amount)
    }
}
