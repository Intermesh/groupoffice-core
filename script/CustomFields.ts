import {
	boolcolumn,
	column,
	datecolumn,
	datetimecolumn,
	Table,
	TableColumn,
	numbercolumn,
	TableColumnConfig,
	Format
} from "@intermesh/goui";
import {JmapDataSource} from "./jmap/index";
import {AclItemEntity, AclOwnerEntity, groupDS, principalDS} from "./auth/index";


export interface FieldSet extends AclOwnerEntity {
	name: string
	entity: string
	showAsTab: boolean
}

type SelectOption = {
	id: number
	text:string
	children:SelectOption[],
	renderMode: "cell" | "row"
	foregroundColor: string
	backgroundColor: string
}

export interface Field extends AclItemEntity {
	fieldSetId: string
	name: string
	databaseName: string
	type: string,
	hiddenInGrid: boolean,
	required: boolean,
	hint?: string,
	options: any,
	dataType: {
		options?: SelectOption[]
	}
}
export const fieldSetDS = new JmapDataSource<FieldSet>("FieldSet");
export const fieldDS = new JmapDataSource<Field>("Field");

type CustomFieldColumnCreator = (field:Field) => TableColumn;


function findSelectOption (optionId:number, options:SelectOption[], path:string = ""): (SelectOption & {path:string})|undefined{
	if(!optionId){
		return undefined;
	}

	if(!path) {
		path = "";
	}
	let o;
	for(let i = 0, l = options.length; i < l; i++) {
		o = options[i];
		if(o.id == optionId) {

			if(path) {
				path += " > ";
			}
			path += o.text;

			return Object.assign(o, {path});
		}

		if(o.children) {
			const nested = findSelectOption(optionId, o.children, path + " > " + o.text);
			if(nested) {
				return nested;
			}
		}
	}

	return undefined;
}

class CustomFields {
	private fieldSets: Record<string, FieldSet[]> = {};
	private fields: Record<string, Field[]> = {};


	public async init() {
		 const fs = await fieldSetDS.get();
		 fs.list.forEach(fs => {
			 if(!this.fieldSets[fs.entity])
			 	this.fieldSets[fs.entity] = [];

			 this.fieldSets[fs.entity].push(fs);
		 })

		const f = await fieldDS.get();
		 f.list.forEach(f => {
			 if(!this.fields[f.fieldSetId])
				 this.fields[f.fieldSetId] = [];

			 this.fields[f.fieldSetId].push(f);
		 })
	}

	getEntityFields(entity:string) {
		const f:Field[] = [];

		if(!this.fieldSets[entity]) {
			return f;
		}

		this.fieldSets[entity].forEach(fs => {
			if(this.fields[fs.id]) {
				f.push(...this.fields[fs.id]);
			}
		})

		return f;
	}

	private tableColumnCreators: Record<string, CustomFieldColumnCreator> = {
		Date: f => datecolumn(this.getDefaultColumnConfig(f)),
		DateTime: f => datetimecolumn(this.getDefaultColumnConfig(f)),
		YesNo: f => boolcolumn(this.getDefaultColumnConfig(f)),
		Checkbox: f => boolcolumn(this.getDefaultColumnConfig(f)),
		Select: f => this.createSelectColumn(f),
		User: f => this.createUserColumn(f),
		Number: f => numbercolumn(Object.assign(this.getDefaultColumnConfig(f),  {decimals: f.options.decimals})),
		FunctionField: f => numbercolumn(Object.assign(this.getDefaultColumnConfig(f),  {decimals: f.options.decimals})),
		Group: f => this.createGroupColumn(f),
		Html: f =>this.createDefaultColumn(f, {renderer: (v:string|undefined) => v ? v.stripTags() : ""}),
		TextArea: f => this.createDefaultColumn(f, {renderer: (v:string|undefined)=> v ? v.replace(/\n/g, " ") : ""} )
	}

	private createSelectColumn(f:Field) {
		return column(
			Object.assign(
				this.getDefaultColumnConfig(f), {
					width: 100,
					renderer:(columnValue: any, record: any, td: HTMLTableCellElement, table: Table, storeIndex: number, column: TableColumn)=> {
						const o = findSelectOption(columnValue, f.dataType.options!);
						if(!o) {
							return "";
						}

						const styleEl = o.renderMode == "cell" ? td : td.parentElement as HTMLTableRowElement;

						if (o.foregroundColor) {
							styleEl.style.color = "#" + o.foregroundColor;
						}

						if(o.backgroundColor) {
							styleEl.style.backgroundColor = "#" + o.backgroundColor;
						}

						return o.path;
					}
				})
		)
	}


	public registerTableColumnCreator(type:string, fn:CustomFieldColumnCreator) {
		this.tableColumnCreators[type] = fn;
	}

	private getDefaultColumnConfig(f:Field) {
		return {
			id: f.databaseName,
			property: "customFields/" + f.databaseName,
			header: f.name,
			hidden: f.hiddenInGrid,
			resizable: true,
			// renderer: (columnValue: any, record: any, td: HTMLTableCellElement, table: Table, storeIndex: number, column: TableColumn)=> {
			// 	// TODO eliminate Extjs
			// 	const type = go.customfields.CustomFields.getType(f.type);
			// 	const cmp = new go.detail.Property();
			// 	const v = ( type ? type.renderDetailView(columnValue, record, f) : columnValue);
			// 	return v ? v +"" : "";
			// }
		}
	}

	private createDefaultColumn(f:Field, cfg:Partial<TableColumnConfig>) {
		return column(Object.assign(this.getDefaultColumnConfig(f), cfg));
	}

	private fieldToTableColumn(f:Field) {
		console.log(f.type);
		return this.tableColumnCreators[f.type]
			? this.tableColumnCreators[f.type](f)
			: this.createDefaultColumn(f, {width: 100})
	}

	getTableColumns(entity:string) :TableColumn[] {
		return this.getEntityFields(entity).map(f => {
			return this.fieldToTableColumn(f);
		})
	}

	private createUserColumn(f: Field) {
		return column(
			Object.assign(
				this.getDefaultColumnConfig(f), {
					width: 100,
					renderer: async (columnValue: any, record: any, td: HTMLTableCellElement, table: Table, storeIndex: number, column: TableColumn)=> {
						if(!columnValue) {
							return "";
						}
						const u = await principalDS.single(columnValue);
						return u ? u.name : "";
					}
				})
		)
	}

	private createGroupColumn(f: Field) {
		return column(
			Object.assign(
				this.getDefaultColumnConfig(f), {
					width: 100,
					renderer: async (columnValue: any, record: any, td: HTMLTableCellElement, table: Table, storeIndex: number, column: TableColumn)=> {
						if(!columnValue) {
							return "";
						}
						const u = await groupDS.single(columnValue);
						return u ? u.name : "";
					}
				})
		)
	}
}


export const customFields = new CustomFields();