import {collapsebtn, comp, Component, h4, p, Panel, panel, t, tbar} from "@intermesh/goui";
import {AbstractSettingsPanel} from "./AbstractSettingsPanel.js";
import {settingsPanels} from "./SettingsWindow.js";
import {User} from "../../auth/index.js";

class Apps extends AbstractSettingsPanel {
	constructor() {
		super("apps", t("Apps"));

		this.cls = "fit scroll";

		this.items.add(...appSettings.getPanels().map(p => new p))
	}

	async load(user: User): Promise<any> {
		return Promise.all(this.findChildrenByType(AppSettingsPanel).map(p => p.load(user)));
	}
}

export class AppSettingsPanel extends Panel {
	constructor() {
		super();
		this.cls = "card";
		this.collapsed = true;
	}

	public async save() : Promise<any> {
		return Promise.resolve();
	}

	public async load(user:User) :Promise<any> {
		return Promise.resolve();
	}
}


class AppSettings {
	private panels: typeof AppSettingsPanel[] = [];

	public addPanel(cmp: typeof AppSettingsPanel) {
		this.panels.push(cmp);
	}

	public getPanels() {
		return this.panels;
	}
}

export const appSettings = new AppSettings();

settingsPanels.add(Apps);