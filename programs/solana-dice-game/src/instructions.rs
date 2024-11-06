use anchor_lang::prelude::*;

use crate::CreateCoinflip;

pub fn create_coinflip_handler(
    ctx: Context<CreateCoinflip>,
    room_id: String,
    amount: u64,
) -> Result<()> {
    msg!("create coinflip from: {:?}", ctx.program_id);
    msg!("room_id: {}", room_id);
    msg!("amount: {}", amount);
    Ok(())
}

