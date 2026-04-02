import {btn, CardContainer, cardmenu, cards, comp, Component, t, tbar, Window} from "@intermesh/goui";
import {router} from "../../Router.js";
import {AbstractSettingsPanel} from "./AbstractSettingsPanel.js";
import {User} from "../../auth/index.js";
import {client} from "../../jmap/index.js";
import {OPS} from "pdfjs-dist";
import save = OPS.save;

export class SettingsWindow extends Window {

	private cards: CardContainer;
	constructor(selectedItemId:string|undefined, user:User = client.user) {
		super();
		this.title = t("My Account");
		this.width = 1100;
		this.height = 800;
		this.resizable = true;

		this.on("close", () => {
			router.setPath("");
		})

		const pnls : Component[] = [];

		for(const p of settingsPanels.getPanels()) {
			const panel = new p;

			panel.on("show", ({target}) => {
				if (target.itemId) {
					router.setPath("settings/" + target.itemId);
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

		if(selectedItemId) {
			const active = this.cards.findItem(selectedItemId)
			if(active) {
				this.cards.activeItem = active;
			}
		}

		this.on("render", () => {
			void this.load(user);
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
		} finally {
			this.unmask();
		}
	}

	public async load(user:User) {
		try {
			this.mask();
			return Promise.all(this.findChildrenByType(AbstractSettingsPanel).map((i) => i.load(user)))
		} finally {
			this.unmask();
		}
	}


}

class SettingsPanels  {
	private panels: (new () => AbstractSettingsPanel)[] = [];

	public add(cmp: (new () => AbstractSettingsPanel)) {

		this.panels.push(cmp);
	}

	public getPanels() {
		return this.panels;
	}
}

export const settingsPanels = new SettingsPanels();

if(router.newMainLayout) {
	router.add(/^settings\/?([^\/]+)?/, (selectedItemId) => {
		const s = new SettingsWindow(selectedItemId);
		s.show();
	});
}