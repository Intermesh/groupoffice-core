import {
	column,
	Component,
	Config,
	displayfield,
	Field as FormField,
	MaterialIcon,
	t,
	TableColumn,
	TableColumnConfig
} from "@intermesh/goui";
import {CustomFieldDialog} from "../CustomFieldDialog.js";
import {CustomField} from "../CustomFields.js";
import {EntityFilter} from "../../Modules.js";
import {EntityRelation} from "../../Entities.js";

export abstract class CustomFieldType {

	constructor(
		public readonly name: string,
		public readonly icon: MaterialIcon,
		public readonly label: string
	) {
	}

	public createFormField(field: CustomField) : Component|undefined {
		return undefined;
	}

	public createDetailField(field: CustomField) : Component|undefined {
		return displayfield(this.getDetailFieldConfig(field));
	}

	protected getDetailFieldConfig(field: CustomField) : Config<FormField> {
		return {
			name: field.databaseName,
			hidden:true,
			label: field.name
		};

	}

	protected getFormFieldConfig(field: CustomField) :any  {
		const cfg:Config<FormField> = {
			name: field.databaseName,
			hint: field.hint,
			required: field.required,
			label: field.name,
			value: field.default,
			hidden: field.conditionallyHidden
		};


		if(field.prefix) {
			cfg.label +=  ' (' + field.prefix + ')';
		}

		if(field.options.validationRegex) {
			cfg.listeners = {
				validate: ({target}) => {
					const rgx = new RegExp(field.options.validationRegex!, field.options.validationModifiers || undefined);
					if(!target.value || !(target.value as string).match(rgx)) {
						target.setInvalid(t("Invalid input"))
					}
				}
			}
		}

		return cfg;
	}

	public createTableColumn(field: CustomField) : TableColumn|undefined {
		return column(this.getColumnConfig(field));
	}

	protected getColumnConfig(field: CustomField) : TableColumnConfig {
		return {
			id: field.databaseName,
			property: "customFields/" + field.databaseName,
			header: field.name,
			hidden: field.hiddenInGrid,
			resizable: true
		}
	}

	getFilter (field:CustomField) : EntityFilter | undefined {
		if(!field.databaseName) {
			return undefined;
		}
		return {
			name: field.databaseName,
			type: "string",
			wildcards: true,
			multiple: true,
			title: field.name,
			customfield: field
		}
	}

	getRelations(customField:CustomField) : Record<string, EntityRelation> {
		return {};
	}

	abstract getDialog(): CustomFieldDialog;
}