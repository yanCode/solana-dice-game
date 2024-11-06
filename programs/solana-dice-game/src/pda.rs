use anchor_lang::prelude::*;
use crate::constants::{COINFLIP_SEED, DISCRIMINATOR_SIZE};
use orao_solana_vrf::program::OraoVrf;
use orao_solana_vrf::state::NetworkState;
use orao_solana_vrf::CONFIG_ACCOUNT_SEED;
use orao_solana_vrf::RANDOMNESS_ACCOUNT_SEED;

#[derive(Accounts)]
#[instruction(room_id: String, force: [u8; 32])]
pub struct PlayCoinflip<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
      mut,
      seeds = [COINFLIP_SEED, room_id.as_bytes().as_ref()],
      constraint = coinflip.user_1 == user.key(),
      bump
    )]
    pub coinflip: Account<'info, CoinFlip>,
    /// CHECK: Treasury
    #[account(mut)]
    pub treasury: AccountInfo<'info>,

    /// CHECK: Randomness
    #[account(
      mut,
      seeds = [RANDOMNESS_ACCOUNT_SEED.as_ref(), &force],
      bump,
      seeds::program = orao_solana_vrf::ID
    )]
    pub random: AccountInfo<'info>,
    #[account(
      mut,
      seeds = [CONFIG_ACCOUNT_SEED.as_ref()],
      bump,
      seeds::program = orao_solana_vrf::ID
    )]
    pub config: Account<'info, NetworkState>,

    pub vrf: Program<'info, OraoVrf>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(room_id: String)]
pub struct JoinCoinflip<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
      mut,
      seeds = [COINFLIP_SEED, room_id.as_bytes().as_ref()],
      bump
    )]
    pub coinflip: Account<'info, CoinFlip>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(room_id: String, force: [u8; 32])]
pub struct ResultCoinflip<'info> {
    #[account(mut)]
    pub user_1: SystemAccount<'info>,

    #[account(mut)]
    pub user_2: SystemAccount<'info>,

    #[account(
      mut, 
      seeds = [COINFLIP_SEED, room_id.as_bytes().as_ref()],
      constraint =
      coinflip.state == CoinFlipState::Processing &&
      coinflip.user_1 == user_1.key() &&
      coinflip.user_2 == user_2.key(),
      bump
    )]
    pub coinflip: Account<'info, CoinFlip>,
    /// CHECK: Treasury
    #[account(mut)]
    pub treasury: AccountInfo<'info>,


    /// CHECK: Randomness
    #[account(
        mut,
        seeds = [RANDOMNESS_ACCOUNT_SEED.as_ref(), &force],
        bump,
        seeds::program = orao_solana_vrf::ID
    )]
    pub random: AccountInfo<'info>,

    #[account(
        mut,
        seeds = [CONFIG_ACCOUNT_SEED.as_ref()],
        bump,
        seeds::program = orao_solana_vrf::ID
    )]
    pub config: Account<'info, NetworkState>,

    pub vrf: Program<'info, OraoVrf>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(room_id: String, amount: u64)]
pub struct CreateCoinflip<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        init,
        payer = user,
        seeds = [COINFLIP_SEED, room_id.as_bytes().as_ref()],
        bump,
        space = CoinFlip::INIT_SPACE + DISCRIMINATOR_SIZE
    )]
    pub coinflip: Account<'info, CoinFlip>,
    pub system_program: Program<'info, System>,
}
#[account]
#[derive(InitSpace, Debug)]
pub struct CoinFlip {
    pub state: CoinFlipState,
    pub user_1: Pubkey,
    pub user_2: Pubkey,
    pub amount: u64,
    pub force: [u8; 32],
    pub winner: Pubkey,
}
#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace, Debug, PartialEq)]
pub enum CoinFlipState {
    WaitingForPlayer,
    Processing,
    WaitingForResult,
    Finished,
}
