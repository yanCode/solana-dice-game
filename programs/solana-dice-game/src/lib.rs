use anchor_lang::prelude::*;

declare_id!("8TdE8ycHXpH1FBUpUTpZK5gCCppZ1yGyesvKv5JFvSXG");

#[program]
pub mod solana_dice_game {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
