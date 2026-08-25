import {ArrayUtil, comp, Panel, t} from "@intermesh/goui";
import {AbstractSettingsPanel} from "./AbstractSettingsPanel.js";
import {userSettingsPanels} from "./UserSettingsWindow.js";
import {User} from "../../auth/index.js";

class Modules extends AbstractSettingsPanel {
	constructor() {
		super("modules", t("Modules"), "apps");

		this.cls = "fit scroll";

		this.items.add(
			comp({cls: "user-settings-modules"},
			...ArrayUtil.multiSort(moduleSettings.getPanels().map(p => new p), [{property: "title"}]))
		)
	}

	async load(user: User): Promise<any> {
		return Promise.all(this.findChildrenByType(AppSettingsPanel).map(p => {
			return p.load(user).catch(e => {
				console.error("Load error in module panel: ", p, e);
			});
		}));
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
		// this.collapsible = false;
	}

	public async save() : Promise<any> {
		return Promise.resolve();
	}

	public async load(user:User) :Promise<any> {
		return Promise.resolve();
	}
}


class ModuleSettings {
	private panels: typeof AppSettingsPanel[] = [];

	public addPanel(cmp: typeof AppSettingsPanel) {
		this.panels.push(cmp);
	}

	public getPanels() {
		return this.panels;
	}
}

export const moduleSettings = new ModuleSettings();

userSettingsPanels.add(Modules);
