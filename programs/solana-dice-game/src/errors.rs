use anchor_lang::error_code;

#[error_code]
pub enum CoinflipError {
    #[msg("Amount must be greater than 0.05 SOL")]
    InvalidAmount,
    #[msg("Coinflip already has 2 players")]
    CoinflipAlreadyHasTwoPlayers,
    #[msg("User is not a player in this coinflip")]
    NotPlayer,
    #[msg("Coinflip is not in processing state")]
    CoinflipNotProcessing,
    #[msg("Coinflip result is not ready")]
    CoinflipResultNotReady,
}
