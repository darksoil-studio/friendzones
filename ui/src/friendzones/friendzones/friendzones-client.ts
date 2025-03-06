import {
	PrivateEventSourcingClient,
	PrivateEventSourcingStore,
} from '@darksoil-studio/private-event-sourcing-zome';
import {
	ActionHash,
	AgentPubKey,
	AppClient,
	CreateLink,
	Delete,
	DeleteLink,
	EntryHash,
	Link,
	Record,
	SignedActionHashed,
} from '@holochain/client';
import {
	EntryRecord,
	ZomeClient,
	isSignalFromCellWithRole,
} from '@tnesh-stack/utils';

import { FriendzonesEvent } from './types.js';

export class FriendzonesClient extends PrivateEventSourcingClient {
	constructor(
		public client: AppClient,
		public roleName: string,
		public zomeName = 'friendzones',
	) {
		super(client, roleName, zomeName);
	}

	setMyTimezone(city: string, timezone: string) {
		return this.callZome('set_my_timezone', {
			city,
			timezone,
		});
	}
}
