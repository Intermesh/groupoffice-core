import {
	browser,
	btn,
	checkbox,
	fieldset,
	InputFieldEventMap,
	Notifier,
	passwordfield,
	t,
	TextField,
	textfield
} from "@intermesh/goui";
import {client} from "../../../../jmap/index.js";
import {FormWindow} from "../../../../components/index.js";

export class OauthClientDialog extends FormWindow {
	private secretField: TextField<InputFieldEventMap>;

	constructor() {
		super("OauthClient");

		this.title = t("Client");
		this.maximizable = false;
		this.resizable = true;
		this.closable = true;
		this.width = 800;

		this.generalTab.items.add(
			fieldset({flex: 1},

				textfield({
					name: "name",
					label: t("Name"),
					required: true
				}),

				textfield({
					name: "identifier",
					label: t("Identifier"),
					required: true
				}),

				checkbox({
					name: 'isConfidential',
					label: t("Is confidential"),
					listeners: {
						setvalue: ({newValue}) => {
							this.secretField.disabled = !newValue;
							this.secretField.required = !this.form.currentId;
						}
					}
				}),

				this.secretField = passwordfield({
					disabled: true,
					autocomplete: 'new-password',
					name: "secret",
					label: t("Client secret")
				}),

				textfield({
					label: t("Redirect URI"),
					name: 'redirectUri',
					value: client.pageUrl("community/oidc/auth"),
					required: true
				})
			),


		);
	}

}

