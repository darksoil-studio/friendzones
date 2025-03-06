use std::collections::BTreeMap;

use hdk::prelude::*;
use private_event_sourcing::*;

use crate::friends::query_all_friends;

#[derive(Serialize, Deserialize, Debug, Clone, SerializedBytes)]
#[serde(tag = "type")]
pub enum FriendzonesEvent {
    SetTimezone { city: String, timezone: String },
}

impl PrivateEvent for FriendzonesEvent {
    fn validate(
        &self,
        _author: AgentPubKey,
        _timestamp: Timestamp,
    ) -> ExternResult<ValidateCallbackResult> {
        Ok(ValidateCallbackResult::Valid)
    }

    fn recipients(
        &self,
        _author: AgentPubKey,
        _timestamp: Timestamp,
    ) -> ExternResult<Vec<AgentPubKey>> {
        match self {
            Self::SetTimezone { .. } => {
                let friends = query_all_friends()?;
                let all_agents = friends
                    .into_iter()
                    .map(|friend| friend.agents)
                    .flatten()
                    .collect();
                Ok(all_agents)
            }
        }
    }
}

pub fn query_friendzones_events(
) -> ExternResult<BTreeMap<EntryHashB64, SignedEvent<FriendzonesEvent>>> {
    query_private_events()
}

#[hdk_extern]
pub fn recv_remote_signal(signal_bytes: SerializedBytes) -> ExternResult<()> {
    if let Ok(private_event_sourcing_remote_signal) =
        PrivateEventSourcingRemoteSignal::try_from(signal_bytes)
    {
        recv_private_events_remote_signal::<FriendzonesEvent>(private_event_sourcing_remote_signal)
    } else {
        Ok(())
    }
}

#[hdk_extern]
pub fn attempt_commit_awaiting_deps_entries() -> ExternResult<()> {
    private_event_sourcing::attempt_commit_awaiting_deps_entries::<FriendzonesEvent>()?;

    Ok(())
}

#[hdk_extern(infallible)]
fn scheduled_synchronize_with_linked_devices(_: Option<Schedule>) -> Option<Schedule> {
    if let Err(err) = commit_my_pending_encrypted_messages::<FriendzonesEvent>() {
        error!("Failed to commit my encrypted messages: {err:?}");
    }
    if let Err(err) = synchronize_with_linked_devices(()) {
        error!("Failed to synchronize with other agents: {err:?}");
    }

    Some(Schedule::Persisted("*/30 * * * * * *".into())) // Every 30 seconds
}
