import {AbstractModuleSystemSettingsPanel} from "./AbstractModuleSystemSettingsPanel.js";
import {btn, colorfield, Component, comp, fieldset, t} from "@intermesh/goui";
import {systemSettingsPanels} from "./SystemSettingsWindow.js";
import {AbstractSystemSettingsPanel} from "./AbstractSystemSettingsPanel.js";
import {imagefield} from "../../components/index.js";

class Appearance extends AbstractModuleSystemSettingsPanel {

	constructor() {
		super("appearance", t("Appearance"),"core", "core", "palette");
		this.cls = "hbox";
	}

	protected formItems(): Component[] {
		return [
			// Light theme fieldset
			fieldset({flex: 1},
				comp({
					tagName: "label",
					text: t("Light")
				}),

				imagefield({
					name: "logoId",
					width: 200
				}),

				this.createColorField("primaryColor", "Primary color", "--fg-main", "1652A1"),
				this.createColorField("secondaryColor", "Secondary color", "--c-primary", "00B0AD"),
				this.createColorField("tertiaryColor", "Tertiary color", "--c-secondary", "F3DB00"),
				this.createColorField("accentColor", "Accent color", "--c-accent", "FF7200")
			),

			// Dark theme fieldset
			fieldset({flex: 1},
				comp({
					tagName: "label",
					text: t("Dark")
				}),

				imagefield({
					name: "logoIdDark",
					width: 200
				}),

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
