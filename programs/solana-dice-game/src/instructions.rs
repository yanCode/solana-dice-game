use anchor_lang::{
    prelude::*,
    solana_program::{
        native_token::LAMPORTS_PER_SOL, program::invoke, system_instruction::transfer,
    },
};

use crate::{errors::CoinflipError, CreateCoinflip};

pub fn create_coinflip_handler(
    ctx: Context<CreateCoinflip>,
    room_id: String,
    amount: u64,
) -> Result<()> {
    if amount < LAMPORTS_PER_SOL / 100 * 5 {
        return err!(CoinflipError::InvalidAmount);
    }
    let coinflip = &mut ctx.accounts.coinflip;

    invoke(
        &transfer(
            ctx.accounts.user.key,
            coinflip.to_account_info().key,
            amount,
        ),
        &[
            ctx.accounts.user.to_account_info(),
            coinflip.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
    )?;
    coinflip.user_1 = ctx.accounts.user.key();
    coinflip.amount = amount;
    Ok(())
}
