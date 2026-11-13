import {btn, comp, Component, Format, t, tbar, win, Window} from "@intermesh/goui";
import {client} from "../jmap/index.js";

/**
 * What the consent screen shows about an OAuth request, from api/oauth.php/consent
 */
export interface OAuthConsentDetails {
	clientId: string,
	clientName: string,
	/** Host the user is sent back to after the decision */
	redirectHost: string,
	/** The client runs on the user's own computer */
	localhostOnly: boolean,
	scopes: {name: string, description: string}[]
}

/**
 * A panel that a module adds to the consent screen for its scope
 */
export interface OAuthConsentPanel {
	component: Component,

	/**
	 * Data for the module, sent with the approval. The server passes it to the module's consent listener.
	 */
	getData(): any,

	/**
	 * Return false to keep the screen open, for example when the user must still pick something
	 */
	validate?(): boolean
}

export type OAuthConsentPanelFactory = (details: OAuthConsentDetails) => OAuthConsentPanel | Promise<OAuthConsentPanel>;

/**
 * Asks the user to approve an application that registered itself, like an AI assistant
 *
 * The web client opens it when api/oauth.php sends the user back with "?oauthConsent=1". The decision is posted to
 * api/oauth.php/authorize, which sends the user on to the application.
 */
class OAuthConsent {
	private factories: Record<string, OAuthConsentPanelFactory> = {};

	/**
	 * Add a panel for a scope, like the items an MCP client may read
	 */
	public registerPanel(scope: string, factory: OAuthConsentPanelFactory): void {
		this.factories[scope] = factory;
	}

	public async open(): Promise<void> {
		const response = await fetch(client.uri + "oauth.php/consent", {credentials: "same-origin"});
		if (!response.ok) {
			void Window.error(t("The authorization request expired. Please connect the application again."));
			return;
		}
		const details: OAuthConsentDetails = await response.json();

		const panels: {scope: string, panel: OAuthConsentPanel}[] = [];
		for (const scope of details.scopes) {
			if (this.factories[scope.name]) {
				panels.push({scope: scope.name, panel: await this.factories[scope.name](details)});
			}
		}

		const name = Format.htmlEncode(details.clientName);
		const host = Format.htmlEncode(details.redirectHost);

		let html = "<p>" + t("{name} wants to access your GroupOffice account.").replace("{name}", "<b>" + name + "</b>") + "</p>"
			+ "<p>" + t("It may:") + "</p><ul>"
			+ details.scopes.map(s => "<li>" + Format.htmlEncode(s.description) + "</li>").join("")
			+ "</ul><p>" + t("After your decision you are sent back to {host}.").replace("{host}", "<b>" + host + "</b>") + "</p>";

		if (details.localhostOnly) {
			html += "<p class=\"warning\">" + t("This application runs on your own computer. Only allow it if you started it yourself.") + "</p>";
		}

		const w = win({
				title: t("Connect {name}").replace("{name}", details.clientName),
				modal: true,
				closable: false,
				width: 640
			},
			comp({cls: "pad", html}),
			...panels.map(p => p.panel.component),
			tbar({},
				btn({
					text: t("Deny"),
					handler: () => this.submit("deny", {})
				}),
				"->",
				btn({
					text: t("Allow"),
					cls: "filled primary",
					handler: () => {
						const data: Record<string, any> = {};
						for (const p of panels) {
							if (p.panel.validate && !p.panel.validate()) {
								return;
							}
							data[p.scope] = p.panel.getData();
						}
						this.submit("approve", data);
					}
				})
			)
		);

		w.show();
	}

	/**
	 * A real form post, so the browser follows the redirect to the application
	 */
	private submit(decision: "approve" | "deny", data: Record<string, any>): void {
		const form = document.createElement("form");
		form.method = "POST";
		form.action = client.uri + "oauth.php/authorize";

		const fields: Record<string, string> = {
			decision,
			data: JSON.stringify(data),
			CSRFToken: client.session?.CSRFToken ?? ""
		};
		for (const name in fields) {
			const input = document.createElement("input");
			input.type = "hidden";
			input.name = name;
			input.value = fields[name];
			form.appendChild(input);
		}

		document.body.appendChild(form);
		form.submit();
	}
}

/**
 * The OAuth consent screen. Modules add panels for their scopes with registerPanel().
 */
export const oauthConsent = new OAuthConsent();
