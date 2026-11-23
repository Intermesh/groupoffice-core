import {btn, CardContainer, cardmenu, cards, comp, Component, router, t, tbar, Window} from "@intermesh/goui";

import {AbstractSystemSettingsPanel} from "./AbstractSystemSettingsPanel.js";
import {User} from "../../auth/index.js";
import {client} from "../../jmap/index.js";
import {modules} from "../../Modules.js";

/**
 * Put the page of a settings window in the URL
 *
 * The first page that shows for "#systemsettings" replaces that URL, so the back button leaves the settings in one step.
 *
 * @param prefix "systemsettings" or "usersettings"
 * @param itemId the item ID of the page
 */
export function setPagePath(prefix: string, itemId: string | number) {
	if(router.getPath() === prefix) {
		history.replaceState(history.state, "", "#" + prefix + "/" + itemId);
	} else {
		router.setPath(prefix + "/" + itemId);
	}
}

export class SystemSettingsWindow extends Window {

	private cards: CardContainer;
	constructor(selectedItemId:string|undefined, user:User = client.user) {
		super();
		this.title = t("System settings");

		this.maximized = true;
		this.maximizable = false;

		this.on("close", () => {
			// Not when the back button or a link closed it, then the URL is the page to go to
			if(router.getPath().startsWith("systemsettings")) {
				router.setPath("");
			}
		})

		const pnls : Component[] = [];

		for(const p of systemSettingsPanels.getPanels()) {
			const panel = new p;

			panel.on("show", ({target}) => {
				if (target.itemId) {
					setPagePath("systemsettings", target.itemId);
				}
			})
			pnls.push(panel);
		}


		this.items.add(

			comp({cls: "hbox border-top", flex: 1},
				cardmenu({
					tagName: "aside",
					cls:'bg-high scroll',
					width: 300
				}),
				comp({flex:1, cls: "vbox"},
					this.cards = cards({flex:1},
						...pnls
					),
					tbar({cls : "border-top"},
						"->",
						btn({
							cls: "filled primary",
							text: t("Save"),
							handler: async () => {
								await this.save();
								this.close();
							}
						})
					)
				)
			)
		)

		if(selectedItemId) {
			this.selectItem(selectedItemId);
		}

		this.on("render", () => {
			void this.load(user);
		})
	}

	/**
	 * Show a settings page
	 *
	 * @param itemId the item ID of the panel
	 * @return false when there is no such page
	 */
	public selectItem(itemId: string): boolean {
		const active = this.cards.findItem(itemId);
		if(!active) {
			return false;
		}
		this.cards.activeItem = active;
		return true;
	}

	public async save() {
		const panels = this.findChildrenByType(AbstractSystemSettingsPanel),
			reload = panels.some(p => p.needsReload());
		try {
			this.mask();
			await Promise.all(panels.map((i) => i.save()))
		} finally {
			this.unmask();
		}

		if (reload) {
			// reload without the #systemsettings route so new settings like the title, logo and colours apply
			window.location.replace(window.location.pathname);
		}
	}

	public async load(user:User) {
		try {
			this.mask();
			return Promise.all(this.findChildrenByType(AbstractSystemSettingsPanel).map((i) => i.load()))
		} finally {
			this.unmask();
		}
	}


}


/**
 * Decides if the current user may see a system settings panel
 */
export type SystemSettingsPanelVisibility = () => boolean;

/**
 * Only administrators may see the panel. The default for system settings panels.
 */
export const adminOnly: SystemSettingsPanelVisibility = () => !!client.user?.isAdmin;

/**
 * Administrators and users with the given right on the core module may see the panel
 *
 * @param right eg. "mayChangeUsers"
 */
export const adminOrCoreRight = (right: string): SystemSettingsPanelVisibility => () => {
	return adminOnly() || !!modules.get("core", "core")?.userRights?.[right];
}

class SystemSettingsPanels  {
	private panels: {cmp: (new () => AbstractSystemSettingsPanel), visible: SystemSettingsPanelVisibility}[] = [];

	/**
	 * Add a system settings panel
	 *
	 * @param cmp The panel class
	 * @param visible Decides if the current user may see the panel. Only administrators by default.
	 */
	public add(cmp: (new () => AbstractSystemSettingsPanel), visible: SystemSettingsPanelVisibility = adminOnly) {
		this.panels.push({cmp, visible});
	}

	/**
	 * Get the panel classes the current user may see
	 */
	public getPanels()   {
		return this.panels.filter(p => p.visible()).map(p => p.cmp);
	}

	/**
	 * Check if the current user may see any system settings panel
	 */
	public hasVisiblePanels() : boolean {
		return this.panels.some(p => p.visible());
	}
}

export const systemSettingsPanels = new SystemSettingsPanels();


