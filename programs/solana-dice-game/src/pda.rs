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
        space = CoinFlip::INIT_SPACE
    )]
    pub coinflip: Account<'info, CoinFlip>,
    pub system_program: Program<'info, System>,
}
#[account]
#[derive(InitSpace)]
pub struct CoinFlip {
    pub user_1: Pubkey,
    pub user_2: Pubkey,
}
