import {btn, cardmenu, cards, comp, Component, searchbtn, tbar} from "@intermesh/goui";
import {modules} from "../Modules.js";
import {entities} from "../Entities.js";
import {ExtJSWrapper} from "./ExtJSWrapper.js";
import {router} from "../Router.js";

router.newMainLayout = true;


class Main extends Component {
	private readonly menu;
	private readonly container;
	constructor() {
		super();

		this.cls = "fit vbox main-container";

		this.container = cards({
			flex: 1
		});

		this.menu = cardmenu({
			flex: 1,
			cls: "main-menu",
			overflowMenu: true,
			cardContainer: this.container
		});
	}

	/**
	 * Load all module panels and sets up routes
	 */
	public load() {
		this.items.add(
			comp({
					cls: "header hbox"
				},
				this.menu,
				tbar({},
					btn({
						icon: "notifications"
					}),
					searchbtn({
						overlayComponent: (btn) => {
							return btn.parent!.parent!;
						},
						icon: "search"
					}),
					btn({
						icon: "settings"
					})
				)
			),
			this.container
		);

		// Get all registered panels
		modules.getMainPanels().forEach(async (m) => {

			// Add route to the panel
			router.add(new RegExp(`^${RegExp.escape(m.id)}$`), () => {
				return this.openPanel(m.id)
			});

			// Add button to the route
			this.menu.items.add(
				btn({
					itemId: m.id,
					text: m.title,
					handler: () => {
						router.goto(m.id);
					}
				})
			);
			// }
		});

		this.addLegacyDefaultRoutes();
	}

	/**
	 * Support default routes to legacy detail panels in extjs3
	 * @private
	 */
	private addLegacyDefaultRoutes() {
		router.add(/([a-zA-Z0-9]*)\/([0-9]*)/, async (entity, id) => {

			const entityObj = entities.get(entity);
			if(!entityObj) {
				console.log("Entity ("+entity+") not found in default entity route")
				return false;
			}

			const detailViewName = entity.charAt(0).toLowerCase() + entity.slice(1) + "Detail";

			const mainPanelCmp = await this.openPanel(entityObj.package + "/" + entityObj.module) as ExtJSWrapper;

			if(!mainPanelCmp) {
				console.error("mainpanel not found!");
				return;
			}

			if (mainPanelCmp.extJSComp.route) {
				mainPanelCmp.extJSComp.route(id, entityObj);
			} else if(mainPanelCmp.extJSComp[detailViewName]) {
				mainPanelCmp.show();
				mainPanelCmp.extJSComp[detailViewName].load(id);
				mainPanelCmp.extJSComp[detailViewName].show();
			} else {
				console.log("Default entity route failed because " + detailViewName + " or 'route' function not found in mainpanel of " + entityObj.module + ":", mainPanelCmp);
				console.log(arguments);
			}
		});
	}

	public async openPanel(panelId:string) {

		const m = modules.getPanelById(panelId);
		if(!m) {
			throw "notfound";
		}

		let cmp = this.container.findChild(panelId);
		if(!cmp) {
			cmp = await m.callback();
			cmp.itemId = panelId;
			this.container.items.add(cmp);
		}


		//extjs3 panels have this func
		//@ts-ignore
		if(cmp.routeDefault) {
			//@ts-ignore
			cmp.routeDefault();
		}
		cmp.show();

		return cmp;
	}
}

export const main = new Main();