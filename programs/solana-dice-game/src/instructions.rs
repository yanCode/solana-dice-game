use anchor_lang::{
    prelude::*,
    solana_program::{
        native_token::LAMPORTS_PER_SOL, program::invoke, system_instruction::transfer,
    },
};

use crate::{errors::CoinflipError, CoinFlipState, CreateCoinflip, JoinCoinflip, PlayCoinflip, ResultCoinflip};

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

pub fn join_coinflip_handler(ctx: Context<JoinCoinflip>, room_id: String) -> Result<()> {
    let coinflip = &mut ctx.accounts.coinflip;
    invoke(
        &transfer(
            ctx.accounts.user.key,
            coinflip.to_account_info().key,
            coinflip.amount,
        ),
        &[
            ctx.accounts.user.to_account_info(),
            coinflip.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
    )?;
    coinflip.user_2 = ctx.accounts.user.key();
    coinflip.amount *= 2;
    coinflip.state = CoinFlipState::Processing;
    Ok(())
}
pub fn play_coinflip_handler(ctx: Context<PlayCoinflip>, room_id: String) -> Result<()> {
    Ok(())
}

pub fn result_coinflip_handler(ctx: Context<ResultCoinflip>, room_id: String) -> Result<()> {
    Ok(())
}
