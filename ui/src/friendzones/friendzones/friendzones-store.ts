import { PrivateEventSourcingStore } from '@darksoil-studio/private-event-sourcing-zome';
import {
	ActionHash,
	AgentPubKey,
	EntryHash,
	NewEntryAction,
	Record,
	Timestamp,
	encodeHashToBase64,
} from '@holochain/client';
import {
	AsyncComputed,
	allRevisionsOfEntrySignal,
	collectionSignal,
	deletedLinksSignal,
	deletesForEntrySignal,
	immutableEntrySignal,
	latestVersionOfEntrySignal,
	liveLinksSignal,
	pipe,
	toPromise,
} from '@tnesh-stack/signals';
import {
	EntryRecord,
	HashType,
	MemoHoloHashMap,
	retype,
	slice,
} from '@tnesh-stack/utils';

import { FriendzonesClient } from './friendzones-client.js';
import { FriendzonesEvent } from './types.js';

export class FriendzonesStore extends PrivateEventSourcingStore<FriendzonesEvent> {
	constructor(public client: FriendzonesClient) {
		super(client);

		setInterval(async () => {
			const myTimezone = await toPromise(this.myTimezone);

			if (myTimezone) {
				this.client.setMyTimezone(myTimezone.city, myTimezone.timezone);
			}
		}, 10000);
	}

	timezoneForAgent = new MemoHoloHashMap(
		(friend: AgentPubKey) =>
			new AsyncComputed(() => {
				const privateEvents = this.privateEvents.get();
				if (privateEvents.status !== 'completed') return privateEvents;

				let myTimezone:
					| { city: string; timezone: string; timestamp: Timestamp }
					| undefined;

				for (const [entryHash, entry] of Object.entries(privateEvents.value)) {
					if (entry.event.content.type !== 'SetTimezone') {
						continue;
					}
					if (encodeHashToBase64(entry.author) !== encodeHashToBase64(friend)) {
						continue;
					}

					if (!myTimezone || myTimezone.timestamp < entry.event.timestamp) {
						myTimezone = {
							city: entry.event.content.city,
							timezone: entry.event.content.timezone,
							timestamp: entry.event.timestamp,
						};
					}
				}

				return {
					status: 'completed',
					value: myTimezone
						? {
								city: myTimezone.city,
								timezone: myTimezone.timezone,
							}
						: undefined,
				};
			}),
	);

	myTimezone = this.timezoneForAgent.get(this.client.client.myPubKey);
}
