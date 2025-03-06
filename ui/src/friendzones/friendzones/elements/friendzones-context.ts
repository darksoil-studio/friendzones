import { AppClient } from "@holochain/client";
import { consume, provide } from "@lit/context";
import { appClientContext } from "@tnesh-stack/elements";
import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import { friendzonesStoreContext } from "../context.js";
import { FriendzonesClient } from "../friendzones-client.js";
import { FriendzonesStore } from "../friendzones-store.js";

/**
 * @element friendzones-context
 */
@customElement("friendzones-context")
export class FriendzonesContext extends LitElement {
  @consume({ context: appClientContext })
  private client!: AppClient;

  @provide({ context: friendzonesStoreContext })
  @property({ type: Object })
  store!: FriendzonesStore;

  @property()
  role!: string;

  @property()
  zome = "friendzones";

  connectedCallback() {
    super.connectedCallback();
    if (this.store) return;
    if (!this.role) {
      throw new Error(
        `<friendzones-context> must have a role="YOUR_DNA_ROLE" property, eg: <friendzones-context role="role1">`,
      );
    }
    if (!this.client) {
      throw new Error(`<friendzones-context> must either:
        a) be placed inside <app-client-context>
          or 
        b) receive an AppClient property (eg. <friendzones-context .client=\${client}>) 
          or 
        c) receive a store property (eg. <friendzones-context .store=\${store}>)
      `);
    }

    this.store = new FriendzonesStore(new FriendzonesClient(this.client, this.role, this.zome));
  }

  render() {
    return html`<slot></slot>`;
  }

  static styles = css`
    :host {
      display: contents;
    }
  `;
}
