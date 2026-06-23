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
	router, hr, ComponentState, p
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


	/**
	 * Pinned panels will show in the tab bar when loading
	 *
	 * @private
	 */
	private pinned:string[] = ["summary", "email", "calendar", "tasks", "addressbook", "files"];
	private launcher?: Launcher;

	constructor() {
		super();

		this.cls = "fit vbox main-container";
		this.stateId = "groupoffice-main";

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

	protected buildState(): ComponentState {
		const s = super.buildState();

		s.pinned = this.pinned;

		return s;
	}

	protected restoreState(state: ComponentState) {
		super.restoreState(state);

		if(state.pinned) {
			this.pinned = state.pinned;
		}

		console.log(this.pinned);
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

	/**
	 * Load all module panels and sets up routes
	 */
	public load() {

		main.initState();

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
						menu: this.launcher = new Launcher()
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
		this.getPanels().forEach(async (m) => {
			// Add route to the panel
			router.add(new RegExp(`^${RegExp.escape(m.id)}$`), () => {
				return this.openPanel(m.id)
			});

			// Add button to the route
			if(this.pinned.indexOf(m.id) !== -1) {
				this.addPanelMenuItem(m);
			}
		});

		this.menu.items.add(hr({itemId: "pinned-plitter"}));

		this.addLegacyDefaultRoutes();

		// this.setPanelBadge("email", 6);
	}

	private addPanelMenuItem(m: MainPanel) {

		const menuItem = comp({cls: "pinned-item", itemId: m.id},
			btn({

				text: m.title,
				handler: () => {
					router.goto(m.id);
				}
			}),

			btn({
				cls: "menu small",
				icon: "more_vert",
				menu: menu({
						listeners: {
							show: ({target}) => {
								const pinned = this.pinned.indexOf(m.id) !== -1;

								target.findChild("pin")!.hidden = pinned;
								target.findChild("unpin")!.hidden = !pinned;
							}
						}
					},
					btn({
						itemId: "pin",
						icon: "keep",
						text: t("Pin"),
						handler: () => {
							this.pinned.push(m.id);
							this.saveState();

							menuItem.remove();

							const i = this.menu.findItemIndex("pinned-plitter");

							this.menu.items.insert(i, menuItem);
						}
					}),
					btn({
						itemId: "unpin",
						icon: "keep_off",
						text: t("Unpin"),
						handler: () => {
							this.pinned = this.pinned.filter(p => p !== m.id)
							this.saveState();

							menuItem.remove();

							this.menu.items.add(menuItem);
						}
					}),
					btn({
						itemId: "close",
						icon: "close",
						text: t("Close"),
						handler: (btn => {
							this.pinned = this.pinned.filter(p => p !== m.id)
							this.saveState();
							menuItem.remove();
						})
					})

				)
			}),

			comp({cls: "goui-badge", hidden:true, itemId: "badge"})

		);
		this.menu.items.add(menuItem);
	}

	/**
	 * Add a main panel that is accessible through the main menu and tabs
	 *

	 */
	public addPanel(pkg: string, module: string, panelCfg: Omit<MainPanelConfig<any>, "cmp"> & {id:string, callback: () => Component<any>}) {

		translate.setDefaultModule(pkg, module);

		this.mainPanels[panelCfg.id] = {
			package: pkg,
			module: module,
			id: panelCfg.id,
			title: panelCfg.title,
			callback: panelCfg.callback,
			routes: panelCfg.routes
		};
	}


	/**
	 * Get all panels registered by the modules
	 */
	public getPanels() {
		return Object.values(this.mainPanels);
	}


	public addLegacyPanel(pkg:string, module:string, title: string, panelClass:any, panelConfig?:any) {

		Ext.onReady(() => {

			if(!panelConfig) {
				panelConfig = {};
			}
			panelConfig.moduleName = module;

			panelConfig.id='go-module-panel-' + pkg + "-" + module;

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

			panelConfig.header = false;

			this.addPanel(pkg, module, {
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

			if (!entities.exists(entity)) {
				console.log("Entity (" + entity + ") not found in default entity route")

				// fallback on old router
				go.Router.check();

				return false;
			}

			const entityObj = entities.get(entity);

			const module = entityObj.module,
				mainPanel = main.getPanelById(module);

			if (!mainPanel || !(mainPanel instanceof ExtJSWrapper)) {
				// fallback on old router
				go.Router.check();
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

				// fallback on old router
				go.Router.check();
			}
		});

		router.add(() => {
			// fallback on legacy router
			go.Router.check();
		})

	}


	/**
	 * Get panel by ID
	 *
	 * This method will also create an instance of registered panels it's not created yet.
	 *
	 * @param panelId
	 */
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

			if(!this.menu.findItem(panelId)) {
				this.addPanelMenuItem(m);
			}

			this.container.items.add(cmp);

			this.fire("mainpanelcreated", {panel:cmp})
		}

		return cmp;

	}


	/**
	 * Open a panel
	 * @param panelId
	 */
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

	public setPanelBadge(panelId:string, count:number|undefined) {
		this.launcher!.setBadge(panelId, count);

		const pinned = this.menu.findChild(panelId);

		if(pinned) {
			const badge = pinned.findChild("badge")!;
			badge.text = count?.toString() ?? "";
			badge.hidden = !count;
		}
	}
}

export const main = new Main();


