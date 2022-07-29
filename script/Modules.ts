import {Component} from "@goui/component/Component.js";
import {client} from "@goui/jmap/Client.js";

type RouterMethod = (...args: string[]) => Promise<any> | any;

export interface ModuleConfig  {
	readonly package?: string;
	readonly name?: string;
	/**
	 * The routes
	 */
	routes?: {
		[key: string] : RouterMethod
	}

}

// for using old components in GOUI
declare global {
	var GO: any;
	var go: any;
	var Ext: any;
	var BaseHref: string;
}


client.uri = BaseHref + "api/";

GO.mainLayout.on("authenticated", () =>  {
	client.session = Ext.apply(go.User.session, {accessToken: go.User.accessToken});
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
const GouiMainPanel = Ext.extend(go.modules.ModulePanel, {

	callback: undefined,

	initComponent: function () {

		GouiMainPanel.superclass.initComponent.call(this);

		this.on("afterrender", async () => {
			const comp = await this.callback();
			comp.render(this.body.dom);
		}, this);
	},

});


class Modules {

	private mods:ModuleConfig[] = [];

	public register(config:ModuleConfig) {
		this.mods.push(config);
		this.registerInExtjs(config);

		if(config.routes) {
			for(let route in config.routes) {
				go.Router.add(new RegExp(route), config.routes[route]);
			}
		}
	}

	public addMainPanel(id: string, title: string, callback: () => Component|Promise<Component>) {

		const proto = Ext.extend(GouiMainPanel, {
			id: id,
			title: title,
			callback: callback
		})

		go.Modules.addPanel(proto);
	}

	public openMainPanel(id: string) {
		GO.mainLayout.openModule(id);
	}

	private registerInExtjs(config:ModuleConfig) {
		go.Modules.register(config.package, config.name, {

		});
	}


}

export const modules = new Modules();