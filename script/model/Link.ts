import {BaseEntity, EntityID} from "@intermesh/goui";
import {JmapDataSource} from "../jmap/index";

export interface Link extends BaseEntity {
	toId: EntityID,
	toEntity: string,
	fromId: EntityID
	fromEntity: string
}


export const linkDS = new JmapDataSource<Link>("Link")