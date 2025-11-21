import {
	BaseEntity,
	Component,
	EntityID,
	MaterialIcon,
	t,
	translate,
} from "@intermesh/goui";
import {client, JmapDataSource} from "./jmap/index.js";
import {Entity} from "./Entities.js";
import {User} from "./auth";
import {DetailPanel} from "./components/index";


export interface EntityFilter {
	name: string,
	type: string,
	typeConfig?: Record<string, any>,
	title: string,
	multiple: boolean
}

export interface EntityLink {
	/**
	 * Filter key. For contacts there's "isOrganization" for example.
	 */
	filter?: string;
	/**
	 * Human friendly title for menu's. Defaults to t(entity.name)
	 */
	title?: string;
	/**
	 * CSS class to render the icon
	 */
	iconCls: string;
	/**
	 * Use this link only for the search filter. Used for comments.
	 */
	searchOnly?: boolean;
	/**
	 * Create a window that will create a new linked item of this type
	 *
	 * @param entity
	 * @param entityId
	 */
	linkWindow?: (entityName: string, entityId: EntityID, entity:BaseEntity, detailPanel:DetailPanel) => any;


	/**
	 * Return a detail component to show a linked entity of this type
	 */
	linkDetail: () => DetailPanel;

	linkDetailCards?: () => Component[]
}
export interface EntityConfig {
	/**
	 * Entity name
	 *
	 * eg. "Contact"
	 */
	name: string;
	/**
	 * Human friendly title for the entity
	 *
	 * If not given it will default to t(entity.name);
	 */
	title?: string;
	/**
	 * Available linking options.
	 *
	 * In most cases there will be one but for example a contact as one extra for organizations. The "filter" option is
	 * used to differentiate the two.
	 */
	links?: EntityLink[];
	/**
	 * Custom filters for the entity
	 */
	filters?: EntityFilter[];
}
export type ModuleConfig = {
	/**
	 * Module package name
	 */
	package: string;
	/**
	 * Module name
	 */
	name: string;
	/**
	 * Init function. Is called when the main Group-Office page loads
	 */
	init?: () => void;
	/**
	 * Registered module entities
	 */
	entities?: (string | EntityConfig)[];
};

export type MainPanel = {
	package: string
	module: string,
	id: string,
	title: string
	callback: () => Component | Promise<Component>
}

// for using old components in GOUI
declare global {
	var GO: any;
	var go: any;
	var Ext: any;
	var BaseHref: string;

	var GOUI: any;
	var groupofficeCore: any;
}

let GouiMainPanel : any, GouiSystemSettingsPanel : any, GouiAccountSettingsPanel: any;

if(window.GO) {

	GO.mainLayout.on("authenticated", () => {
		// client.sse(go.Entities.getAll().filter((e:any) => e.package != "legacy").map((e:any) => e.name));
	})

	 GouiMainPanel = Ext.extend(go.modules.ModulePanel, {

		callback: undefined,

		initComponent () {
			this.cls = 'goui-module-panel';
			GouiMainPanel.superclass.initComponent.call(this);

			this.on("afterrender", () => {
				translate.setDefaultModule(this.package, this.module);
				const comp = this.callback();
				comp.render(this.el.dom);
			}, this);
		},

		 setSize (w:number, h:number){
			// dont
		 }

	});

	GouiSystemSettingsPanel = Ext.extend(Ext.BoxComponent, {

		callback: undefined,

		comp: undefined,

		initComponent: function () {

			GouiSystemSettingsPanel.superclass.initComponent.call(this);

			this.on("afterrender", async () => {

				translate.setDefaultModule(this.package, this.module);

				this.comp = await this.callback();
				this.comp.render(this.el.dom);
			}, this);
		},

		onSubmit: async function (cb:any, scope: any) {
			if(this.comp.onSubmit) {
				await this.comp.onSubmit();
			}
			cb.call(scope, this, true);
		},

	});



	GouiAccountSettingsPanel = Ext.extend(Ext.BoxComponent, {


		comp: undefined,

		initComponent: function () {

			GouiSystemSettingsPanel.superclass.initComponent.call(this);

			this.on("afterrender", () => {
				if(!this.comp) {
					this.comp = this.callback();
				}
				this.comp.render(this.el.dom);
			}, this);
		},

		onSubmit: async function () {
			if(this.comp.onSubmit) {
				await this.comp.onSubmit();
			}
		},

		destroy : () => {},

		onLoad: async function(user:User) {
			if(!this.comp) {
				this.comp = this.callback();
			}
			if(this.comp.onLoad) {
				await this.comp.onLoad(user);
			}
		}

	});
}


export interface Module extends BaseEntity {
	name: string,
	package: string,
	rights: string[],
	settings: Record<string, any>
	userRights: Record<string, boolean>,
	version: number,
	entities: Record<string, Entity>
}

export const moduleDS = new JmapDataSource<Module>("Module");

class Modules {

	private clientModules: Record<string, ModuleConfig> = {};
	private serverModules: Record<string, Module> = {};

	private mainPanels: MainPanel[] = [];


