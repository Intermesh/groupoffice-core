import {FormWindow} from "../FormWindow.js";
import {
	btn,
	checkbox,
	Config,
	createComponent,
	fieldset,
	numberfield,
	select,
	store,
	t,
	tbar,
	textfield,
	Window
} from "@intermesh/goui";
import {client} from "../../jmap/index.js";

export class SmtpAccountDialog extends FormWindow {
	constructor() {
		super("SmtpAccount");

		this.title = t("Server profile");

		this.width = 800;
		this.height = 600;
		this.resizable = true;
		this.maximizable = true;

		this.addSharePanel();

		this.generalTab.items.add(
			fieldset({},
				textfield({
					name: "fromName",
					label: t("From name"),
					required: true
				}),
				textfield({
					name: "fromEmail",
					label: t("From e-mail"),
					required: true
				}),
				textfield({
					name: "hostname",
					label: t("Hostname"),
					required: true
				}),
				numberfield({
					name: "port",
					label: t("Port"),
					decimals: 0,
					value: 587,
					required: true
				}),
				textfield({
					name: "username",
					label: t("Username"),
					autocomplete: "new-password"
				}),
				textfield({
					name: "password",
					label: t("Password"),
					type: "password",
					autocomplete: "new-password"
				}),
				select({
					name: "encryption",
					label: t("Encryption"),
					store: store({
						data: [
							{
								value: "tls",
								display: "TLS"
							},
							{
								value: "ssl",
								display: "SSL"
							},
							{
								value: null,
								display: "NONE"
							}
						]
					}),
					valueField: "value",
					value: "tls",
					textRenderer: v => {
						return v.display
					},
					listeners: {
						change: (field,newValue,oldValue) => {
							this.form.findField("verifyCertificate")!.disabled = newValue == null
						}
					}
				}),
				checkbox({
					name: "verifyCertificate",
					label: t("Verify certificate"),
					value: true,
					disabled: false
				}),
				numberfield({
					name: "maxMessagesPerMinute",
					label: t("Max messages per minute"),
					hint: t("Set a maximum number of messages per minute. Entering a zero value will disable this value."),
					decimals: 0,
					value: 0,
					min: 0,
					required: true
				}),
				tbar({},
					btn({
						text: t("Send test message"),
						handler: () => {
							this.mask();

							client.jmap("SmtpAccount/test", this.form.value).then(() => {
								Window.alert(
									t("A message was sent successfully to {email}").replace("{email}", this.form.value.fromEmail),
									t("Success")
								);
							}).catch((response) => {
								Window.alert(
									t("Failed to send message to {email}").replace("{email}", this.form.value.fromEmail) + "<br/><br/>" + response.message,
									t("Failed")
								)
							}).finally(() => {
								this.unmask();
							});
						}
					})
				)
			)
		)
	}
}

export const smtpaccountdialog = (config: Config<SmtpAccountDialog>) => createComponent(new SmtpAccountDialog(), config);

