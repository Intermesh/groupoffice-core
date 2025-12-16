import {
	avatar,
	btn,
	cardmenu,
	cards,
	comp,
	Component,
	h4,
	Menu,
	menu,
	searchbtn,
	t,
	tbar,
	Window
} from "@intermesh/goui";
import {modules} from "../Modules.js";
import {entities} from "../Entities.js";
import {ExtJSWrapper} from "../components/ExtJSWrapper.js";
import {router} from "../Router.js";
import {MainSearchWindow} from "./MainSearchWindow.js";
import {client} from "../jmap/index.js";

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

	private accountMenu?: Menu;


	private createAccountMenu() {
		return menu({
			isDropdown: true,
			removeOnClose: false
		},

			h4(client.user.displayName),

			"-",

			btn({
				icon: "account_circle",
				text: t("Account settings"),
				handler: () => {
					void router.goto("settings");
				}
			}),

			btn({
				icon: "settings",
				text: t("System settings"),
				handler: () => {
					void router.goto("systemsettings");
				}
			}),

			"-",

			btn({
				icon: "info",
				text: t("About"),
				handler: () => {
					void Window.alert(t("About"), "TODO")
				}
			}),

			btn({
				icon: "help",
				text: t("Documentation"),
				handler: () => {
					window.open("https://www.group-office.com/documentation.html", "_blank");
				}
			}),

			"-",

			btn({
				icon: "exit_to_app",
				text: t("Logout"),
				handler: async () => {
					await client.logout();
					document.location.reload();
				}
			})
			)
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
					btn({
						icon: "search",
						handler: () => {
							const m = new MainSearchWindow();
							m.show();
						}

					}),

					avatar({
						style: {cursor: "pointer"},
						listeners: {
							render: ({target}) => {
								target.displayName = client.user.displayName
								if(client.user.avatarId) {
									target.backgroundImage = client.downloadUrl(client.user.avatarId);
								}
								target.el.on("click", () => {
									if(!this.accountMenu) {
										this.accountMenu = this.createAccountMenu();
										this.accountMenu.alignTo = target.el;
									}

									this.accountMenu.show();


								})
							}

						}
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