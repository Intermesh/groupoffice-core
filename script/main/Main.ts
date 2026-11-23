import {
	ArrayUtil,
	avatar,
	btn, Button,
	cardmenu,
	cards,
	comp,
	Component,
	ComponentEventMap,
	ComponentState,
	h4,
	hr,
	Menu,
	menu,
	p,
	router,
	sortable,
	t,
	tbar,
	translate,
	Window
} from "@intermesh/goui";
import {entities} from "../Entities.js";
import {extjswrapper, ExtJSWrapper} from "../components/ExtJSWrapper.js";
import {MainSearchWindow} from "./MainSearchWindow.js";
import {client} from "../jmap/index.js";
import {Launcher} from "./Launcher.js";
import {Notifier} from "./Notifier";
import {MainPanelConfig, modules} from "../Modules.js";
import {customFields} from "../customfields/index.js";
import {authManager, oauthConsent, RecoveryWindow} from "../auth/index.js";
import {AbstractSystemSettingsPanel, ModuleInfo, systemSettingsPanels, SystemSettingsWindow} from "./systemsettings/index.js";
import {ModuleDialog} from "./systemsettings/ModuleDialog.js";
import {UserSettingsWindow} from "./settings/index.js";
import {AboutWindow} from "./AboutWindow.js";
import {LicenseWindow} from "./LicenseWindow.js";
import {watchOnlineStatus, welcome} from "./StartupDialogs.js";


type MainPanelCreator = {
	package: string
	module: string
	id: string
	title: string,
	callback: () => Component<any>,
	routes?: Record<string, any>
}


export interface MainPanelEventMap extends ComponentEventMap {
	mainpanelcreated: {panel: Component}

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

	private panelConfigs: Record<string, MainPanelCreator> = {};


	/**
	 * Pinned panels will show in the tab bar when loading
	 *
	 * @private
	 */
	private pinned:string[] = ["summary", "email", "calendar", "tasks", "addressbook", "files"];
	private launcher?: Launcher;

	/**
	 * Badge counts per panel. Modules may set them before the launcher or the menu item of the panel exists.
	 */
	private badges: Record<string, number|undefined> = {};

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

		sortable({
			component: this.menu,
			sortableChildSelector: ".sortable",
			dropBetween: true,
			horizontal: true,
			updateDom: false,
			listeners: {
				sort: ({fromIndex, toIndex}) =>
				{

					this.menu.items.move(fromIndex, toIndex);

					//everything left from the splitter is pinned
					const splitter = this.menu.findItemIndex("pinned-splitter");
					const pins = this.menu.items.all().slice(0, splitter);
					this.pinned = pins.map(p => p.itemId.toString());
					this.saveState();
				}
			}
		}).connect();

