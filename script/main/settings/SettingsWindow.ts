import {
	btn,
	CardContainer,
	cardmenu,
	cards,
	comp,
	Component,
	h3,
	i,
	p,
	section,
	t,
	tbar,
	Window
} from "@intermesh/goui";
import {router} from "../../Router.js";
import {AbstractSettingsPanel} from "./AbstractSettingsPanel.js";

class SettingsWindow extends Window {

	private cards: CardContainer;
	constructor(selectedItemId:string|undefined) {
		super();
		this.title = t("Settings");
		this.maximized = true;
		this.maximizable = false;

		this.on("close", () => {
			history.back()
		})

		this.cls = "hbox fit";

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

			comp({cls: "hbox", flex: 1},
				cardmenu({
					tagName: "aside",
					cls:'bg-high scroll',
					width: 300
				}),
				this.cards = cards({flex:1},
					...pnls
				)
			),
			tbar({},
				"->",
				btn({
					text: t("Save"),
					handler: async () => {
						try {
							this.mask();
							await this.save();
							this.close();
						} finally {
							this.unmask();
						}

					}
				})
			)
		)

		if(selectedItemId) {
			const active = this.cards.findItem(selectedItemId)
			if(active) {
				this.cards.activeItem = active;
			}
		}
	}

	public async save() {
		return Promise.all(this.findChildrenByType(AbstractSettingsPanel).map((i) => i.save()))
	}


}

class SettingsPanels  {
	private panels: typeof Component<any>[] = [];

	public addPanel(cmp: typeof Component<any>) {

		this.panels.push(cmp);
	}

	public getPanels() {
		return this.panels;
	}
}

export const settingsPanels = new SettingsPanels();

router.add(/^settings\/?([^\/]+)?/, (selectedItemId) => {
	const s = new SettingsWindow(selectedItemId);
	s.show();
});