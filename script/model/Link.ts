import {BaseEntity, EntityID} from "@intermesh/goui";

export interface Link extends BaseEntity {
	toId: EntityID,
	toEntity: string,
	fromId: EntityID
	fromEntity: string
}