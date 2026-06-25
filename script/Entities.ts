import {EntityConfig, EntityFilter, EntityLink, modules} from "./Modules.js";
import {EntityID, t} from "@intermesh/goui";
import {customFields, Field} from "./customfields/index.js";

export type EntityRelation = {store: string, fk: string};

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
	relations: Record<string, EntityRelation>
}

export interface LinkConfig extends EntityLink {
	title: string,
	entity: string,
}



class Entities {
	private entities: Record<string, Entity> = {};
	private registered: Record<string, EntityConfig & {package:string, module:string}> = {};

	/**
	 * Populate some entity properties with server info.
	 *
	 * Called in mainlayout after authentication and loading of custom fields and modules.
	 */
	init() {


		for(let lcName in this.registered) {

			const entity = this.registered[lcName] as unknown as Entity;

			const module = modules.get(entity.package, entity.module);

			if(!module) {
				console.warn("Module not found for entity: ", entity)
				continue;
			}

			if (!entity.title) {
				entity.title = t(entity.name);
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

			entity.filters = entity.filters ?? [{
				name: 'text',
				type: "string",
				multiple: false,
				title: t("Query")
			}];

			if (entity.supportsCustomFields) {
				this.applyCustomFieldFilters(entity);
			}

			entity.filters = this.normalizeFilters(entity.filters as EntityFilter[])
			entity.links = this.normalizeLinks(entity)
			entity.relations = entity.relations || {};
			entity.relations = {...entity.relations, ...customFields.getRelations(entity.name)};

			this.entities[entity.name.toLowerCase()] = entity;
		}

	}

	private normalizeLinks(entity:Entity) {

		if(!entity.links) {
			entity.links = [];
		}
		return entity.links.map(l => {
			l.entity = entity.name;

			if (!l.title) {
				l.title = entity.title;
			}
			if (!l.iconCls) {
				l.iconCls = "entity " + l.entity;
			}
			return l;
		});
	}

	private normalizeFilters(filters:EntityFilter[]) {
		return Object.fromEntries(filters.map(item => {
			if(item.wildcards === undefined) {
				item.wildcards = item.type == "string" && item.name != 'text';
			}
			return [item.name.toLowerCase(), item]
		}));
	}


	private applyCustomFieldFilters(entity:Entity) {

		const existingNames = entity.filters.map((e:EntityFilter) => e.name);

		let customFieldFilters = customFields.getFilters(entity.name)

		customFieldFilters = customFieldFilters.filter((f)=> {
			const exists = existingNames.indexOf(f.name) > -1;
			if(exists) {
				console.warn("Custom field name " + f.name+ " can't be filtered as the name conflicts with an existing filter for entity " + entity.name);
			}
			return !exists;

		});
		entity.filters = entity.filters.concat(customFieldFilters);

	}

	public findRelation(entity:Entity, path:string) : EntityRelation | undefined {

		let parts = path.split("."), last = parts.pop(), current = entity.relations as any;

		parts.forEach(function(p) {
			if(!current[p]) {
				current[p] = {};
			}

			current = current[p];
		});

		if(!last || !current[last]) {
			return undefined;
		}
		current[last].path = parts.length > 0 ? parts.join('.') + "." : "";
		return current[last];
	}


	public get(name: string) : Entity {
		const e=  this.entities[name.toLowerCase()];
		if(!e) {
			debugger;
			throw ` Entity '${name}' not found!`;
		}
		return e;
	}

	public exists(name: string) {
		return !!this.entities[name.toLowerCase()];
	}

	public getAvailable() : Entity[] {
		const e = [];
		for (let name in this.entities) {
			if (modules.isAvailable(this.entities[name].package, this.entities[name].module)) {
				e.push(this.entities[name]);
			}
		}

		return e;
	}

	public getAll() : Entity[] {
		return Object.values(this.entities);
	}
	
	register(entityCfg:EntityConfig & {package:string, module:string}) {
		this.registered[entityCfg.name.toLowerCase()] = entityCfg;
	}


	/**
	 * Get link configurations as defined in Module.js with go.Modules.register();
	 */
	getLinkConfigs() : LinkConfig[] {
		const linkConfigs:LinkConfig[] = [];

		this.getAvailable().forEach(function (m) {
			linkConfigs.push(...m.links);
		});

		linkConfigs.sort(function (a, b) {
			return a.title.localeCompare(b.title);
		});

		return linkConfigs;
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