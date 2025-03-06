use std::collections::BTreeMap;

use hdk::prelude::*;
use serde::de::DeserializeOwned;

pub fn call_local_zome<P, R>(
    zome_name: ZomeName,
    fn_name: FunctionName,
    payload: P,
) -> ExternResult<Option<R>>
where
    P: serde::Serialize + std::fmt::Debug,
    R: DeserializeOwned + std::fmt::Debug,
{
    let call_result = call(
        CallTargetCell::Local,
        zome_name.clone(),
        fn_name.clone(),
        None,
        payload,
    );

    match call_result {
        Ok(response) => match response {
            ZomeCallResponse::Ok(result) => {
                let result: R = result.decode().map_err(|err| wasm_error!(err))?;
                Ok(Some(result))
            }
            _ => Err(wasm_error!(WasmErrorInner::Guest(format!(
                "Failed to call {zome_name}/{fn_name}: {response:?}"
            )))),
        },
        Err(err) => {
            if format!("{err:?}").contains("Zome not found") {
                return Ok(None);
            }
            return Err(err);
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Profile {
    pub name: String,
    pub avatar: Option<String>,
    pub fields: BTreeMap<String, String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Friend {
    pub agents: BTreeSet<AgentPubKey>,
    pub profile: Profile,
}

pub fn query_all_friends() -> ExternResult<Vec<Friend>> {
    let Some(friends): Option<Vec<Friend>> =
        call_local_zome(ZomeName::from("friends"), "query_all_friends".into(), ())?
    else {
        return Ok(vec![]);
    };

    Ok(friends)
}
