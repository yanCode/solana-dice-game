pub mod constants;
mod errors;
mod instructions;
mod pda;
mod utils;
use anchor_lang::prelude::*;
use instructions::*;
use pda::*;
use utils::*;
declare_id!("GKF1S9Cz549GV5peutKqYXbTBFeoqdBqeLgTDz6CgowR");

#[program]
pub mod solana_dice_game {
    use super::*;

    pub fn create_coinflip(
        ctx: Context<CreateCoinflip>,
        _room_id: String,
        amount: u64,
    ) -> Result<()> {
        create_coinflip_handler(ctx, amount)
    }

    pub fn join_coinflip(ctx: Context<JoinCoinflip>, _room_id: String) -> Result<()> {
        join_coinflip_handler(ctx)
    }

    pub fn play_coinflip(
        ctx: Context<PlayCoinflip>,
        room_id: String,
        force: [u8; 32],
    ) -> Result<()> {
        play_coinflip_handler(ctx, room_id, force)
    }

    pub fn result_coinflip(ctx: Context<ResultCoinflip>, _room_id: String) -> Result<()> {
        result_coinflip_handler(ctx)
    }
}
