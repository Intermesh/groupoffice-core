import {
	boolcolumn,
	column,
	datecolumn,
	datetimecolumn,
	Table,
	TableColumn,
	numbercolumn,
	textfield
} from "@intermesh/goui";
import {JmapDataSource, jmapds} from "./jmap/index";
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

type CustomFieldColumnCreator = (field:Field) => AbstractCustomField;


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


abstract class AbstractCustomField {
	constructor(protected readonly field: Field) {
	}

	public createFormField() {
		return textfield({
			name: this.field.name
		})
	}

	public createTableColumn() {
		return column(this.getColumnConfig());
	}

	protected getColumnConfig() {
		return {
			id: this.field.databaseName,
			property: "customFields/" + this.field.databaseName,
			header: this.field.name,
			hidden: this.field.hiddenInGrid,
			resizable: true
		}
	}
}

type ConstructableAbstractCustomField = {
	new (...args: ConstructorParameters<typeof AbstractCustomField>): AbstractCustomField;
};

class TextCustomField extends AbstractCustomField {

}

class DateCustomField extends AbstractCustomField {
	createTableColumn() {
		return datecolumn(this.getColumnConfig());
	}
}

class DateTimeCustomField extends AbstractCustomField {
	createTableColumn() {
		return datetimecolumn(this.getColumnConfig());
	}
}

class YesNoCustomField extends AbstractCustomField {
	createTableColumn() {
		return boolcolumn(this.getColumnConfig());
	}
}

class SelectCustomField extends AbstractCustomField {
	createTableColumn() {
		return column(
			Object.assign(
				this.getColumnConfig(), {
					width: 100,
					renderer:(columnValue: any, record: any, td: HTMLTableCellElement, table: Table, storeIndex: number, column: TableColumn)=> {
						const o = findSelectOption(columnValue, this.field.dataType.options!);
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
				}
			)
		)
	}
}

class MultiSelectCustomField extends AbstractCustomField {
	createTableColumn() {
		return column(
			Object.assign(
				this.getColumnConfig(), {
					width: 100,
					renderer:(columnValue: any, record: any, td: HTMLTableCellElement, table: Table, storeIndex: number, column: TableColumn)=> {
						if(!columnValue) {
							return "";
						}

						return columnValue.map((id:number) => findSelectOption(id, this.field.dataType.options!)?.text).join(", ")

					}
				}
			)
		)
	}
}

class UserCustomField extends AbstractCustomField {
	createTableColumn() {
		return column(
			Object.assign(
				this.getColumnConfig(), {
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
}

class NumberCustomField extends AbstractCustomField {
	createTableColumn() {
		return numbercolumn(Object.assign(this.getColumnConfig(),  {decimals: this.field.options.decimals}))
	}
}


class GroupCustomField extends AbstractCustomField {
	createTableColumn() {
		return column(
			Object.assign(
				this.getColumnConfig(), {
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

class HtmlCustomField extends AbstractCustomField {
	protected getColumnConfig(): { id: string; property: string; header: string; hidden: boolean; resizable: boolean } {
		return Object.assign(super.getColumnConfig(), {renderer: (v:string|undefined) => v ? v.stripTags() : ""});
	}
}

class TextAreaCustomField extends AbstractCustomField {
	protected getColumnConfig(): { id: string; property: string; header: string; hidden: boolean; resizable: boolean } {
		return Object.assign(super.getColumnConfig(), {renderer: (v:string|undefined)=> v ? v.replace(/\n/g, " ") : ""});
	}
}


class ProjectCustomField extends AbstractCustomField {
	createTableColumn() {
		return column(
			Object.assign(
				this.getColumnConfig(), {
					width: 100,
					renderer: async (columnValue: any, record: any, td: HTMLTableCellElement, table: Table, storeIndex: number, column: TableColumn)=> {
						if(!columnValue) {
							return "";
						}
						const u = await jmapds("Project").single(columnValue);
						return u ? u.name : "";
					}
				})
		)

	}
}

class ContactCustomField extends AbstractCustomField {
	createTableColumn() {
		return column(
			Object.assign(
				this.getColumnConfig(), {
					width: 100,
					renderer: async (columnValue: any, record: any, td: HTMLTableCellElement, table: Table, storeIndex: number, column: TableColumn)=> {
						if(!columnValue) {
							return "";
						}
						const u = await jmapds("Contact").single(columnValue);
						return u ? u.name : "";
					}
				})
		)

	}
}



class CustomFields {
	private fieldSets: Record<string, FieldSet[]> = {};
	private fields: Record<string, Field[]> = {};


	public async init() {
		const fs = await fieldSetDS.get();
		fs.list.forEach(fs => {
			if (!this.fieldSets[fs.entity])
				this.fieldSets[fs.entity] = [];

			this.fieldSets[fs.entity].push(fs);
		})

		const f = await fieldDS.get();
		f.list.forEach(f => {
			if (!this.fields[f.fieldSetId])
				this.fields[f.fieldSetId] = [];

			this.fields[f.fieldSetId].push(f);
		})
	}

	getEntityFields(entity: string) {
		const f: Field[] = [];

		if (!this.fieldSets[entity]) {
			return f;
		}

		this.fieldSets[entity].forEach(fs => {
			if (this.fields[fs.id]) {
				f.push(...this.fields[fs.id]);
			}
		})

		return f;
	}

	private types: Record<string, ConstructableAbstractCustomField> = {
		Date: DateCustomField,
		DateTime: DateTimeCustomField,
		YesNo: YesNoCustomField,
		Checkbox: YesNoCustomField,
		Select: SelectCustomField,
		MultiSelect: MultiSelectCustomField,
		User: UserCustomField,
		Number: NumberCustomField,
		FunctionField: NumberCustomField,
		Group: GroupCustomField,
		Html: HtmlCustomField,
		TextArea: TextAreaCustomField,
		Text: TextCustomField,

		// Todo, these should be added by the modules using registerTableColumnCreator
		Project: ProjectCustomField,
		Contact: ContactCustomField,
	}


	public registerType(type: string, cf: ConstructableAbstractCustomField) {
		this.types[type] = cf;
	}


	private getType(f: Field) {
		return this.types[f.type]
			? new this.types[f.type](f)
			: new this.types["Text"](f)
	}

	getTableColumns(entity: string): TableColumn[] {
		return this.getEntityFields(entity).map(f => {
			return this.getType(f).createTableColumn();
		})
	}
}
export const customFields = new CustomFields();