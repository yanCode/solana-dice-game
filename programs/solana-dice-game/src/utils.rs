use std::mem::size_of;

use anchor_lang::prelude::*;
use orao_solana_vrf::state::Randomness;

pub fn get_account_data(account_info: &AccountInfo) -> Result<Randomness> {
    if account_info.data_is_empty() {
        return Err(ProgramError::UninitializedAccount.into());
    }

    let account = Randomness::try_deserialize(&mut &account_info.data.borrow_mut()[..])?;

    Ok(account)
}

pub fn current_state(randomness: &Randomness) -> Option<u64> {
   
    randomness.fulfilled().map(|state| {
        let value = state[0..size_of::<u64>()].try_into().unwrap();
        u64::from_le_bytes(value)
    })
}
