import {Component, t} from "@intermesh/goui";
import {AbstractSettingsPanel} from "./AbstractSettingsPanel.js";
import {settingsPanels} from "./SettingsWindow.js";

class Apps extends AbstractSettingsPanel {
	constructor() {
		super("apps", t("Apps"));
	}
}

settingsPanels.addPanel(Apps);