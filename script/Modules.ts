import {BaseEntity, Component, EntityID, MaterialIcon, router, t, translate} from "@intermesh/goui";
import {client, JmapDataSource} from "./jmap/index.js";
import {entities, Entity, EntityRelation} from "./Entities.js";
import {User} from "./auth";
import {DetailPanel} from "./components/DetailPanel.js";
import {LanguageField} from "./components/form/LanguageField.js";
import {AppSettingsPanel, appSystemSettings, main, moduleSettings,} from "./main/index.js";
import {Field} from "./customfields/index.js";

export type EntityFilterType = "string" | "number" | "date" | "select";
export interface EntityFilter {
	name: string,
	type: EntityFilterType | string, // todo: custom components from modules?
	typeConfig?: Record<string, any>,
	title: string,
	multiple: boolean,
	wildcards?: boolean,
	customfield?: Field,
	options?: {
		value: any,
		title: string
	}[]
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
	linkWindow?: (entityName: string, entityId: EntityID, entity:any, detailPanel:DetailPanel) => any;


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
	filters?: EntityFilter[]

	relations?: Record<string, EntityRelation>


	permissions?: { value:number, name: string }[]
}

export type MainPanelConfig<T extends typeof Component<any> = typeof Component<any>> = {
	// id: string
	title: string,
	cmp: T,
	routes?: Record<string, (this: InstanceType<T>, ...args: string[]) => Promise<any> | any>
}

type CmpMap = Record<string, typeof Component<any>>

type PanelsMap<T extends CmpMap> = {
	[K in keyof T]: MainPanelConfig<T[K]>
}

export interface ModuleConfig<T extends CmpMap>  {
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

	panels?: PanelsMap<T>

	settingsPanels?: (typeof AppSettingsPanel)[]

	systemSettingsPanels?: (new () => Component)[]

	/**
	 * Used by legacy ExtJS module. It will render as a main panel
	 * @deprecated
	 */
	mainPanel?:any
	/**
	 * used as main panel title
	 *
	 * @deprecated
	 */
	title?:string,

	/**
	 * Main panel config
	 * @deprecated
	 */
	panelConfig?:any
};


// interface LegacyPanel extends typeof Component {
// 	cls: string
// 	id: string
// 	moduleName: string
// 	package: string
// 	sort_order: number
// 	title: string
// }

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

export interface Module extends BaseEntity {
	id: EntityID
	title: string
	name: string,
	package: string,
	/**
	 * Available rights.
	 *
	 * eg. "mayRead", "mayManage", "mayChangeGroups" etc
	 */
	rights: string[],
	settings: Record<string, any>

	/**
	 * Available rights of the current user
	 */
	userRights: Record<string, boolean>,

	/**
	 * Rights per groupId (groupId is the key)
	 */
	permissions: Record<EntityID, Record<string, boolean>>
	version: number,

	/**
	 * Entities of the module
	 */
	entities: Record<string, Entity>,
	enabled: boolean
	/**
	 * goui, extjs3
	 */
	views: string[],

}

export const moduleDS = new JmapDataSource<Module>("Module");

class Modules {

	private clientModules: Record<string, ModuleConfig<any>> = {};
	private serverModules: Record<string, Module> = {};

	private async legacyInit(): Promise<any> {

		Ext.Ajax.defaultHeaders = {'Accept-Language': GO.lang.iso, 'Authorization': 'Bearer ' + client.accessToken};

		// stuff that mainlayout did on boot
		const goui = "@intermesh/goui",
			groupofficeCore = "@intermesh/groupoffice-core";

		window.GOUI = await import(goui);
		window.groupofficeCore = await import(groupofficeCore);

		await new Promise((resolve, reject) => {
			const script = document.createElement('script');
			script.src = "views/goui/legacyscripts.php";
			script.onload = resolve;
			script.onerror = reject;
			document.head.appendChild(script);
		});

		// all entities should be registered now so we populate them with server info
		entities.init()

		await go.User.onLoad(client.session);

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

		// document.documentElement.cls('compact',go.User.theme === 'Compact');
		window.GOUI.DateTime.staticInit(go.User.language.substring(0,2), go.User.firstWeekday);

		GO.util.density = parseFloat(window.getComputedStyle(document.documentElement).fontSize) / 10;

		// manually call the document ready
		Ext.fireDocReady();

		await go.User.loadLegacyModuleScripts();
		// this init depends on modules being loaded
		await go.customfields.CustomFields.init()
		go.User.loadLegacyModules()

		//todo: bridge to new FW
		GO.checker = new GO.Checker();

		GO.mainLayout.fireReady();
	}


