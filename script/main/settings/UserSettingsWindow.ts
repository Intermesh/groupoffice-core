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
import {customFields} from "../../customfields/index.js";
import {CustomFieldSetPanel} from "./CustomFieldSetPanel.js";

export class UserSettingsWindow extends Window {

	private cards: CardContainer;

	private _currentPasswordPrompt : Promise<string | undefined> | undefined;

	/**
	 * Ask for the current password once per save. Panels that save at the same time share the answer.
	 *
	 * Resolves to undefined when the user cancels the prompt.
	 */
	public currentPasswordPrompt() : Promise<string | undefined> {
		if(this._currentPasswordPrompt) {
			return this._currentPasswordPrompt;
		}
		this._currentPasswordPrompt = Window.prompt({
			fieldType: "password",
			inputLabel: t("Current password"),
			title: t("Enter password"),
			text: t("Your current password is required to save these changes")
		}).then(v => {
			if(!v) {
				// Cancelled, ask again on the next save
				this._currentPasswordPrompt = undefined;
				return undefined;
			}
			return v;
		});

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
			pnls.push(new p);
		}

		// User custom field sets shown as a tab get their own page. The others are in the account page.
		customFields.getFieldSets("User").filter(fs => fs.isTab).forEach(fs => {
			pnls.push(new CustomFieldSetPanel(fs));
		});

		pnls.forEach(panel => {
			panel.on("show", ({target}) => {
				if (target.itemId) {
					router.setPath("usersettings/" + target.itemId);
				}
			})
		});

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
			return p.filter(i => !i).length === 0;
		} catch(e) {
			void Window.error(e);
			return false;
		} finally {
			this._currentPasswordPrompt = undefined;
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

