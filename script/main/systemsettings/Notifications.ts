import {AbstractModuleSystemSettingsPanel} from "./AbstractModuleSystemSettingsPanel.js";
import {btn, checkbox, Component, fieldset, numberfield, select, t, TextField, textfield, tbar} from "@intermesh/goui";
import {systemSettingsPanels} from "./SystemSettingsWindow.js";
import {client} from "../../jmap/index.js";

class Notifications extends AbstractModuleSystemSettingsPanel {

	private verifyCertField?: Component;
	private systemEmailField?: TextField;

	constructor() {
		super("notifications", t("Notifications"), "core", "core");
	}

	protected formItems(): Component[] {
		this.verifyCertField = checkbox({
			name: "smtpEncryptionVerifyCertificate",
			label: t("Verify SSL certificate"),
			value: true
		});

		this.systemEmailField = textfield({
			name: "systemEmail",
			label: t("System e-mail"),
			required: true
		});

		return [
			fieldset({
					title: t("Outgoing E-mail (SMTP)")
				},

				this.systemEmailField,

				textfield({
					name: "smtpHost",
					label: t("Hostname"),
					value: "localhost",
					required: true
				}),

				numberfield({
					name: "smtpPort",
					label: t("Port"),
					value: 587,
					decimals: 0
				}),

				textfield({
					name: "smtpUsername",
					label: t("Username")
				}),

				textfield({
					name: "smtpPassword",
					label: t("Password"),
					type: "password"
				}),

				select({
					name: "smtpEncryption",
					label: t("Encryption"),
					value: "tls",
					options: [
						{value: "tls", name: "TLS"},
						{value: "ssl", name: "SSL"},
						{value: null, name: t("None")}
					],
					listeners: {
						change: ({newValue}) => {
							if (this.verifyCertField) {
								this.verifyCertField.disabled = (newValue == null);
							}
						}
					}
				}),

				this.verifyCertField,

				numberfield({
					name: "smtpTimeout",
					label: t("Timeout (s)"),
					value: 30,
					decimals: 0
				}),

				tbar({},
					btn({
						text: t("Send test message"),
						handler: () => this.sendTestMessage()
					})
				)
			)
		];
	}

	async load(): Promise<any> {
		await super.load();
		// Note: The verify cert field disabled state is handled by the change listener on the encryption field
	}

	private async sendTestMessage() {
		this.mask(t("Sending..."));
		try {
			// TODO: Get form values properly from datasourceform
			const formValues = {}; // this.getFormValues();
			const response = await client.jmap("core/Settings/sendTestMessage", formValues);

			if (!response.success) {
				throw response;
			}

			// TODO: Use proper alert/confirm dialogs when available
			alert(t("A message was sent successfully to {email}").replace('{email}', this.systemEmailField?.value || ""));
		} catch (error: any) {
			const errorMsg = error.message ? "\n\n" + error.message : "";
			alert(t("Failed to send message to {email}").replace('{email}', this.systemEmailField?.value || "") + errorMsg);
		} finally {
			this.unmask();
		}
	}
}

systemSettingsPanels.add(Notifications);
