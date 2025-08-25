import {boolcolumn, column, datecolumn, datetimecolumn, Table, TableColumn} from "@intermesh/goui";
import {JmapDataSource} from "./jmap/index";
import {AclItemEntity, AclOwnerEntity} from "./auth/index";

export interface FieldSet extends AclOwnerEntity {
	name: string
	entity: string
	showAsTab: boolean
}

export interface Field extends AclItemEntity {
	fieldSetId: string
	name: string
	databaseName: string
	type: string,
	hiddenInGrid: boolean,
	required: boolean,
	hint?: string
}
export const fieldSetDS = new JmapDataSource<FieldSet>("FieldSet");
export const fieldDS = new JmapDataSource<Field>("Field");

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

	private tableColumnCreators: Record<string, (field:Field) => TableColumn> = {
		Date: f => datecolumn(this.getDefaultColumnConfig(f)),
		DateTime: f => datetimecolumn(this.getDefaultColumnConfig(f)),
		YesNo: f => boolcolumn(this.getDefaultColumnConfig(f)),
		Checkbox: f => boolcolumn(this.getDefaultColumnConfig(f)),
	};

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

	private fieldToTableColumn(f:Field) {
		console.log(f.type);
		return this.tableColumnCreators[f.type]
			? this.tableColumnCreators[f.type](f)
			: column(Object.assign(this.getDefaultColumnConfig(f), {width: 100})
			);
	}

	getTableColumns(entity:string) :TableColumn[] {
		return this.getEntityFields(entity).map(f => {
			return this.fieldToTableColumn(f);
		})
	}
}


export const customFields = new CustomFields();