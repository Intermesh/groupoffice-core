import {Component, t} from "@intermesh/goui";
import {AbstractSettingsPanel} from "./AbstractSettingsPanel.js";
import {settingsPanels} from "./SettingsWindow.js";

class Appearance extends AbstractSettingsPanel {
	constructor() {
		super("appearance", t("Appearance"));

	}
}

settingsPanels.addPanel(Appearance);