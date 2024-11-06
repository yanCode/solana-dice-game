pub mod constants;
mod errors;
mod instructions;
mod pda;
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

    pub fn join_coinflip(ctx: Context<JoinCoinflip>, room_id: String) -> Result<()> {
        join_coinflip_handler(ctx, room_id)
    }

    pub fn play_coinflip(ctx: Context<PlayCoinflip>, room_id: String) -> Result<()> {
        play_coinflip_handler(ctx, room_id)
    }

    pub fn result_coinflip(ctx: Context<ResultCoinflip>, room_id: String) -> Result<()> {
        result_coinflip_handler(ctx, room_id)
    }
}
