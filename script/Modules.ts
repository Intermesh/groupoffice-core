import {BaseEntity, Component, EntityID, translate} from "@intermesh/goui";
import {client, jmapds} from "./jmap/index.js";
import {Entity} from "./Entities";


export interface EntityFilter {
	name: string,
	type: string,
	typeConfig?: Record<string, any>,
	title: string,
	multiple: boolean
}

export interface EntityLink {
	title?:string
	iconCls: string,
	linkWindow: (entity:string, entityId:EntityID) => void,
	linkDetail: () => void
}
export interface EntityConfig {
	name: string;
	links?:EntityLink[],
	filters?:EntityFilter[]
}

export type ModuleConfig = {
	// [key:string]:unknown;

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
	entities?: (string|EntityConfig)[]

};

// for using old components in GOUI
declare global {
	var GO: any;
	var go: any;
	var Ext: any;
	var BaseHref: string;
}

let GouiMainPanel : any, GouiSystemSettingsPanel : any;

if(window.GO) {
	client.uri = BaseHref + "api/";
// this set's the GOUI client authenticated by using the group-office Extjs session data
	GO.mainLayout.on("authenticated", () => {
		client.session = go.User.session;
		translate.load(GO.lang.core.core, "core", "core");
		client.fireAuth();
		// client.sse(go.Entities.getAll().filter((e:any) => e.package != "legacy").map((e:any) => e.name));
	})

	 GouiMainPanel = Ext.extend(go.modules.ModulePanel, {

		callback: undefined,

		 cls: "go-module-panel goui-module-panel",

		initComponent: function () {

			GouiMainPanel.superclass.initComponent.call(this);

			this.on("afterrender", async () => {
				const comp = await this.callback();
				comp.render(this.body.dom);
			}, this);
		},

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

	private mods: ModuleConfig[] = [];
	private modules?: Module[];

	/**
	 * Register a module so it's functionally is added to the GUI
	 *
	 * @param config
	 */
	public register(config: ModuleConfig) {
		this.mods.push(config);
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

		// @todo, this ugly. core must play with Ext but can also be used out side of group-office like on the website
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
	 * @param title
	 * @param icon
	 * @param callback
	 */
	public addSystemSettingsPanel(pkg: string, module: string, title: string, icon: string, callback: () => Component | Promise<Component>) {

		go.Translate.package = go.package = pkg;
		go.Translate.module = go.module = module;

		// @todo, this ugly. core must play with Ext but can also be used out side of group-office like on the website
		// @ts-ignore
		const proto = new GouiSystemSettingsPanel();
		proto.callback= callback;
		proto.title = title;
		proto.iconCls = "ic-" + icon;

		GO.systemSettingsPanels.push(proto);
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
		go.Modules.register(config.package, config.name, {
			entities: config.entities
		});
	}

	/**
	 * Get all modules
	 */
	public async getAll() {
		if(!this.modules) {
			const mods = await jmapds<Module>("Module").get();
			this.modules = mods.list;
		}
		return this.modules;
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