import {EntityLink, modules} from "./Modules.js";
import {EntityID} from "@intermesh/goui";

export interface Entity {
	name: string,
	defaultAcl: Record<string, number>,
	isAclOwner: boolean,
	customFields: boolean,
	supportsFiles: boolean,
	links: LinkConfig[],
	goto: (id:EntityID)=>void
}

export interface LinkConfig extends EntityLink {
	title: string,
	entity: string
}


class Entities {
	private entities?: Record<string, Entity>;

	public get(name: string) : Entity {
		return go.Entities.get(name);
	}

	public getAll() : Entity[] {
		return go.Entities.getAll();
	}


	/**
	 * Get link configurations as defined in Module.js with go.Modules.register();
	 */
	getLinkConfigs() : LinkConfig[] {
		return go.Entities.getLinkConfigs();
	}


	getLinkConfig(entity: string, filter?: string) {

		const all = this.getLinkConfigs();

		const linkConfig = all.find(function (cfg) {

			if (entity != cfg.entity) {
				return false;
			}

			if (filter != cfg.filter) {
				return false;
			}

			return true;
		});

		return linkConfig;
	}
}

export const entities = new Entities();