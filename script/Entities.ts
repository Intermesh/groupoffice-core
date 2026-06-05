import {EntityLink, modules} from "./Modules.js";
import {EntityID} from "@intermesh/goui";

export interface Entity {
	/**
	 * Name
	 *
	 * eg. "User"
	 */
	name: string,

	/**
	 * Default ACL for new entities
	 */
	defaultAcl?: Record<string, number>,
	/**
	 * Default ACL ID
	 */
	defaultAclId?: EntityID,
	/**
	 * ACL owners have their own ACL list. Unlike ACL Items.
	 *
	 * eg. AddressBook is an ACLOwner and Contasct an ACLItem
	 */
	isAclOwner: boolean,

	/**
	 * Custom field support
	 */
	supportsCustomFields: boolean,
	/**
	 * Files supprot
	 */
	supportsFiles: boolean,

	/**
	 * Link creation information
	 */
	links: LinkConfig[],

	/**
	 * Method to route to the entity
	 */
	goto: (id:EntityID)=>void,

	/**
	 * Module name this entity belongs to
	 */
	module: string
	/**
	 * Module package name this entity belongs to
	 */
	package: string

	/**
	 * translated title for the entity
	 */
	title: string,

	/**
	 * Available JMAP filters
	 */
	filters: Record<string, any>,

	/**
	 * Relation definitions
	 */
	relations: Record<string, {store: string, fk: string}>
}

export interface LinkConfig extends EntityLink {
	title: string,
	entity: string,
}
type EntityFilter = Record<string, any>


class Entities {
	private entities: Record<string, Entity> = {};

	/**
	 * Populate some entity properties with server info.
	 *
	 * Called in mainlayout after authentication and loading of custom fields and modules.
	 */
	init() {
		this.getAll().forEach((entity) => {
			const module = modules.get(entity.package, entity.module);

			if(!module) {
				return;
			}
			const serverInfo = module.entities[entity.name];

			if (serverInfo) {
				if (!entity.supportsCustomFields) {
					entity.supportsCustomFields = serverInfo.supportsCustomFields;

					//@ts-ignore Deprecated prop used in extjs
					entity.customFields = entity.supportsCustomFields;
				}
				entity.supportsFiles = serverInfo.supportsFiles;

				entity.isAclOwner = serverInfo.isAclOwner;
				entity.defaultAcl = serverInfo.defaultAcl;
			} else {
				// Removing client entity  because it's not know by the server.
				delete this.entities[entity.name.toLowerCase()];
			}

			if (entity.supportsCustomFields) {
				this.applyCustomFieldFilters(entity);
			}

			entity.filters = go.util.Filters.normalize(entity.filters);

			entity.relations = entity.relations || {};
			entity.relations.customFields = go.customfields.CustomFields.getRelations(entity.name);
		});

	}


	private applyCustomFieldFilters(entity:Entity) {

		// const existingNames = entity.filters.column("name");
		//
		// let customFieldFilters = customFields.getFilters(entity.name)
		//
		// customFieldFilters = customFieldFilters.filter(function(f:EntityFilter) {
		// 	const exists = existingNames.indexOf(f.name) > -1;
		// 	if(exists) {
		// 		console.warn("Custom field name " + f.name+ " can't be filtered as the name conflicts with an existing filter for entity " + me.name);
		// 	}
		// 	return !exists;
		//
		// });
		// entity.filters = entity.filters.concat(customFieldFilters);

	}


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