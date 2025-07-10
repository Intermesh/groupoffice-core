import {BaseEntity, Component, EntityID, MaterialIcon, ObjectUtil, translate, Window} from "@intermesh/goui";
import {client, jmapds} from "./jmap/index.js";
import {Entity} from "./Entities.js";
import {User} from "./auth";


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
	linkWindow?: (entity: string, entityId: EntityID) => any;


	/**
	 * Return a detail component to show a linked entity of this type
	 */
	linkDetail: () => Component;
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

// for using old components in GOUI
declare global {
	var GO: any;
	var go: any;
	var Ext: any;
	var BaseHref: string;
}

let GouiMainPanel : any, GouiSystemSettingsPanel : any, GouiAccountSettingsPanel: any;

if(window.GO) {
	client.uri = BaseHref + "api/";

	GO.mainLayout.on("authenticated", () => {
		// client.sse(go.Entities.getAll().filter((e:any) => e.package != "legacy").map((e:any) => e.name));
	})

	 GouiMainPanel = Ext.extend(go.modules.ModulePanel, {

		callback: undefined,

		initComponent () {
			this.cls = 'goui-module-panel';
			GouiMainPanel.superclass.initComponent.call(this);

			this.on("afterrender", () => {
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
	settings?: Record<string, any>
	userRights: Record<string, boolean>,
	version: number,
	entities: Record<string, Entity>
}


class Modules {

	private mods: Record<string, ModuleConfig> = {};
	private modules?: Module[];

	/**
	 * Register a module so it's functionally is added to the GUI
	 *
	 * @param config
	 */
	public register(config: ModuleConfig) {

		const id = config.package + "/" + config.name;

		if(this.mods[id]) {
			return; //already registered
		}

		this.mods[id] = config;

		this.registerInExtjs(config);

		go.Translate.package = config.package;
		go.Translate.module = config.name;

		if (config.init) {
			config.init();
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
			entities: config.entities
		});
	}

	/**
	 * Get all modules
	 */
	public getAll() : Module[] {
		return go.Modules.getAvailable();
	}

	/**
	 * Check if the current user has this module
	 *
	 * @param pkg
	 * @param name
	 */
	public isAvailable(pkg:string, name:string) : boolean {
		return go.Modules.isAvailable(pkg, name);
	}

	/**
	 * Get a module
	 *
	 * @param pkg
	 * @param name
	 */
	public get(pkg:string, name:string) : Module | undefined {
		const mod = go.Modules.get(pkg, name);
		return mod ? mod : undefined;
	}


}

export const modules = new Modules();

//
// //For 6.8 but not 6.9
// GO.mainLayout.on("authenticated", () => {
// 	client.fireAuth();
//
// })