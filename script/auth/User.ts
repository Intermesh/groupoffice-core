import {DefaultEntity} from "@intermesh/goui";

export interface User extends DefaultEntity {
	username?: string,
	displayName?: string,
	profile?: any,
	email?: string,
	dateFormat:string,
	timeFormat:string,
	timezone:string,
	avatarId?:string,
	mail_reminders: boolean
}

export interface Principal extends DefaultEntity {
	id:string
	name: string
	email?: string
	description?:string
	timeZone?:string
	avatarId?:string
	type: string
}