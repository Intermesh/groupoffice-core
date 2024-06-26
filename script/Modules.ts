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

let GouiMainPanel : any;

if(window.GO) {
	client.uri = BaseHref + "api/";

	GO.mainLayout.on("authenticated", () => {
		translate.load(GO.lang.core.core, "core", "core");
		// client.sse(go.Entities.getAll().filter((e:any) => e.package != "legacy").map((e:any) => e.name));
	})

	 GouiMainPanel = Ext.extend(go.modules.ModulePanel, {

		callback: undefined,

		initComponent () {
			this.cls = 'goui-module-panel';
			GouiMainPanel.superclass.initComponent.call(this);

			this.on("afterrender", async () => {
				const comp = await this.callback();
				comp.render(this.el.dom);
			}, this);
		},

		 setSize (w:number, h:number){
			// dont
		 }

	});
}


interface Module extends BaseEntity{
	name: string,
	package: string,
	rights: string[],
	settings?: Record<string, any>
	userRights: Record<string, boolean>,
	version: number,
	entities: Record<string, Entity>
}


class Modules {

	private mods: Record<string,Record<string, ModuleConfig>> = {};
	private modules?: Module[];

	/**
	 * Register a module so it's functionally is added to the GUI
	 *
	 * @param config
	 */
	public register(config: ModuleConfig) {

		if(!this.mods[config.package]) {
			this.mods[config.package] = {};
		}

		if(this.mods[config.package][config.name]) {
			return; //already registered
		}

		this.mods[config.package][config.name] = config;

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

//
// //For 6.8 but not 6.9
// GO.mainLayout.on("authenticated", () => {
// 	client.fireAuth();
//
// })