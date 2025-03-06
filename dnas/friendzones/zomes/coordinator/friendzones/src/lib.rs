use friendzones_integrity::*;
use hdk::prelude::*;
use private_event::FriendzonesEvent;
use private_event_sourcing::create_private_event;

mod friends;
mod private_event;

#[derive(Serialize, Deserialize, Debug)]
pub struct SetMyTimezoneInput {
    pub city: String,
    pub timezone: String,
}

#[hdk_extern]
pub fn set_my_timezone(input: SetMyTimezoneInput) -> ExternResult<()> {
    create_private_event(FriendzonesEvent::SetTimezone {
        city: input.city,
        timezone: input.timezone,
    })?;

    Ok(())
}
