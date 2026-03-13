import {JmapDataSource} from "../../jmap";
import {BaseEntity} from "@intermesh/goui";
export * from './EmailTemplatePanel';
export * from "./EmailTemplateTable";

export interface EmailTemplate extends BaseEntity {
	moduleId: string,
	key: string,
	language: string,
	name: string,
	subject: string,
	body: string
}

export const emailTemplateDS = new JmapDataSource<EmailTemplate>("EmailTemplate");