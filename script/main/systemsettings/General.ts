import {AbstractModuleSystemSettingsPanel} from "./AbstractModuleSystemSettingsPanel.js";
import {btn, checkbox, comp, Component, fieldset, htmlfield, t, textfield, Window} from "@intermesh/goui";
import {systemSettingsPanels} from "./SystemSettingsWindow.js";
import {AbstractSystemSettingsPanel} from "./AbstractSystemSettingsPanel.js";
import {LanguageField, languagefield} from "../../components/index.js";
import {client} from "../../jmap/index.js";
import {callback} from "chart.js/helpers";

class General extends AbstractModuleSystemSettingsPanel {

	private loginMessageField?: Component;
	private languageFld!: LanguageField;

	constructor() {
		super("general", t("General"), "core", "core", "description");
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
			fieldset({width: 400},
				textfield({
					name: "title",
					label: t("Title"),
					hint: t("Used as page title and sender name for notifications")
				}),

				comp({cls: "hbox gap", style: {alignItems: "start"}},
					this.languageFld = languagefield({
						flex: 1,
						hint: t("The language is automatically detected from the browser. If the language is not available then this language will be used.")
					}),
					btn({
						icon: "download",
						title: t("Download spreadsheet to translate"),
						handler: async () => {
							this.mask();

							try {
								const response = await client.jmap("community/dev/Language/export",
									{
										language: this.languageFld.value
									});

								void client.downloadBlobId(response.blobId, "lang_" + this.languageFld.value + ".csv");
							} catch (e) {
								void Window.error(e);
							} finally {
								this.unmask();
							}

						}
					})
				),

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
