import {btn, CardContainer, cardmenu, cards, comp, Component, t, tbar, Window} from "@intermesh/goui";
import {router} from "../../Router.js";
import {AbstractSystemSettingsPanel} from "./AbstractSystemSettingsPanel.js";
import {User} from "../../auth/index.js";
import {client} from "../../jmap/index.js";
import {settingsPanels} from "../settings/index.js";

class SystemSettingsWindow extends Window {

	private cards: CardContainer;
	constructor(selectedItemId:string|undefined, user:User = client.user) {
		super();
		this.title = t("System settings");

		this.maximized = true;
		this.maximizable = false;

		this.on("close", () => {
			router.setPath("");
		})

		const pnls : Component[] = [];

		for(const p of systemSettingsPanels.getPanels()) {
			const panel = new p;

			panel.on("show", ({target}) => {
				if (target.itemId) {
					router.setPath("systemsettings/" + target.itemId);
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
			const active = this.cards.findItem(selectedItemId)
			if(active) {
				this.cards.activeItem = active;
			}
		}

		this.on("render", () => {
			void this.load(user);
		})
	}

	public async save() {
		try {
			this.mask();
			await Promise.all(this.findChildrenByType(AbstractSystemSettingsPanel).map((i) => i.save()))
		} finally {
			this.unmask();
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

class SystemSettingsPanels  {
	private panels: typeof Component<any>[] = [];

	public add(cmp: typeof Component<any>) {

		this.panels.push(cmp);
	}

	public getPanels() {
		return this.panels;
	}
}

export const systemSettingsPanels = new SystemSettingsPanels();

router.add(/^systemsettings\/?([^\/]+)?/, (selectedItemId) => {
	const s = new SystemSettingsWindow(selectedItemId);
	s.show();
});