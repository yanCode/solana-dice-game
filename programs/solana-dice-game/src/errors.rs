use anchor_lang::error_code;

#[error_code]
pub enum CoinflipError {
    #[msg("Amount must be greater than 0.05 SOL")]
    InvalidAmount,
}
