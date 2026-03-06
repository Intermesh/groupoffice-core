import {BaseEntity} from "@intermesh/goui";
import {JmapDataSource} from "../../jmap";
export * from "./PdfTemplatePanel";
export * from './PdfTemplateTable';

export interface PdfTemplate extends BaseEntity {
	moduleId: string,
	name: string,
	key: string,
	language: string,
	stationaryBlobId: string|undefined,
	logoBlobId: string|undefined,
	landscape: boolean,
	pageSize: string,
	measureUnit: "mm"|"pt"|"cm"|"in"
	marginTop: number,
	marginRight: number,
	marginBottom: number,
	marginLeft: number,
	header: string|undefined,
	headerX: number|undefined,
	headerY: number|undefined,
	footer: string|undefined,
	footerX: number|undefined,
	footerY: number|undefined,
	fontFamily: string|undefined,
	fontSize: string|undefined,
	blocks: Array<PdfBlock>
}

export interface PdfBlock extends BaseEntity {
	pdfTemplateId: string,
	x: number|undefined,
	y: number|undefined,
	width: number|undefined,
	height: number|undefined,
	align: "L" | "C" | "R" | "J",
	content: string,
	type: "text"|"html"
}

export const pdfTemplateDS = new JmapDataSource<PdfTemplate>("PdfTemplate");