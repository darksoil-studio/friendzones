import '@darksoil-studio/friends-zome/dist/elements/friend-requests.js';
import '@darksoil-studio/friends-zome/dist/elements/friends-context.js';
import '@darksoil-studio/friends-zome/dist/elements/profile-prompt.js';
import '@darksoil-studio/notifications-zome/dist/elements/notifications-context.js';
import {
	ActionHash,
	AppClient,
	AppWebsocket,
	decodeHashFromBase64,
	encodeHashToBase64,
} from '@holochain/client';
import { ResizeController } from '@lit-labs/observers/resize-controller.js';
import { provide } from '@lit/context';
import { localized, msg } from '@lit/localize';
import { mdiArrowLeft } from '@mdi/js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import { Router, hashState, wrapPathInSvg } from '@tnesh-stack/elements';
import '@tnesh-stack/elements/dist/elements/app-client-context.js';
import '@tnesh-stack/elements/dist/elements/display-error.js';
import { SignalWatcher } from '@tnesh-stack/signals';
import { EntryRecord } from '@tnesh-stack/utils';
import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { appStyles } from './app-styles.js';
import { isMobileContext } from './context.js';
import './friendzones/friendzones/elements/friendzones-context.js';
import './friendzones/friendzones/elements/timezone-prompt.ts';
import './home-page.js';
import './overlay-page.js';

export const MOBILE_WIDTH_PX = 600;

@localized()
@customElement('holochain-app')
export class HolochainApp extends SignalWatcher(LitElement) {
	@state()
	_loading = true;
	@state()
	_view = { view: 'main' };
	@state()
	_error: unknown | undefined;

	_client!: AppClient;

	router = new Router(this, [
		{
			path: '/',
			enter: () => {
				// Redirect to "/home/"
				this.router.goto('/home/');
				return false;
			},
		},
		{
			path: '/home/*',
			render: () =>
				html`<home-page
					@friend-requests-selected=${() =>
						this.router.goto('/friend-requests')}
					@profile-clicked=${() => this.router.goto('/my-profile')}
				></home-page>`,
		},
		{
			path: '/friend-requests',
			render: () =>
				html`<overlay-page
					icon="back"
					.title=${msg('My Friend Requests')}
					@close-requested=${() => this.router.goto('/home/')}
				>
					<sl-card>
						<friend-requests style="flex:1"> </friend-requests
					></sl-card>
				</overlay-page>`,
		},
		{
			path: '/my-profile',
			render: () =>
				html`<overlay-page
					.title=${msg('My Profile')}
					icon="back"
					@close-requested=${() => this.router.goto('/home/')}
				>
					<sl-card style="width: 600px;">
						<my-profile style="margin: 16px; flex: 1"></my-profile>
					</sl-card>
				</overlay-page>`,
		},
	]);

	@provide({ context: isMobileContext })
	@property()
	_isMobile: boolean = false;

	async firstUpdated() {
		new ResizeController(this, {
			callback: () => {
				this._isMobile = this.getBoundingClientRect().width < MOBILE_WIDTH_PX;
			},
		});

		try {
			this._client = await AppWebsocket.connect();
		} catch (e: unknown) {
			this._error = e;
		} finally {
			this._loading = false;
		}
	}

	render() {
		if (this._loading) {
			return html`<div
				class="row"
				style="flex: 1; height: 100%; align-items: center; justify-content: center;"
			>
				<sl-spinner style="font-size: 2rem"></sl-spinner>
			</div>`;
		}

		if (this._error) {
			return html`
				<div
					style="flex: 1; height: 100%; align-items: center; justify-content: center;"
				>
					<display-error
						.error=${this._error}
						.headline=${msg('Error connecting to holochain')}
					>
					</display-error>
				</div>
			`;
		}

		return html`
			<app-client-context .client=${this._client}>
				<notifications-context role="friendzones">
					<friends-context role="friendzones">
						<friendzones-context role="friendzones">
							<profile-prompt style="flex: 1;">
								<timezone-prompt style="flex: 1;">
									${this.router.outlet()}
								</timezone-prompt>
							</profile-prompt>
						</friendzones-context>
					</friends-context>
				</notifications-context>
			</app-client-context>
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
