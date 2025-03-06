import { consume } from '@lit/context';
import { localized, msg } from '@lit/localize';
import { mdiArrowLeft, mdiSync } from '@mdi/js';
import { SlButton, SlInput } from '@shoelace-style/shoelace';
import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import {
	notifyError,
	sharedStyles,
	wrapPathInSvg,
} from '@tnesh-stack/elements';
import '@tnesh-stack/elements/dist/elements/display-error.js';
import '@tnesh-stack/elements/dist/elements/sl-combobox.js';
import { SlCombobox } from '@tnesh-stack/elements/dist/elements/sl-combobox.js';
import { SignalWatcher } from '@tnesh-stack/signals';
import {
	CityData,
	findFromCityStateProvince,
	lookupViaCity,
} from 'city-timezones';
import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { friendzonesStoreContext } from '../context.js';
import { FriendzonesStore } from '../friendzones-store.js';

/**
 * @element timezone-prompt
 * @slot default - The content of the app
 * @slot hero - Will be displayed above the create-profile form when the user is prompted with it
 */
@localized()
@customElement('timezone-prompt')
export class TimezonePrompt extends SignalWatcher(LitElement) {
	/**
	 * Profiles store for this element, not required if you embed this element inside a `<profiles-context>`
	 */
	@consume({ context: friendzonesStoreContext, subscribe: true })
	@property()
	store!: FriendzonesStore;

	@state()
	city: CityData | undefined;

	private renderPrompt(myTimezoneExists: boolean) {
		if (myTimezoneExists) return html`<slot></slot>`;

		return html`
			<div
				class="column"
				style="align-items: center; justify-content: center; flex: 1; padding-bottom: 10px;"
			>
				<div class="column" style="align-items: center;">
					<sl-card>
						<div class="column" style="gap: 16px;">
							<span>${msg('Set My Timezone')}</span>

							<sl-input
								.label=${msg('City')}
								@input=${(e: CustomEvent) => {
									const value = (e.target as SlInput).value;

									if (value) {
										const cityData = lookupViaCity(value);
										if (cityData.length > 0) {
											this.city = cityData[0];
										}
									}
								}}
							></sl-input>

							<sl-button
								variant="primary"
								.disabled=${!this.city}
								@click=${async (e: CustomEvent) => {
									const button = e.target as SlButton;
									button.loading = true;

									try {
										await this.store.client.setMyTimezone(
											this.city!.city,
											this.city!.timezone,
										);
									} catch (e) {
										notifyError(msg('Failed to set my timezone.'));
										console.error(e);
									}

									button.loading = false;
								}}
								>${msg('Set Timezone')}
							</sl-button>
						</div>
					</sl-card>
				</div>
			</div>
		`;
	}

	render() {
		if (!this.store) return html``;
		const myTimezone = this.store.myTimezone.get();

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
				return this.renderPrompt(myTimezone.value !== undefined);
		}
	}

	static styles = [
		sharedStyles,
		css`
			:host {
				display: flex;
				flex: 1;
			}
		`,
	];
}
