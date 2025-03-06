import {
	FriendsStore,
	Profile,
	friendsStoreContext,
} from '@darksoil-studio/friends-zome';
import '@darksoil-studio/friends-zome/dist/elements/manual-friend-request.js';
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
		return html`
			<div class="row" style="gap: 32px; align-items: center">
				<div class="column" style="gap: 8px">
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
					.timeZome=${timezone.timezone}
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
								style="cursor: grab"
								@click=${() => (this.selectedDate = timestamp)}
							>
								<sl-format-date
									.date=${timestamp}
									hour="numeric"
									hour-format="12"
								>
								</sl-format-date>
							</div>`,
					),
					html`<sl-divider vertical></sl-divider>`,
				)}
			</div>
		`;
	}

	renderTimezones(myTimezone: Timezone, myProfile: Profile) {
		return html`
			<div class="column">
				<div class="row" style="align-items: center; gap: 16px">
					${this.renderProfile(myProfile, myTimezone)}
					<sl-divider vertical></sl-divider> ${this.renderTimezone(myTimezone)}
				</div>
			</div>
		`;
	}

	renderContent() {
		const myTimezone = joinAsync([
			this.store.myTimezone.get(),
			this.friendsStore.myProfile.get(),
		]);

		switch (myTimezone.status) {
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
					.error=${myTimezone.error}
				></display-error>`;
			case 'completed':
				return this.renderTimezones(myTimezone.value![0], myTimezone.value![1]);
		}
	}

	render() {
		return html`
			<div class="column" style="flex: 1">
				<div class="row top-bar">
					<span class="title" style="flex: 1">${msg('Friendzones')}</span>

					<div class="row" style="gap: 16px">
						<manual-friend-request> </manual-friend-request>
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
