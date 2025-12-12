import {Panel, t} from "@intermesh/goui";
import {AbstractSystemSettingsPanel} from "./AbstractSystemSettingsPanel.js";
import {systemSettingsPanels} from "./SystemSettingsWindow.js";
import {User} from "../../auth/index.js";
import {AppSettingsPanel} from "../settings/index.js";

class SystemSettingsApps extends AbstractSystemSettingsPanel {
	constructor() {
		super("apps", t("Apps"));

		this.cls = "fit scroll";

		this.items.add(...appSystemSettings.getPanels().map(p => new p))
	}

	async load(): Promise<any> {
		return Promise.all(this.findChildrenByType(AppSystemSettingsPanel).map(p => p.load()));
	}

	async save(): Promise<any> {
		return Promise.all(this.findChildrenByType(AppSystemSettingsPanel).map(p => p.save()));
	}
}


export class AppSystemSettingsPanel extends Panel {
	constructor() {
		super();
		this.baseCls = 'panel app-settings-panel';
		this.collapsed = true;
	}

	public async save() : Promise<any> {
		return Promise.resolve();
	}

	public async load() :Promise<any> {
		return Promise.resolve();
	}
}


class AppSystemSettings {
	private panels: typeof AppSystemSettingsPanel[] = [];

	public addPanel(cmp: typeof AppSystemSettingsPanel) {
		this.panels.push(cmp);
	}

	public getPanels() {
		return this.panels;
	}
}

export const appSystemSettings = new AppSystemSettings();

systemSettingsPanels.add(SystemSettingsApps);