	/**
	 * Loads module script before being authenticated
	 */
	public async loadCapabilities() {
		const r =  await fetch(BaseHref+"views/goui/capabilities.php")
		const capabilities = await r.json();

		LanguageField.languages = capabilities.languages;

		document.title = capabilities.title;

		this.applyCustomStyle(capabilities.settings);

		const gouiModules = capabilities.modules.filter((m:any) => {
			return m.entry;
		});

		return Promise.all(gouiModules.map((m:any) => {
					return import(m.entry).catch((e) => {
						console.error("Module loading error: ", e);
					})
			})
		);
	}

	private applyCustomStyle(settings:any) {
		let style = "<style> :root, body {";
		style += this.printCustomStyle(settings, 'Color') + "};";
		style += "body.dark{" + this.printCustomStyle(settings, 'Dark');
		style += "};</style>";

		document.head.insertAdjacentHTML('beforeend', style);

		(document.getElementsByTagName("meta") as any)["theme-color"].content = document.body.style.getPropertyValue("--fg-main");
console.log(document.body.style.getPropertyValue("--fg-main"));
	}

	private printCustomStyle(settings:any, theme = 'Color') {

		const vars:any = {
			'--fg-main': 'primary',
			'--c-primary': 'secondary',
			'--c-secondary': 'tertiary',
			'--c-accent': 'accent'
		}

		let style = "";
		for(const css in vars) {
			const prefix = vars[css];
			const varName = prefix + theme;
			if(settings[varName]) {

				style += `${css}: #${settings[varName]};\n`;
			}
		}
		return style;
	}


	/**
	 * Initializes after the user is authenticated.
	 *
	 * It populates the serverModules entities from the JMAP server.
	 */
	public async init() {

		this.register({
			name: "core",
			package: "core",
			entities: [
				{
					name: 'Alert',
					relations: {
						user: {store: "Principal", fk:'userId'}
					}
				},
				{
					name: 'Group',
					relations: {
						users: {store: "Principal", fk: "users"},
						user: {store: "Principal", fk:'isUserGroupFor'}
					}
				},

				{
					name: 'User',
					filters: [
						{
							wildcards: false,
							name: 'text',
							type: "string",
							multiple: false,
							title: t("Query")
						},
						{
							title: t("Comment"),
							name: 'comment',
							multiple: true,
							type: 'string'
						},
						{
							title: t("Commented at"),
							name: 'commentedat',
							multiple: false,
							type: 'date'
						}, {
							title: t("Modified at"),
							name: 'modifiedat',
							multiple: false,
							type: 'date'
						}, {
							title: t("Modified by"),
							name: 'modifiedBy',
							multiple: true,
							type: 'string'
						}, {
							title: t("Created at"),
							name: 'createdat',
							multiple: false,
							type: 'date'
						}, {
							title: t("Created by"),
							name: 'createdby',
							multiple: true,
							type: 'string'
						},
						{
							title: t("Username"),
							name: 'username',
							multiple: true,
							type: 'string'
						},{
							title: t("Display name"),
							name: 'displayName',
							multiple: true,
							type: 'string'
						},{
							title: t("E-mail"),
							name: 'email',
							multiple: true,
							type: 'string'
						},
					]

				},
				'Principal',
				'Field',
				{
					name: 'FieldSet',
					title: t("Custom field set")
				},
				'Module',
				{
					name: 'Link',
					relations: {
						to: {store: "Search", fk: "toSearchId"}
					}
				},
				'Search',
				'EntityFilter',
				'SmtpAccount',
				'EmailTemplate',
				'PdfTemplate',
				'ImportMapping',
				'CronJobSchedule',
				{
					name: 'AuthAllowGroup',
					relations: {
						group: {store: "Group", fk:'groupId'}
					}
				},
				'OauthClient',
				'SpreadSheetExport'
			],


			//
			// customFieldTypes: [
			// 	"go.customfields.type.Checkbox",
			// 	"go.customfields.type.Date",
			// 	"go.customfields.type.DateTime",
			// 	"go.customfields.type.EncryptedText",
			// 	"go.customfields.type.FunctionField",
			// 	"go.customfields.type.Group",
			// 	"go.customfields.type.Html",
			// 	"go.customfields.type.MultiSelect",
			// 	"go.customfields.type.Attachments",
			// 	"go.customfields.type.Notes",
			// 	"go.customfields.type.Number",
			// 	"go.customfields.type.Select",
			// 	"go.customfields.type.Text",
			// 	"go.customfields.type.TextArea",
			// 	"go.customfields.type.Data",
			// 	"go.customfields.type.User",
			// 	"go.customfields.type.YesNo",
			// 	"go.customfields.type.TemplateField"
			// ]

		});

		return Promise.all([
			moduleDS.get().then( serverMods => {
				serverMods.list.map(m => {
					if (!m.package) {
						m.package = "legacy";
					}
					const id = m.package + "/" + m.name;
					this.serverModules[id] = m;
				})
			}),

			this.legacyInit(),



		]);
	}


