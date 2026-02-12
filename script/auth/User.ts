import {BaseEntity, DefaultEntity, EntityID} from "@intermesh/goui";
import {JmapDataSource} from "../jmap/index";

export interface User extends AclOwnerEntity {
	username: string,
	displayName: string,
	profile?: any,
	email: string,
	dateFormat:string,
	timeFormat:string,
	timezone:string,
	avatarId?:string,
	mail_reminders: boolean,
	isAdmin: boolean,
	// user can be extended dynamically by modules
	[key:string]: any
}

export interface Principal extends DefaultEntity {
	id:string
	name: string
	email: string | undefined
	description:string  | undefined
	timeZone:string  | undefined
	avatarId:string  | undefined
	type: string
}


export interface Group extends DefaultEntity {
	id:string
	name: string
	users: EntityID[],
	acl: Acl,
	permissionLevel: number
}

/**
 * Access Control List permission levels
 */
export enum AclLevel {
	READ= 10,
	CREATE= 20,
	WRITE = 30,
	DELETE = 40,
	MANAGE = 50
}

/**
 * Access Control List
 *
 * Key is the groupId and value is the permission level
 */
export type Acl = Record<EntityID, AclLevel>;

export interface AclItemEntity extends BaseEntity {
	/**
	 * The permission level opf the current user
	 */
	permissionLevel: AclLevel
}
export interface AclOwnerEntity extends AclItemEntity {
	/**
	 * The Access Control List
	 */
	acl: Acl
}

export const userDS = new JmapDataSource<User>("User");
export const principalDS = new JmapDataSource<Principal>("Principal");

export const groupDS = new JmapDataSource<Group>("Group");