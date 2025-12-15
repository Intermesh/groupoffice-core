import {AbstractModuleSystemSettingsPanel} from "./AbstractModuleSystemSettingsPanel.js";
import {checkbox, Component, fieldset, htmlfield, t, textfield} from "@intermesh/goui";
import {systemSettingsPanels} from "./SystemSettingsWindow.js";

class General extends AbstractModuleSystemSettingsPanel {

	private loginMessageField?: Component;

	constructor() {
		super("general", t("General"), "core", "core");
	}

	protected formItems(): Component[] {
		this.loginMessageField = htmlfield({
			name: "loginMessage",
			label: t("Login message"),
			hint: t("This message will show on the login screen"),
			disabled: true,
			height: 200
		});

		return [
			fieldset({},
				textfield({
					name: "title",
					label: t("Title"),
					hint: t("Used as page title and sender name for notifications")
				}),

				// TODO: Language combo with download button
				// this.languageCombo = combobox({...})

				textfield({
					name: "URL",
					label: t("URL"),
					hint: t("The full URL to GroupOffice.")
				})
			),

			fieldset({},
				checkbox({
					name: "maintenanceMode",
					label: t("Enable maintenance mode"),
					hint: t("When maintenance mode is enabled only administrators can login")
				}),

				checkbox({
					name: "loginMessageEnabled",
					label: t("Enable login message"),
					listeners: {
						change: ({newValue}) => {
							if (this.loginMessageField) {
								this.loginMessageField.disabled = !newValue;
							}
						}
					}
				}),

				this.loginMessageField
			)
		];
	}

	// TODO: Implement language export functionality
	// private async onExportLanguage() {
	// 	this.mask(t("Exporting..."));
	// 	try {
	// 		const response = await client.jmap("community/dev/Language/export", {
	// 			language: this.languageCombo.value
	// 		});
	// 		if (response.blobId) {
	// 			downloadBlob(response.blobId);
	// 		}
	// 	} finally {
	// 		this.unmask();
	// 	}
	// }
}

systemSettingsPanels.add(General);
