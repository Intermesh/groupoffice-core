import {EntityID, TableColumn} from "@intermesh/goui";
import {JmapDataSource} from "../jmap/index.js";
import {AclItemEntity, AclOwnerEntity} from "../auth/index.js";
import {Type} from "./type/index.js";


export interface FieldSet extends AclOwnerEntity {
	name: string
	description?:string
	entity: string
	isTab: boolean,
	collapseIfEmpty: boolean,
	parentFieldSetId: EntityID|undefined,
	columns: number,
	sortOrder: number,
	aclId: number
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
	new (...args: ConstructorParameters<typeof Type>): Type;
};



class CustomFields {
	private fieldSets: Record<string, FieldSet[]> = {};
	private fields: Record<string, Field[]> = {};


	public async init() {
		return Promise.all([
			fieldSetDS.get().then(fs => {
				fs.list.forEach(fs => {
					if (!this.fieldSets[fs.entity])
						this.fieldSets[fs.entity] = [];

					this.fieldSets[fs.entity].push(fs);
				})
			}),

			fieldDS.get().then(f => {
				f.list.forEach(f => {
					if (!this.fields[f.fieldSetId])
						this.fields[f.fieldSetId] = [];

					this.fields[f.fieldSetId].push(f);
				})
			})
		])
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
		return this.fields[fieldSet.id] ?? [];
	}

	private types: Record<string, ConstructableAbstractCustomField> = {

	}


	public registerType(cf: ConstructableAbstractCustomField) {
		this.types[cf.name] = cf;
	}

	public getTypes() {
		return Object.keys(this.types);
	}


	public getType(type: string) {

		return this.types[type]
			? new this.types[type]()
			: new this.types["Text"]()
	}

	public getTableColumns(entity: string): TableColumn[] {
		return this.getEntityFields(entity).map(f => {
			return this.getType(f.type).createTableColumn(f);
		}).filter(c => c !== undefined);
	}


}

export const customFields = new CustomFields();