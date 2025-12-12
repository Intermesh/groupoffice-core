import {collapsebtn, comp, Component, h4, t, tbar} from "@intermesh/goui";
import {AbstractSettingsPanel} from "./AbstractSettingsPanel.js";
import {settingsPanels} from "./SettingsWindow.js";

class Apps extends AbstractSettingsPanel {
	constructor() {
		super("apps", t("Apps"));


		this.items.add(comp({

		},
			tbar({},
				h4("Address book"), "->", collapsebtn({target: btn => btn.parent!.parent!})
				)))
	}
}

settingsPanels.addPanel(Apps);