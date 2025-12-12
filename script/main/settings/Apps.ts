import {Panel, t} from "@intermesh/goui";
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

	async save(): Promise<any> {
		return Promise.all(this.findChildrenByType(AppSettingsPanel).map(p => p.save()));
	}
}


export class AppSettingsPanel extends Panel {
	constructor() {
		super();
		this.baseCls = 'panel app-settings-panel';
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
