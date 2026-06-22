import {
	avatar,
	btn,
	cardmenu,
	cards,
	comp,
	Component,
	ComponentEventMap,
	h4,
	Menu,
	menu,
	t,
	tbar,
	translate,
	Window,
	router
} from "@intermesh/goui";
import {entities} from "../Entities.js";
import {extjswrapper, ExtJSWrapper} from "../components/ExtJSWrapper.js";
import {MainSearchWindow} from "./MainSearchWindow.js";
import {client} from "../jmap/index.js";
import {Launcher} from "./Launcher.js";
import {Notifier} from "./Notifier";
import {MainPanelConfig} from "../Modules.js";


type MainPanel = {
	package: string
	module: string
	id: string
	title: string,
	pinned: number|undefined,
	callback: () => Component<any>,
	routes?: Record<string, any>
}


export interface MainPanelEventMap extends ComponentEventMap {
	mainpanelcreated: {panel:Component}
}
/**
 * Main view
 *
 * Top level component holding the main toolbar with logo and launcher and the module interfaces
 */
class Main extends Component<MainPanelEventMap> {
	private readonly menu
	private readonly container
	public readonly notifier: Notifier

	private mainPanels: Record<string,MainPanel> = {};

	constructor() {
		super();

		this.cls = "fit vbox main-container";

		this.container = cards({
			flex: 1
		});

		this.menu = cardmenu({
			flex: 1,
			cls: "main-menu",
			overflowMenu: false,
			cardContainer: this.container
		});

		this.notifier = new Notifier();

		// default route opens first module
		router.add(() => {
			const firstId = this.menu.items!.first()!.itemId + "";
			router.setPath(firstId);
			this.openPanel(firstId);
		});

	}

	private accountMenu?: Menu;


	private createAccountMenu() {
		return menu({isDropdown: true, removeOnClose: false},
			h4(client.user.displayName),
			"-",
			btn({icon: "account_circle", text: t("Account settings")}).on('click',() => {
				void router.goto("settings");
			}),
			btn({icon: "settings", text: t("System settings")}).on('click',() => {
				void router.goto("systemsettings");
			}),
			"-",
			btn({icon: "info", text: t("About")}).on('click',() => {
				void Window.alert(t("About"), "TODO")
			}),
			btn({icon: "help", text: t("Documentation")}).on('click',() => {
				window.open("https://www.group-office.com/documentation.html", "_blank");
			}),
			"-",
			btn({icon: "exit_to_app", text: t("Logout")}).on('click',async () => {
				await client.logout();
				document.location.reload();
			})
		);
	}

	// private getLauncher() {
	// 	return new Promise<Launcher>(resolve => {
	// 		if (!this._launcher) {
	// 			this._launcher = new Launcher();
	// 			root.items.add(this._launcher);
	// 			setTimeout(() => {
	// 				// give browser time to render menu and the animation can run
	// 				resolve(this._launcher!);
	// 			})
	// 		} else {
	// 			resolve(this._launcher);
	// 		}
	// 	})
	// }


	/**
	 * Load all module panels and sets up routes
	 */
	public load() {
		this.notifier.load();
		this.items.add(
			comp({cls: "header hbox"},
				comp({
					cls: "groupoffice-logo"
				}),
				this.menu,
				tbar({cls: "header-right"},
					this.notifier.btn,
					btn({icon: "search"}).on('click',() => {
						const m = new MainSearchWindow();
						m.show();
					}),

					btn({
						title: t("Launcher"),
						icon: "apps",
						menu: new Launcher()
					}),

					avatar({style: {cursor: "pointer"}}).on('render',({target}) => {
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
					})
				)
			),
			this.container
		);

		// Get all registered panels
		this.getMainPanels().forEach(async (m) => {
			// Add route to the panel
			router.add(new RegExp(`^${RegExp.escape(m.id)}$`), () => {
				return this.openPanel(m.id)
			});

			// Add button to the route
			if(m.pinned) {
				this.menu.items.add(
					btn({
						itemId: m.id,
						text: m.title,
						handler: () => {
							router.goto(m.id);
						}
					})
				);
			}
		});

		this.addLegacyDefaultRoutes();
	}

