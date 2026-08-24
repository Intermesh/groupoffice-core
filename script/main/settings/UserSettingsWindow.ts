import {
	btn,
	CardContainer,
	cardmenu,
	cards,
	comp,
	Component,
	t,
	tbar,
	Window,
	router,
	i,
	ArrayUtil
} from "@intermesh/goui";
import {AbstractSettingsPanel} from "./AbstractSettingsPanel.js";
import {User} from "../../auth/index.js";
import {client} from "../../jmap/index.js";

export class UserSettingsWindow extends Window {

	private cards: CardContainer;

	private _currentPasswordPrompt : Promise<string> | undefined;

	public currentPasswordPrompt() : Promise<string> {
		if(this._currentPasswordPrompt) {
			return this._currentPasswordPrompt;
		}
		this._currentPasswordPrompt = Window.prompt({
			fieldType: "password",
			inputLabel: t("Current password"),
			title: t("Enter password"),
			text: t("Your current password is required to save these changes")
		}).then(v => {
			if(v) {
				return v;
			} else {
				return this.currentPasswordPrompt();
			}
		})

		return this._currentPasswordPrompt;
	}
	constructor(selectedItemId:string|undefined, user:User = client.user) {
		super();
		this.title = t("My Account");
		this.maximized = true;

		this.on("close", () => {
			router.setPath("");
		})

		const pnls : Component[] = [];

		for(const p of userSettingsPanels.getPanels()) {
			const panel = new p;

			panel.on("show", ({target}) => {
				if (target.itemId) {
					router.setPath("usersettings/" + target.itemId);
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
					this.cards = cards({flex:1, activeItem: -1},
						...pnls
					),
					tbar({cls : "border-top"},
						"->",
						btn({
							cls: "filled primary",
							text: t("Save"),
							handler: async () => {

								const success = await this.save();
								if(success) {
									this.close();
								}
							}
						})
					)
				)
			)
		)

		this.on("render", async () => {

			await this.load(user);

			if(selectedItemId) {
				const active = this.cards.findItem(selectedItemId)
				if(active) {
					this.cards.activeItem = active;
				}
			}
		})
	}

	/**
	 * Saves all settings panels. Returns true if all panels were saved successfully.
	 * @returns
	 */
	public async save() {
		try {
			this.mask();
			const p = await Promise.all(this.findChildrenByType(AbstractSettingsPanel).map((i) => i.save()))
			this._currentPasswordPrompt = undefined;
			return p.filter(i => !i).length === 0;
		} finally {
			this.unmask();
		}
	}

	public async load(user:User) {
		try {

			this.mask();

			if(user.id != client.user.id) {
				this.title = t("User") + ": " + user.displayName;
			}

			return Promise.all(
				this.findChildrenByType(AbstractSettingsPanel).map((panel) => {
					return panel.load(user).catch(e=> {
						console.error("Load error in ", panel, e);
					})
				}))

		} catch(e) {
			Window.error(e);
		} finally {
			this.unmask();
			if(this.cards.activeItem === -1) {
				this.cards.activeItem = 0;
			}
		}
	}


}

class UserSettingsPanels  {
	private panels: (new () => AbstractSettingsPanel)[] = [];

	public add(cmp: (new () => AbstractSettingsPanel)) {
		this.panels.push(cmp);
	}

	public getPanels() {
		return this.panels;
	}
}

export const userSettingsPanels = new UserSettingsPanels();

