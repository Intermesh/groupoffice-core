import {Component} from "@intermesh/goui";
import {client} from "./jmap/index.js";

type RouterMethod = (...args: string[]) => Promise<any> | any;

export type ModuleConfig = {
	// [key:string]:unknown;

	package: string;
	name: string;

	init?: () => void;

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
// this set's the GOUI client authenticated by using the group-office Extjs session data
	GO.mainLayout.on("authenticated", () => {
		client.uri = BaseHref + "api/";
		client.session = go.User.session;

		// client.sse(go.Entities.getAll().filter((e:any) => e.package != "legacy").map((e:any) => e.name));
	})


	/**
	 * Copyright Intermesh
	 *
	 * This file is part of Group-Office. You should have received a copy of the
	 * Group-Office license along with Group-Office. See the file /LICENSE.TXT
	 *
	 * If you have questions write an e-mail to info@intermesh.nl
	 *
	 * @copyright Copyright Intermesh
	 * @author Merijn Schering <mschering@intermesh.nl>
	 */
	 GouiMainPanel = Ext.extend(go.modules.ModulePanel, {

		callback: undefined,

		initComponent: function () {

			GouiMainPanel.superclass.initComponent.call(this);

			this.on("afterrender", async () => {
				const comp = await this.callback();
				comp.render(this.body.dom);
			}, this);
		},

	});
}

	class Modules {

		private mods: ModuleConfig[] = [];

		public register(config: ModuleConfig) {
			this.mods.push(config);
			this.registerInExtjs(config);

			go.Translate.package = config.package;
			go.Translate.module = config.name;

			if (config.init) {
				config.init();
			}
		}


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

		public openMainPanel(id: string) {
			GO.mainLayout.openModule(id);
		}

		private registerInExtjs(config: ModuleConfig) {
			go.Modules.register(config.package, config.name, {});
		}


	}



export const modules = new Modules();