import {BaseEntity, EntityID} from "@intermesh/goui";
import {JmapDataSource} from "../jmap/index";
import {Acl} from "../auth/index";

export interface Link extends BaseEntity {
	toId: EntityID,
	toEntity: string,
	fromId: EntityID
	fromEntity: string
	/**
	 * Key to Search entity
	 */
	toSearchId: EntityID,
	modifiedAt: string
}


export const linkDS = new JmapDataSource<Link>("Link")

export interface Search extends BaseEntity {
	id: EntityID,
	name: string,
	description: string,
	modifiedAt: string
	acl: Acl,
	permissionLevel: number,
	entity: string,
	entityId: EntityID
	filter: string
}
export const searchDS = new JmapDataSource<Search>("Search");