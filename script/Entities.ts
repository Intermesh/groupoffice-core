import {modules} from "./Modules";

export interface Entity {
	name: string,
	defaultAcl: Record<string, number>,
	isAclOwner: boolean,
	supportsCustomFields: boolean,
	supportsFiles: boolean
}


class Entities {
	private entities?: Record<string, Entity>;
	public async get(name:string) {
		if(!this.entities) {
			this.entities = {};

			const mods = await modules.getAll();
			mods.forEach(m => {
				for(let name in m.entities) {
					this.entities![name] = m.entities[name];
				}
			})
		}

		return this.entities[name] ?? undefined;
	}
}

export const entities = new Entities();