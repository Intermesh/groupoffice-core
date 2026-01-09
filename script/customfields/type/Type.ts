import {
	column,
	Component,
	Config,
	displayfield,
	Field as FormField,
	MaterialIcon,
	t,
	TableColumn, TableColumnConfig
} from "@intermesh/goui";
import {FieldDialog} from "../FieldDialog.js";
import {Field} from "../CustomFields.js";

export abstract class Type {

	constructor(
		public readonly name: string,
		public readonly icon: MaterialIcon,
		public readonly label: string
	) {
	}

	public createFormField(field: Field) : Component|undefined {
		return undefined;
	}

	public createDetailField(field: Field) : Component|undefined {
		return displayfield(this.getDetailFieldConfig(field));
	}

	protected getDetailFieldConfig(field: Field) : Config<FormField> {
		return {
			name: field.databaseName,
			hidden:true,
			label: field.name
		};

	}

	protected getFormFieldConfig(field: Field) :any  {
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

	public createTableColumn(field: Field) : TableColumn|undefined {
		return column(this.getColumnConfig(field));
	}

	protected getColumnConfig(field: Field) : TableColumnConfig {
		return {
			id: field.databaseName,
			property: "customFields/" + field.databaseName,
			header: field.name,
			hidden: field.hiddenInGrid,
			resizable: true
		}
	}

	abstract getDialog(): FieldDialog;
}