	/**
	 * Register a module so it's functionally is added to the GUI
	 *
	 * @param config
	 */
	public register<T extends CmpMap>(config: ModuleConfig<T>) {

		const id = config.package + "/" + config.name;

		if(this.clientModules[id]) {
			console.warn(id + " already registered", config)

			if(config.mainPanel) {
				main.addLegacyMainpanel(config.package,config.name, config.title!, config.mainPanel, config.panelConfig ?? {});
			}
			return; //already registered
		}

		this.clientModules[id] = config;


		if (config.entities) {
			config.entities.forEach(function (entityCfg) {

				if(typeof entityCfg == "string") {
					entityCfg = {name: entityCfg};
				}

				entities.register({...entityCfg, package: config.package, module: config.name});
			});
		}


		client.on("authenticated", ( {session}) => {
			if (!session.capabilities[`go:${config.package}:${config.name}`]) {
				// User has no access to this module
				return;
			}

			translate.load(GO.lang[config.package]?.[config.name], config.package, config.name);

			if(config.panels) {
				for(let panelId in config.panels) {
					const p = config.panels[panelId];
					main.addMainPanel(config.package, config.name, {...p, id: panelId, callback: () => new p.cmp});

					// add default panel route
					router.add(new RegExp(`^${panelId}$`), ()=> {
						main.getPanelById(panelId).show();
					})

					if(p.routes) {
						for(let route in p.routes) {

							router.add(new RegExp(route), (...args) =>{
								// @ts-ignore
								p.routes![route].bind(main.getPanelById(panelId) as unknown as T)(...args);
							});
						}
					}
				}
			}

			config.settingsPanels?.forEach(p => {
				moduleSettings.addPanel(p);
			})

			config.systemSettingsPanels?.forEach(p => {
				appSystemSettings.addPanel(config.package, config.name, p);
			})


		});

		if (config.init) {
			config.init();
		}

		if(config.mainPanel) {
			main.addLegacyMainpanel(config.package,config.name, config.title!, config.mainPanel, config.panelConfig ?? {});
		}
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

		console.error("Deprecated addSystemSettings() call")
	}

	/**
	 * Get all modules
	 */
	public getAll() : Module[] {
		return Object.values(this.serverModules);
	}

	/**
	 * Get all modules
	 */
	public getAvailable(user?:User, right:string = "mayRead") : Module[] {
		const av = Object.values(this.serverModules).filter(m => this.isAvailable(m.package, m.name, user, right));
		return av;
	}

	/**
	 * Check if the current user has this module
	 */
	public isAvailable(pkg:string, name:string, user?:User, right:string = "mayRead") : boolean {
		const mod = this.get(pkg, name);
		if(!mod) {
			return false;
		}

		if(!user || user.id === client.user.id) {
			// checking for current user
			return mod.userRights[right];
		} else {
			//if a user is given we must check the groups
			for(let groupId in mod.permissions) {
				const allowed = mod.permissions[groupId]?.[right];

				if(allowed && user.groups.indexOf(groupId) != -1) {
					return true;
				}
			}
		}

		return true;
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






