use crate::constants::DISCRIMINATOR_SIZE;
use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction( room_id: String,amount: u64)]
pub struct CreateCoinflip<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        init,
        payer = user,
        seeds = [b"coinflip", room_id.as_bytes().as_ref()],
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
#[derive(AnchorSerialize, AnchorDeserialize,  Clone, InitSpace, Debug)]
pub enum CoinFlipState {
    WaitingForPlayer,
    Processing,
    Finished,
}
