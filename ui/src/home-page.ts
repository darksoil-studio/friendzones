import {
	Friend,
	FriendsStore,
	Profile,
	friendsStoreContext,
} from '@darksoil-studio/friends-zome';
import '@darksoil-studio/friends-zome/dist/elements/manual-friend-request.js';
import '@darksoil-studio/notifications-zome/dist/elements/my-notifications-icon-button.js';
import { AppClient } from '@holochain/client';
import { consume } from '@lit/context';
import { msg } from '@lit/localize';
import '@shoelace-style/shoelace/dist/components/divider/divider.js';
import '@shoelace-style/shoelace/dist/components/format-date/format-date.js';
import { Router, Routes, appClientContext } from '@tnesh-stack/elements';
import '@tnesh-stack/elements/dist/elements/display-error.js';
import { AsyncResult, SignalWatcher, joinAsync } from '@tnesh-stack/signals';
import { EntryRecord } from '@tnesh-stack/utils';
import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { join } from 'lit/directives/join.js';

import { appStyles } from './app-styles.js';
import { friendzonesStoreContext } from './friendzones/friendzones/context.js';
import { FriendzonesStore } from './friendzones/friendzones/friendzones-store.js';
import { Timezone } from './friendzones/friendzones/types.js';

@customElement('home-page')
export class HomePage extends SignalWatcher(LitElement) {
	@consume({ context: appClientContext })
	client!: AppClient;

	/**
	 * Profiles store for this element, not required if you embed this element inside a `<profiles-context>`
	 */
	@consume({ context: friendzonesStoreContext, subscribe: true })
	@property()
	store!: FriendzonesStore;

	/**
	 * Profiles store for this element, not required if you embed this element inside a `<profiles-context>`
	 */
	@consume({ context: friendsStoreContext, subscribe: true })
	@property()
	friendsStore!: FriendsStore;

	@state()
	selectedDate: number | undefined;

	renderProfile(profile: Profile, timezone: Timezone) {
		console.log(timezone);
		return html`
			<div class="row" style="gap: 32px; align-items: center; width: 300px">
				<div class="column" style="gap: 8px;flex:1">
					<div class="row" style="gap: 8px; align-items: center">
						<sl-avatar
							style="--size: 32px"
							.image=${profile.avatar}
						></sl-avatar>
						<span>${profile.name} </span>
					</div>
					<span class="placeholder">${timezone.city}</span>
					<span class="placeholder">${timezone.timezone}</span>
				</div>

				<sl-format-date
					hour="numeric"
					hour-format="12"
					.date=${this.selectedDate ? this.selectedDate : Date.now()}
					time-zone="${timezone.timezone}"
				>
				</sl-format-date>
			</div>
		`;
	}

	get timesToDisplay() {
		const nowDate = new Date();
		nowDate.setMinutes(0);
		nowDate.setSeconds(0);
		nowDate.setMilliseconds(0);

		const now = nowDate.valueOf();

		const millisInAnHour = 60 * 60 * 1000;
		const startHour = -6;
		const endHour = 6;
		const timestoDisplay: number[] = [];

		for (let i = startHour; i < endHour; i++) {
			timestoDisplay.push(now + i * millisInAnHour);
		}

		return timestoDisplay;
	}

	renderTimezone(timezone: Timezone) {
		return html`
			<div class="row" style="align-items: center">
				${join(
					this.timesToDisplay.map(
						timestamp =>
							html` <div
								style="cursor: grab; width: 80px"
								@click=${() => (this.selectedDate = timestamp)}
							>
								<sl-format-date
									.date=${timestamp}
									hour="numeric"
									hour-format="12"
									.timeZone=${timezone.timezone}
								>
								</sl-format-date>
							</div>`,
					),
					html`<sl-divider vertical></sl-divider>`,
				)}
			</div>
		`;
	}

	renderTimezones(
		myTimezone: Timezone,
		myProfile: Profile,
		friends: Array<Friend>,
		friendsTimezones: Array<Timezone>,
	) {
		return html`
			<div class="column" style="gap: 16px">
				<div class="row" style="align-items: center; gap: 16px">
					${this.renderProfile(myProfile, myTimezone)}
					<sl-divider vertical></sl-divider> ${this.renderTimezone(myTimezone)}
				</div>
				${friends.map(
					(friend, i) => html`
						<div class="row" style="align-items: center; gap: 16px">
							${this.renderProfile(friend.profile, friendsTimezones[i])}
							<sl-divider vertical></sl-divider> ${this.renderTimezone(
								friendsTimezones[i],
							)}
						</div>
					`,
				)}
			</div>
		`;
	}

	myFriendsTimezones() {
		const myTimezone = this.store.myTimezone.get();
		const myProfile = this.friendsStore.myProfile.get();
		const friends = this.friendsStore.friends.get();
		if (myProfile.status !== 'completed') return myProfile;
		if (friends.status !== 'completed') return friends;
		if (myTimezone.status !== 'completed') return myTimezone;

		const friendsTimezones = joinAsync(
			friends.value.map(friend =>
				this.store.timezoneForAgent.get(friend.agents[0]).get(),
			),
		);

		if (friendsTimezones.status !== 'completed') return friendsTimezones;
		return {
			status: 'completed' as const,
			value: {
				myProfile: myProfile.value,
				myTimezone: myTimezone.value,
				friends: friends.value,
				friendsTimezones: friendsTimezones.value,
			},
		};
	}

	renderContent() {
		const data = this.myFriendsTimezones();

		switch (data.status) {
			case 'pending':
				return html`<div
					class="row"
					style="flex: 1; justify-content: center; align-items: center"
				>
					<sl-spinner style="font-size: 2rem"></sl-spinner>
				</div>`;
			case 'error':
				return html`<display-error
					.headline=${msg('Error fetching your timezone.')}
					.error=${data.error}
				></display-error>`;
			case 'completed':
				return this.renderTimezones(
					data.value.myTimezone!,
					data.value.myProfile!,
					data.value.friends,
					data.value.friendsTimezones,
				);
		}
	}

	render() {
		return html`
			<div class="column" style="flex: 1">
				<div class="row top-bar">
					<span class="title" style="flex: 1">${msg('Friendzones')}</span>

					<div class="row" style="gap: 16px">
						<manual-friend-request> </manual-friend-request>
						<my-notifications-icon-button> </my-notifications-icon-button>
						<sl-button
							@click=${() =>
								this.dispatchEvent(
									new CustomEvent('friend-requests-selected', {
										bubbles: true,
										composed: true,
									}),
								)}
							>${msg('Friend Requests')}
						</sl-button>
					</div>
				</div>

				<div
					class="column"
					style="flex: 1; align-items: center; justify-content: center;"
				>
					${this.renderContent()}
				</div>
			</div>
		`;
	}

	static styles = [
		css`
			:host {
				display: flex;
				flex: 1;
			}
		`,
		...appStyles,
	];
}