		this.notifier = new Notifier();

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
		} else {
			const coreMod = modules.get("core", "core");

			if(coreMod?.settings.defaultPinnedTabs.length ) {
				this.pinned = coreMod?.settings.defaultPinnedTabs;
			}
		}

		console.log(this.pinned);
	}

	private accountMenu?: Menu;


	private createAccountMenu() {
		return menu({isDropdown: true, removeOnClose: false},
			h4(client.user.displayName),
			"-",
			btn({icon: "account_circle", text: t("Account settings")}).on('click',() => {
				void router.goto("usersettings");
			}),
			btn({icon: "settings", text: t("System settings"), hidden: !systemSettingsPanels.hasVisiblePanels()}).on('click',() => {
				void router.goto("systemsettings");
			}),
			btn({
				icon: "app_registration",
				text: t("Register"),
				// Not when the license is set in the configuration file
				hidden: !client.user.isAdmin || (modules.get("core", "core")?.settings.readOnlyKeys ?? []).indexOf("license") > -1
			}).on('click',() => {
				new LicenseWindow().show();
			}),
			"-",
			// The "hideAbout" config option hides it for users that aren't administrators
			btn({icon: "info", text: t("About"), hidden: !!GO.settings?.config?.hideAbout && !client.user.isAdmin}).on('click',() => {
				const aboutWin = new AboutWindow();
				aboutWin.show();
			}),
			btn({icon: "help", text: t("Documentation")}).on('click',() => {
				window.open("https://www.group-office.com/documentation.html", "_blank");
			}),
			"-",
			btn({icon: "exit_to_app", text: t("Logout")}).on('click',() => {
				void authManager.logout();
			})
		);
	}

	/**
	 * Boots groupoffice
	 *
	 * 1. Loads available JS client modules / capabitities from server
	 * 2. User authenticates
	 * 3. Load custom fields and modules
	 * 4. Populate main UI
	 */
	public async boot() {

		// Loads all module scripts before authentication
		await modules.loadCapabilities();

		await this.openPasswordRecovery();

		// Authenticate
		await authManager.requireLogin();

		// api/oauth.php sends the user here to log in. Continue the authorization of the application.
		const urlParams = new URLSearchParams(location.search);
		if(urlParams.has("oauthAuthorize")) {
			location.replace(BaseHref + "api/oauth.php/authorize");
			// don't build the UI while the browser leaves
			return new Promise<void>(() => {});
		}

		// The pinned tabs are stored per user, so the next user of a shared browser doesn't get them
		this.stateId = "groupoffice-main-" + client.user.id;
		main.initState();

		void this.notifier.load();

		void client.startSSE();

		this.items.add(
			comp({cls: "header hbox"},
				comp({
					cls: "groupoffice-logo"
				}),
				this.menu,
				tbar({cls: "header-right"},
					this.notifier.btn,
					btn({icon: "search", title: t("Search") + " (" + (navigator.platform.startsWith("Mac") ? "⌘ + ⇧" : "CTRL + SHIFT") + " + F)"}).on('click',() => {
						this.search();
					}),

					btn({
						title: t("Launcher") + " (" + (navigator.platform.startsWith("Mac") ? "⌘ + ⇧" : "CTRL + SHIFT") + " + M)",
						icon: "apps",
						menu: this.launcher = this.createLauncher()
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
								// Otherwise it stays open over the page of a link or the back button
								router.on("change", () => this.accountMenu!.hide());
							}

							this.accountMenu.show();
						})
					})
				)
			),
			this.container
		);




		this.pinned.forEach((panelId) => {
			if(this.panelConfigs[panelId]) {
				this.addPanelMenuItem(this.panelConfigs[panelId]);
			}
		})

		this.menu.items.add(hr({itemId: "pinned-splitter", cls: "sortable"}));

		this.openDefaultPanel();

		this.setupRoutes();

		this.preventFileDropNavigation();

		watchOnlineStatus();

		// api/oauth.php asks the user to approve an application that registered itself. Modules have registered their
		// consent panels when their scripts loaded.
		if(urlParams.has("oauthConsent")) {
			void oauthConsent.open();
		} else {
			void welcome();
		}

		document.addEventListener("keydown", ev => {
			if(!(ev.ctrlKey || ev.metaKey) || ev.altKey) {
				return;
			}
			const key = ev.key.toLowerCase();
			if(ev.shiftKey && key == "f") {
				ev.preventDefault();
				this.search();
			} else if(ev.shiftKey && key == "m") {
				ev.preventDefault();
				this.launcher!.show();
			} else if(!ev.shiftKey && key == "p") {
				if(this.printActivePanel()) {
					ev.preventDefault();
				}
			}
		});

	}

	/**
	 * TEMPORARY: runs the legacy function of a "?f=" link, until these links are replaced by normal routes.
	 *
	 * GO::createExternalUrl() creates these links, for example to a ticket in a notification e-mail, for
	 * links/openModelLink and for the mailto handler that opens the e-mail composer. "f" is base64 encoded JSON with
	 * the module "m", the function "f" and the parameter "p". Only the functions in the list below may be called,
	 * because anyone can send a user such a link.
	 *
	 * Call it after the router started, so the default route doesn't replace what the function opens.
	 */
	public runExternalFunction() {
		const allowed: Record<string, string[]> = {
			tickets: ["showTicket"],
			links: ["openModelLink"],
			email: ["showComposer"]
		};

		const url = new URL(location.href);
		const f = url.searchParams.get("f");
		if(!f) {
			return;
		}

		// Remove it so a reload doesn't run it again
		url.searchParams.delete("f");
		history.replaceState(history.state, "", url.toString());

		let fp: {m: string, f: string, p: any};
		try {
			// a "+" that wasn't URL encoded becomes a space
			const bytes = Uint8Array.from(atob(f.replace(/ /g, "+")), c => c.charCodeAt(0));
			fp = JSON.parse(new TextDecoder().decode(bytes));
		} catch(e) {
			console.error("Invalid external function", e);
			return;
		}

		if(!fp || !Object.hasOwn(allowed, fp.m) || !allowed[fp.m].includes(fp.f)) {
			console.error("External function not allowed", fp);
			return;
		}

		const fn = GO[fp.m]?.[fp.f];
		if(typeof fn != "function") {
			// The module isn't available to this user
			return;
		}

		fn.call(window, fp.p);
	}

	/**
	 * Print the active module panel, if it supports printing
	 *
	 * @return true when the panel printed
	 */
	private printActivePanel(): boolean {
		const pnl = this.container.activeItemComponent as any;
		if(!pnl) {
			return false;
		}

		// GOUI panels and legacy ExtJS panels with a print() function
		const ext = pnl instanceof ExtJSWrapper ? pnl.extJSComp : undefined,
			printable = ext ?? pnl;

		if(typeof printable.print == "function") {
			printable.print();
			return true;
		}

		// Legacy panels print their detail view
		const detail = ext?.findByType?.("displaypanel")[0];
		if(detail) {
			detail.print();
			return true;
		}

		return false;
	}

	private createLauncher() {
		const launcher = new Launcher();
		for(const panelId in this.badges) {
			launcher.setBadge(panelId, this.badges[panelId]);
		}
		return launcher;
	}

	/**
	 * The password recovery e-mail links to "#recover/<hash>". It opens before the login, because the user can't log in.
	 */
	private async openPasswordRecovery() {
		const match = /^#?recover\/([a-f0-9]{40})-?(.*)/.exec(location.hash);
		if(!match) {
			return;
		}

		// So the router doesn't handle it, and a reload doesn't open it again
		history.replaceState(null, "", location.pathname + location.search);

		await new RecoveryWindow(match[1]).verifyAndShow(match[2]);
	}

	/**
	 * A file dropped outside a drop zone would make the browser open it and leave GroupOffice
	 *
	 * Drop zones call preventDefault() on "dragover" to accept the drop, so only "dragover" events that no drop zone
	 * handled get the "none" drop effect.
	 */
	private preventFileDropNavigation() {
		const isFileDrag = (e: DragEvent) => !!e.dataTransfer && e.dataTransfer.items.length > 0 && e.dataTransfer.items[0].kind == "file";

		document.addEventListener("dragover", e => {
			if(e.defaultPrevented || !isFileDrag(e)) {
				return;
			}
			e.dataTransfer!.dropEffect = "none";
			e.preventDefault();
		});

		// Cancelling the drop never hurts. A drop zone has handled it already.
		document.addEventListener("drop", e => {
			if(isFileDrag(e)) {
				e.preventDefault();
			}
		});
	}

	/**
	 * Open the global search
	 *
	 * Legacy code can use go.util.search(text).
	 *
	 * @param text Search for this text right away
	 */
	public search(text?: string) {
		const m = new MainSearchWindow();
		m.show();
		if(text) {
			m.search(text);
		}
	}

	private setupRoutes() {
		router.add(/^systemsettings\/?([^\/]+)?/, (selectedItemId) => {
			if(!systemSettingsPanels.hasVisiblePanels()) {
				return;
			}
			// The back button within the settings switches the page of the open window
			let s = this.routedSettingsWindow instanceof SystemSettingsWindow ? this.routedSettingsWindow : new SystemSettingsWindow(undefined);

			// "systemsettings/<module name>" opens the settings dialog of the module, as on its tile in "Modules"
			if(selectedItemId && !s.selectItem(selectedItemId)) {
				const mod = modules.getAll().find(m => m.name == selectedItemId);
				if(mod) {
					s.selectItem("modules");
					void this.openModuleSettings(mod.package + "/" + mod.name);
				}
			}
			this.showRoutedSettingsWindow(s);
		});

		router.add(/^usersettings\/?([^\/]+)?/, (selectedItemId) => {
			const s = this.routedSettingsWindow instanceof UserSettingsWindow ? this.routedSettingsWindow : new UserSettingsWindow(selectedItemId);
			if(selectedItemId) {
				s.selectItem(selectedItemId);
			}
			this.showRoutedSettingsWindow(s);
		});

		// The back button or a link to another page closes the settings
		router.on("change", ({path}) => {
			if(this.routedSettingsWindow && !path.startsWith(this.routedSettingsWindow instanceof SystemSettingsWindow ? "systemsettings" : "usersettings")) {
				this.routedSettingsWindow.close();
			}
		});


		this.addLegacyDefaultRoutes();
	}

	/**
	 * The settings window that the URL opened
	 */
	private routedSettingsWindow?: SystemSettingsWindow | UserSettingsWindow;

	private showRoutedSettingsWindow(w: SystemSettingsWindow | UserSettingsWindow) {
		if(this.routedSettingsWindow === w) {
			return;
		}
		// Going from the system settings straight to the user settings
		this.routedSettingsWindow?.close();
		this.routedSettingsWindow = w;
		w.on("close", () => {
			if(this.routedSettingsWindow === w) {
				this.routedSettingsWindow = undefined;
			}
		});
		w.show();
	}

	/**
	 * Open the settings dialog of a module
	 *
	 * @param moduleId "package/name"
	 */
	private async openModuleSettings(moduleId: string) {
		const response = await client.jmap("core/ModuleInfo/get", {ids: [moduleId]});
		const info = response.list[0] as ModuleInfo | undefined;
		// Without the right to manage the module the user doesn't get it
		if(!info || !info.available || !info.model) {
			return;
		}
		const d = new ModuleDialog(info);
		void d.load(info.model.id);
		d.show();
	}

	private addPanelMenuItem(m: MainPanelCreator) {

		const badge = this.badges[m.id];

		const menuItem = comp({
				cls: "pinned-item sortable",
				itemId: m.id,
				draggable: true,
				listeners: {
					render: e => {
						e.target.el.addEventListener("contextmenu", (ev) => {
							ev.preventDefault();
							(e.target.findChild("menu-button") as Button).menu!.showAt(ev)
						})
					}
				}
			},
			btn({

				text: m.title,
				handler: () => {
					router.goto(m.id);
				}
			}),

			btn({
				itemId: "menu-button",
				cls: "menu small for-medium-device",
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

							const i = this.menu.findItemIndex("pinned-splitter");

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
							const pnl = this.container.findChild(m.id);
							if(pnl) {
								pnl.remove();
							}
						})
					})

				)
			}),

			comp({cls: "goui-badge", hidden:!badge, itemId: "badge", text: badge ? badge.toString() : ""})

		);
		this.menu.items.add(menuItem);
	}

	/**
	 * Add a main panel that is accessible through the main menu and tabs
	 *

	 */
	public addPanel(pkg: string, module: string, panelCfg: Omit<MainPanelConfig<any>, "cmp"> & {id:string, callback: () => Component<any>}) {

		translate.setDefaultModule(pkg, module);

		this.panelConfigs[panelCfg.id] = {
			package: pkg,
			module: module,
			id: panelCfg.id,
			title: panelCfg.title,
			callback: panelCfg.callback,
			routes: panelCfg.routes
		};

		// Add route to the panel
		router.add(new RegExp(`^${RegExp.escape(panelCfg.id)}$`), () => {
			return this.openPanel(panelCfg.id)
		});
	}


	/**
	 * Get all panels registered by the modules
	 */
	public getPanels() {
		return Object.values(this.panelConfigs);
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
			if(router.getPath() === "") {
				this.openDefaultPanel();
				return;
			}
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

		const m = this.panelConfigs[panelId];
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
	 * Open the first pinned panel, or the first panel when none is pinned
	 *
	 * Shows a message when the user has no modules at all.
	 */
	private openDefaultPanel() {
		const panelId = this.pinned.find(id => this.panelConfigs[id]) ??
			ArrayUtil.multiSort(this.getPanels(), [{property: "title"}])[0]?.id;

		if(panelId) {
			this.openPanel(panelId);
			return;
		}

		let noModules = this.container.findChild("no-modules");
		if(!noModules) {
			noModules = comp({
					itemId: "no-modules",
					cls: "pad",
					title: t("No modules available")
				},
				p(t("You have a valid account but you don't have access to any of the modules. Please contact the administrator if you feel this is an error."))
			);
			this.container.items.add(noModules);
		}
		noModules.show();
	}

	/**
	 * Get a panel only when it has been created already
	 *
	 * Unlike getPanelById() it doesn't create the panel or its menu item.
	 *
	 * @param panelId
	 */
	public findPanel(panelId:string): Component | undefined {
		return this.container.findChild(panelId);
	}

	/**
	 * Check if a module registered a panel with this ID
	 *
	 * @param panelId
	 */
	public hasPanel(panelId:string): boolean {
		return !!this.panelConfigs[panelId];
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

	/**
	 * Show a count on the launcher item and the menu item of a panel
	 *
	 * It may be called before the main layout has been built. The count shows when the items are created.
	 *
	 * @param panelId
	 * @param count
	 */
	public setPanelBadge(panelId:string, count:number|undefined) {
		this.badges[panelId] = count;

		this.launcher?.setBadge(panelId, count);

		const pinned = this.menu.findChild(panelId);

		if(pinned) {
			const badge = pinned.findChild("badge")!;
			badge.text = count?.toString() ?? "";
			badge.hidden = !count;
		}
	}
}

export const main = new Main();


