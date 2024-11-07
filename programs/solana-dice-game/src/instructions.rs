use anchor_lang::{
    prelude::*,
    solana_program::{
        native_token::LAMPORTS_PER_SOL, program::invoke, system_instruction::transfer,
    },
};
use orao_solana_vrf::cpi::accounts::Request;

use crate::{
    current_state, errors::CoinflipError, get_account_data, CoinFlipState, CreateCoinflip,
    JoinCoinflip, PlayCoinflip, ResultCoinflip,
};

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
    if coinflip.user_2 != Pubkey::default() {
        return err!(CoinflipError::CoinflipAlreadyHasTwoPlayers);
    }
    coinflip.user_2 = ctx.accounts.user.key();
    coinflip.amount *= 2;
    coinflip.state = CoinFlipState::Processing;
    Ok(())
}
pub fn play_coinflip_handler(
    ctx: Context<PlayCoinflip>,
    room_id: String,
    force: [u8; 32],
) -> Result<()> {
    let player = &ctx.accounts.user;
    let coinflip = &mut ctx.accounts.coinflip;
    if coinflip.user_1 != player.key() && coinflip.user_2 != player.key() {
        return err!(CoinflipError::NotPlayer);
    }
    if coinflip.state != CoinFlipState::Processing {
        return err!(CoinflipError::CoinflipNotProcessing);
    }
    let cpi_program = ctx.accounts.vrf.to_account_info();
    let cpi_accounts = Request {
        payer: ctx.accounts.user.to_account_info(),
        network_state: ctx.accounts.config.to_account_info(),
        treasury: ctx.accounts.treasury.to_account_info(),
        request: ctx.accounts.random.to_account_info(),
        system_program: ctx.accounts.system_program.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    orao_solana_vrf::cpi::request(cpi_ctx, force)?;
    coinflip.state = CoinFlipState::WaitingForResult;
    msg!("Started game in room {}", room_id);
    Ok(())
}

pub fn result_coinflip_handler(ctx: Context<ResultCoinflip>, room_id: String) -> Result<()> {
    let coinflip = &mut ctx.accounts.coinflip;
    let randomness_data = get_account_data(&ctx.accounts.random)?;
    let randomness =
        current_state(&randomness_data).ok_or(CoinflipError::CoinflipResultNotReady)?;

    let result = randomness % 2;
    if result == 0 {
        coinflip.winner = coinflip.user_1;

        **ctx.accounts.user_1.lamports.borrow_mut() = ctx
            .accounts
            .user_1
            .lamports()
            .checked_add(coinflip.amount * 2)
            .unwrap();
    } else {
        coinflip.winner = coinflip.user_2;
        **ctx.accounts.user_2.lamports.borrow_mut() = ctx
            .accounts
            .user_2
            .lamports()
            .checked_add(coinflip.amount * 2)
            .unwrap();
    }
    **coinflip.to_account_info().lamports.borrow_mut() -= coinflip.amount * 2;
    coinflip.state = CoinFlipState::Finished;
    Ok(())
}
