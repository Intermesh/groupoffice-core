import {AbstractModuleSystemSettingsPanel} from "./AbstractModuleSystemSettingsPanel.js";
import {btn, colorfield, Component, comp, fieldset, t} from "@intermesh/goui";
import {systemSettingsPanels} from "./SystemSettingsWindow.js";

class Appearance extends AbstractModuleSystemSettingsPanel {

	constructor() {
		super("appearance", t("Appearance"), "core", "core");
		this.cls = "hbox";
	}

	protected formItems(): Component[] {
		return [
			// Light theme fieldset
			fieldset({},
				comp({
					tagName: "label",
					text: t("Light")
				}),

				// TODO: Logo upload field
				// comp({cls: "hbox"},
				// 	filefield({
				// 		name: "logoId",
				// 		buttonOnly: true,
				// 		accept: "image/*",
				// 		cls: "go-settings-logo",
				// 		height: 72,
				// 		listeners: {
				// 			change: ({newValue}) => {
				// 				if (newValue) {
				// 					field.el.style.backgroundImage = `url(${downloadUrl(newValue)})`;
				// 				} else {
				// 					field.el.style.removeProperty("background-image");
				// 				}
				// 			}
				// 		}
				// 	}),
				// 	btn({
				// 		icon: "delete",
				// 		title: t("Reset"),
				// 		handler: () => {
				// 			// Reset logo
				// 		}
				// 	})
				// ),

				this.createColorField("primaryColor", "Primary color", "--fg-main", "1652A1"),
				this.createColorField("secondaryColor", "Secondary color", "--c-primary", "00B0AD"),
				this.createColorField("tertiaryColor", "Tertiary color", "--c-secondary", "F3DB00"),
				this.createColorField("accentColor", "Accent color", "--c-accent", "FF7200")
			),

			// Dark theme fieldset
			fieldset({},
				comp({
					tagName: "label",
					text: t("Dark")
				}),

				// TODO: Logo upload field for dark theme
				// comp({cls: "hbox"},
				// 	filefield({
				// 		name: "logoIdDark",
				// 		buttonOnly: true,
				// 		accept: "image/*",
				// 		cls: "go-settings-logo",
				// 		height: 72,
				// 		listeners: {
				// 			change: ({newValue}) => {
				// 				if (newValue) {
				// 					field.el.style.backgroundImage = `url(${downloadUrl(newValue)})`;
				// 				} else {
				// 					field.el.style.removeProperty("background-image");
				// 				}
				// 			}
				// 		}
				// 	}),
				// 	btn({
				// 		icon: "delete",
				// 		title: t("Reset"),
				// 		handler: () => {
				// 			// Reset logo
				// 		}
				// 	})
				// ),

				this.createColorField("primaryDark", "Primary color", "--fg-main", "1652A1"),
				this.createColorField("secondaryDark", "Secondary color", "--c-primary", "00B0AD"),
				this.createColorField("tertiaryDark", "Tertiary color", "--c-secondary", "F3DB00"),
				this.createColorField("accentDark", "Accent color", "--c-accent", "FF7200")
			)
		];
	}

	private createColorField(name: string, label: string, property: string, defaultColor: string): Component {
		return colorfield({
			name: name,
			label: t(label),
			listeners: {
				change: ({newValue}) => {
					document.body.style.setProperty(property, '#' + (newValue || defaultColor));
				}
			}
		});
	}
}

systemSettingsPanels.add(Appearance);