	private async legacyInit(): Promise<void> {

		Ext.Ajax.defaultHeaders = {'Accept-Language': GO.lang.iso, 'Authorization': 'Bearer ' + client.accessToken};

		// stuff that mainlayout did on boot
		const goui = "../../../../../../../views/goui/dist/goui/script/index.js?v=" + GO.version,
			groupofficeCore = "../../../../../../../views/goui/dist/groupoffice-core/script/index.js?v=" + GO.version;

		window.GOUI = await import(goui);
		window.groupofficeCore = await import(groupofficeCore);

		await go.User.load();

		go.browserStorage.connect().finally(function() {
			Ext.QuickTips.init();
			Ext.apply(Ext.QuickTips.getQuickTip(), {
				dismissDelay: 0,
				maxWidth: 500
			});
		});


		//load state
		if(!GO.util.isMobileOrTablet()) {
			Ext.state.Manager.setProvider(new GO.state.HttpProvider());
		} else
		{
			Ext.state.Manager.setProvider(new Ext.state.CookieProvider({
				expires: new Date(new Date().getTime()+(1000*60*60*24*30)), //30 days
			}));
		}
		document.documentElement.cls('compact',go.User.theme === 'Compact');
		window.GOUI.DateTime.staticInit(go.User.language.substring(0,2), go.User.firstWeekday);

		GO.util.density = parseFloat(window.getComputedStyle(document.documentElement).fontSize) / 10;

		await go.Modules.init();
		await go.User.loadLegacyModules();
		await go.customfields.CustomFields.init()
		await go.Entities.init();
	}


	public async init() {

		await this.legacyInit();

		const serverMods = await moduleDS.get();

		const proms = serverMods.list.map(m => {
			if(!m.package) {
				m.package = "legacy";
			}
			const id = m.package + "/" + m.name;

			this.serverModules[id] = m;

			// if(m.package != "core" && m.package != "legacy") {
			// 	const mod = "../../../../../../../go/modules/" + m.package + "/" + m.name + "/views/goui/dist/Index.js?v=" + client.session?.version;
			// 	return import(mod).catch((e) => {
			// 		console.error("Module loading error: ", e);
			// 	});
			// }
		})

		// await Promise.all(proms);

	}


	public loadModule(pkg:string, name:string) {
		const mod = "../../../../../../../go/modules/" + pkg + "/" + name + "/views/goui/dist/Index.js?v=" + client.session?.version;
		return import(mod).catch((e) => {
			console.error("Module loading error: ", e);
		}).then(() => {

		})
	}


	/**
	 * Register a module so it's functionally is added to the GUI
	 *
	 * @param config
	 */
	public register(config: ModuleConfig) {


		const id = config.package + "/" + config.name;

		console.log(id);
		// debugger;
		if(this.clientModules[id]) {
			return; //already registered
		}

		this.clientModules[id] = config;


		if(window.go) {
			go.Translate.package = config.package;
			go.Translate.module = config.name;
		}

		if (config.init) {
			config.init();
		}

		if(window.go) {
			this.registerInExtjs(config);
		}
	}


	/**
	 * Add a main panel that is accessible through the main menu and tabs
	 *
	 * @param pkg
	 * @param module
	 * @param id
	 * @param title
	 * @param callback
	 */
	public addMainPanel(pkg: string, module: string, id: string, title: string, callback: () => Component | Promise<Component>) {


		translate.setDefaultModule(pkg, module);

		if(window.go) {
			go.Translate.package = go.package = pkg;
			go.Translate.module = go.module = module;
			// @ts-ignore
			const proto = Ext.extend(GouiMainPanel, {
				id: id,
				title: title,
				callback: callback
			});

			proto.package = pkg;
			proto.module = module;

			go.Modules.addPanel(proto);
		}


		this.mainPanels.push({
			package: pkg,
			module: module,
			id,
			title,
			callback
		})
	}

	public getMainPanels() {
		return this.mainPanels;
	}


	/**
	 * Add a system settings panel
	 *
	 * @param pkg
	 * @param module
	 * @param id
	 * @param title
	 * @param icon
	 * @param callback
	 */
	public addSystemSettingsPanel(pkg: string, module: string, id:string, title: string,  icon: MaterialIcon, callback: () => Component | Promise<Component>) {

		if(!window.go) {

			//todo
			return;
		}
		go.Translate.package = go.package = pkg;
		go.Translate.module = go.module = module;

		// @ts-ignore
		const proto = new GouiSystemSettingsPanel();
		proto.callback= callback;
		proto.title = title;
		proto.iconCls = "ic-" + icon.replace('_','-');
		proto.itemId = id;

		GO.systemSettingsPanels.push(proto);
	}

	/**
	 * Add a system settings panel
	 *
	 * @param pkg
	 * @param module
	 * @param id
	 * @param title
	 * @param icon
	 * @param callback
	 */
	public addAccountSettingsPanel(pkg: string, module: string, id:string, title: string,  icon: MaterialIcon, callback: () => Component) {
		if(!window.go) {

			//todo
			return;
		}
		go.Translate.package = go.package = pkg;
		go.Translate.module = go.module = module;

		// @ts-ignore
		const proto = new GouiAccountSettingsPanel({
			callback: callback,
			title: title,
			iconCls: "ic-"+icon.replace('_', '-'),
			itemId: id
		});

		GO.userSettingsPanels.push(proto);
	}

	/**
	 * Open a main panel
	 *
	 * @param id
	 */
	public openMainPanel(id: string) {
		GO.mainLayout.openModule(id);
	}

	private registerInExtjs(config: ModuleConfig) {
		go.Translate.setModule(config.package, config.name);
		go.Modules.register(config.package, config.name, {
			entities: config.entities,
			title: t('name')
		});
	}

	/**
	 * Get all modules
	 */
	public getAll() : Module[] {
		return Object.values(this.serverModules);
	}

	/**
	 * Check if the current user has this module
	 *
	 * @param pkg
	 * @param name
	 */
	public isAvailable(pkg:string, name:string) : boolean {
		return !!this.get(pkg, name);
	}

	/**
	 * Get a module
	 *
	 * @param pkg
	 * @param name
	 */
	public get(pkg:string, name:string) : Module | undefined {
		return this.serverModules[pkg + "/" + name];
	}


}

export const modules = new Modules();

//
// //For 6.8 but not 6.9
// GO.mainLayout.on("authenticated", () => {
// 	client.fireAuth();
//
// })