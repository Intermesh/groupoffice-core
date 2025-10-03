import {EntityID, TableColumn} from "@intermesh/goui";
import {JmapDataSource} from "../jmap/index.js";
import {AclItemEntity, AclOwnerEntity} from "../auth/index.js";
import {
	AbstractCustomField, CheckboxCustomField,
	ContactCustomField,
	DateCustomField,
	DateTimeCustomField, FileCustomField, FunctionCustomField,
	GroupCustomField,
	HtmlCustomField,
	MultiSelectCustomField, NotesCustomField,
	NumberCustomField,
	ProjectCustomField,
	SelectCustomField, TemplateCustomField,
	TextAreaCustomField,
	TextCustomField,
	UserCustomField,
	YesNoCustomField
} from "./Types.js";


export interface FieldSet extends AclOwnerEntity {
	name: string
	description?:string
	entity: string
	isTab: boolean,
	collapseIfEmpty: boolean,
	parentFieldSetId: EntityID|undefined,
	columns: number
}

export type SelectOption = {
	id: number
	text:string
	children:SelectOption[],
	renderMode: "cell" | "row"
	foregroundColor: string
	backgroundColor: string
	parents?: SelectOption[]
}

export interface Field extends AclItemEntity {
	fieldSetId: string
	name: string
	default:any
	conditionallyHidden: boolean,
	conditionallyRequired: boolean,
	relatedFieldCondition?:string,
	databaseName: string
	type: string,
	hiddenInGrid: boolean,
	required: boolean,
	hint?: string,
	options: {
		validationRegex?:string
		validationModifiers?:string
		maxLength?:string
		[key:string]: any
	},
	prefix?:string,
	suffix?:string
	dataType: {
		options?: SelectOption[]
	}
}
export const fieldSetDS = new JmapDataSource<FieldSet>("FieldSet");
export const fieldDS = new JmapDataSource<Field>("Field");


type ConstructableAbstractCustomField = {
	new (...args: ConstructorParameters<typeof AbstractCustomField>): AbstractCustomField;
};



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

	getFieldSets(entity: string) {
		return this.fieldSets[entity] ?? [];
	}

	getFieldSetFields(fieldSet: FieldSet) {
		return this.fields[fieldSet.id];
	}

	private types: Record<string, ConstructableAbstractCustomField> = {
		Date: DateCustomField,
		DateTime: DateTimeCustomField,
		YesNo: YesNoCustomField,
		Checkbox: CheckboxCustomField,
		Select: SelectCustomField,
		MultiSelect: MultiSelectCustomField,
		User: UserCustomField,
		Number: NumberCustomField,
		FunctionField: FunctionCustomField,
		Group: GroupCustomField,
		Html: HtmlCustomField,
		TextArea: TextAreaCustomField,
		Text: TextCustomField,
		Notes: NotesCustomField,
		Template: TemplateCustomField,

		// Todo, these should be added by the modules using registerTableColumnCreator
		Project: ProjectCustomField,
		Contact: ContactCustomField,
		File: FileCustomField
	}


	public registerType(type: string, cf: ConstructableAbstractCustomField) {
		this.types[type] = cf;
	}


	public getType(f: Field) {

		return this.types[f.type]
			? new this.types[f.type](f)
			: new this.types["Text"](f)
	}

	public getTableColumns(entity: string): TableColumn[] {
		return this.getEntityFields(entity).map(f => {
			return this.getType(f).createTableColumn();
		}).filter(c => c !== undefined);
	}


}

export const customFields = new CustomFields();