	/**
	 * Add a main panel that is accessible through the main menu and tabs
	 *

	 */
	public addMainPanel(pkg: string, module: string, panelCfg: Omit<MainPanelConfig<any>, "cmp"> & {id:string, callback: () => Component<any>}) {

		translate.setDefaultModule(pkg, module);

		// temporary
		let pinned = undefined;
		switch(module) {
			case 'email':
				pinned = 1;
			case 'calendar':
				pinned = 1;
			case 'addressbook':
				pinned = 1;
		}

		this.mainPanels[panelCfg.id] = {
			package: pkg,
			module: module,
			pinned: pinned,
			id: panelCfg.id,
			title: panelCfg.title,
			callback: panelCfg.callback,
			routes: panelCfg.routes
		};
	}


	public getMainPanels() {
		return Object.values(this.mainPanels);
	}


	public addLegacyMainpanel(pkg:string, module:string, title: string, panelClass:any, panelConfig?:any) {

		Ext.onReady(() => {

			if(!panelConfig) {
				panelConfig = {};
			}
			panelConfig.moduleName = module;

			panelConfig.id='go-module-panel-' + pkg + "-" + panelConfig.module;

			if(!panelConfig.cls)
				panelConfig.cls = 'go-module-panel';

			if(typeof panelClass == "string") {
				try {
					panelClass = GO.util.stringToFunction(panelClass);
				} catch(e) {
					console.error("Could not find class " + panelClass, e);
					return;
				}
			}

			if(!panelConfig.iconCls) {
				panelConfig.iconCls = panelClass.prototype.iconCls || "go-tab-icon-" + module;
			}

			this.addMainPanel(pkg, module, {
				id: module,
				title,
			 	callback: () => {

					return extjswrapper({
						cls: "fit",
						title: panelConfig.title,
						comp: new panelClass(panelConfig)
					});
				}
			})
		}, this, {delay:0})
	}

	/**
	 * Support default routes to legacy detail panels in extjs3
	 * @private
	 */
	private addLegacyDefaultRoutes() {
			//default route for legacy entities
		router.add(/([a-zA-Z0-9]*)\/([0-9]*)/, async (entity, id) => {

			const entityObj = entities.get(entity);
			if (!entityObj) {
				console.log("Entity (" + entity + ") not found in default entity route")
				return false;
			}

			const module = entityObj.module,
				mainPanel = main.getPanelById(module);

			if (!mainPanel || !(mainPanel instanceof ExtJSWrapper)) {
				return;
			}

			const detailViewName = entity.charAt(0).toLowerCase() + entity.slice(1) + "Detail";

			if (mainPanel.extJSComp.route) {
				mainPanel.show();
				mainPanel.extJSComp.route(id, entityObj);
			} else if (mainPanel.extJSComp[detailViewName]) {
				mainPanel.show();
				mainPanel.extJSComp[detailViewName][detailViewName].load(id);
				mainPanel.extJSComp[detailViewName][detailViewName].show();
			} else {
				console.log("Default entity route failed because " + detailViewName + " or 'route' function not found in mainpanel of " + module + ":", mainPanel);
				console.log(arguments);
			}
		});

	}

	public getPanelById(panelId:string) {

		const m = this.mainPanels[panelId];
		if (!m) {
			throw "notfound";
		}

		let cmp = this.container.findChild(panelId);
		if (!cmp) {
			cmp = m.callback();
			cmp.title = m.title;
			cmp.itemId = panelId;
			this.container.items.add(cmp);



			this.fire("mainpanelcreated", {panel:cmp})
		}

		return cmp;

	}

	public openPanel(panelId:string) {

		let cmp = this.getPanelById(panelId)

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

