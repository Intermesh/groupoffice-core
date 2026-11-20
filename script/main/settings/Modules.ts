import {ArrayUtil, comp, Panel, t, Window} from "@intermesh/goui";
import {AbstractSettingsPanel} from "./AbstractSettingsPanel.js";
import {userSettingsPanels} from "./UserSettingsWindow.js";
import {User} from "../../auth/index.js";
import {modules} from "../../Modules.js";

class Modules extends AbstractSettingsPanel {
	constructor() {
		super("modules", t("Modules"), "apps");

		this.cls = "fit scroll";

		this.items.add(
			comp({cls: "user-settings-modules"},
			...ArrayUtil.multiSort(moduleSettings.getPanels().map(e => {
				const p = new e.cmp;
				p.modulePackage = e.package;
				p.moduleName = e.name;
				return p;
			}), [{property: "title"}]))
		)
	}

	/**
	 * The panels the edited user has access to. The others are hidden.
	 */
	private allowedPanels: AppSettingsPanel[] = [];

	async load(user: User): Promise<any> {
		this.allowedPanels = this.findChildrenByType(AppSettingsPanel).filter(p => {
			if (p.isAllowed(user)) {
				return true;
			}
			p.hidden = true;
			return false;
		});

		return Promise.all(this.allowedPanels.map(p => {
			return p.load(user).catch(e => {
				console.error("Load error in module panel: ", p, e);
			});
		}));
	}

	/**
	 * Saves all module panels. Returns false when one of them failed so the window stays open.
	 */
	async save(): Promise<boolean> {
		const panels = this.allowedPanels,
			results = await Promise.allSettled(panels.map(p => p.save()));

		let success = true;
		results.forEach((r, i) => {
			if (r.status == "rejected") {
				void Window.error(r.reason);
			} else if (r.value !== false) {
				return;
			}
			success = false;
			// show the invalid fields
			panels[i].collapsed = false;
		});
		return success;
	}
}


export class AppSettingsPanel extends Panel {

	/**
	 * Package of the module that registered this panel
	 */
	public modulePackage?: string;

	/**
	 * Name of the module that registered this panel
	 */
	public moduleName?: string;

	constructor() {
		super();
		this.baseCls = 'panel app-settings-panel';
		this.collapsed = true;
		// this.collapsible = false;
	}

	/**
	 * Save the settings. Return false or throw an error when it failed, so the user settings window stays open.
	 */
	public async save() : Promise<any> {
		return Promise.resolve();
	}

	public async load(user:User) :Promise<any> {
		return Promise.resolve();
	}

	/**
	 * Check if this panel is shown for the user that is edited, which may be another user than the logged-in user.
	 *
	 * By default the edited user needs access to the module of the panel. Override it for another check, for example
	 * `return client.user.isAdmin;` for a panel that only administrators may use.
	 *
	 * @param user The edited user
	 */
	public isAllowed(user: User): boolean {
		if (!this.modulePackage || !this.moduleName) {
			return true;
		}
		return modules.isAvailable(this.modulePackage, this.moduleName, user);
	}
}


class ModuleSettings {
	private panels: {cmp: typeof AppSettingsPanel, package?: string, name?: string}[] = [];

	/**
	 * Add a panel to the "Modules" page of the user settings
	 *
	 * @param cmp The panel class
	 * @param pkg Package of the module. The panel is only shown for users that have access to the module.
	 * @param name Name of the module
	 */
	public addPanel(cmp: typeof AppSettingsPanel, pkg?: string, name?: string) {
		this.panels.push({cmp, package: pkg, name});
	}

	public getPanels() {
		return this.panels;
	}
}

export const moduleSettings = new ModuleSettings();

userSettingsPanels.add(Modules);
