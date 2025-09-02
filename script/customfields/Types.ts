import {jmapds} from "../jmap/index.js";
import {groupDS, principalDS} from "../auth/index.js";
import {Field, SelectOption} from "./CustomFields.js";
import {
	boolcolumn,
	column,
	datecolumn,
	numbercolumn,
	datetimecolumn,
	Table,
	TableColumn,
	textfield,
	TextField, Config, t, datefield,
	Field as FormField, datetimefield, checkbox, select, numberfield, htmlfield, textarea
} from "@intermesh/goui";


/**
 * TODO:
 *
 * TreeSelectField
 * requiredCondition
 * suffix
 * prefix
 *
 */

export abstract class AbstractCustomField {
	constructor(protected readonly field: Field) {
	}

	public createFormField() : FormField {
		return textfield(this.getFormFieldConfig())
	}

	protected getFormFieldConfig() :any  {



		const cfg:Config<FormField> = {
			name: this.field.databaseName,
			hint: this.field.hint,
			required: this.field.required,
			label: this.field.name,
			value: this.field.default,
			hidden: !!this.field.conditionallyHidden
		};

		if(this.field.options.validationRegex) {
			cfg.listeners = {
				validate: ({target}) => {
					const rgx = new RegExp(this.field.options.validationRegex!, this.field.options.validationModifiers || undefined);
					if(!target.value || !(target.value as string).match(rgx)) {
						target.setInvalid(t("Invalid input"))
					}
				}
			}
		}

		return cfg;
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

export class TextCustomField extends AbstractCustomField {

}

export class DateCustomField extends AbstractCustomField {
	createTableColumn() {
		return datecolumn(this.getColumnConfig());
	}

	public createFormField() {
		return datefield(this.getFormFieldConfig())
	}
}

export class DateTimeCustomField extends AbstractCustomField {
	createTableColumn() {
		return datetimecolumn(this.getColumnConfig());
	}

	public createFormField() {
		return datetimefield(this.getFormFieldConfig())
	}
}

export class YesNoCustomField extends AbstractCustomField {
	createTableColumn() {
		return boolcolumn(this.getColumnConfig());
	}

	public createFormField() {
		return select(
			Object.assign(
				this.getFormFieldConfig(),
				{
					options: [
						{value: null, name: ""},
						{value: 0, name: t("No")},
						{value: 1, name: t("Yes")}
					]
				})
		);
	}
}

export class CheckboxCustomField extends AbstractCustomField {
	createTableColumn() {
		return boolcolumn(this.getColumnConfig());
	}

	public createFormField() {
		return checkbox(this.getFormFieldConfig())
	}
}

export class SelectCustomField extends AbstractCustomField {

	protected findSelectOption(optionId: number, options: SelectOption[], path: string = ""): (SelectOption & {
		path: string
	}) | undefined {
		if (!optionId) {
			return undefined;
		}

		if (!path) {
			path = "";
		}
		let o;
		for (let i = 0, l = options.length; i < l; i++) {
			o = options[i];
			if (o.id == optionId) {

				if (path) {
					path += " > ";
				}
				path += o.text;

				return Object.assign(o, {path});
			}

			if (o.children) {
				const nested = this.findSelectOption(optionId, o.children, path + " > " + o.text);
				if (nested) {
					return nested;
				}
			}
		}

		return undefined;
	}

	createTableColumn() {
		return column(
			Object.assign(
				this.getColumnConfig(), {
					width: 100,
					renderer: (columnValue: any, record: any, td: HTMLTableCellElement, table: Table, storeIndex: number, column: TableColumn) => {
						const o = this.findSelectOption(columnValue, this.field.dataType.options!);
						if (!o) {
							return "";
						}

						const styleEl = o.renderMode == "cell" ? td : td.parentElement as HTMLTableRowElement;

						if (o.foregroundColor) {
							styleEl.style.color = "#" + o.foregroundColor;
						}

						if (o.backgroundColor) {
							styleEl.style.backgroundColor = "#" + o.backgroundColor;
						}

						return o.path;
					}
				}
			)
		)
	}

	createFormField() {
		return select(
			Object.assign(
				this.getFormFieldConfig(),
				{
					options: this.field.dataType.options!.map(o => {
						return {value: o.id, name: o.text}
					}
				)
			}
		)
		);
	}
}

export class MultiSelectCustomField extends SelectCustomField {
	createTableColumn() {
		return column(
			Object.assign(
				this.getColumnConfig(), {
					width: 100,
					renderer: (columnValue: any, record: any, td: HTMLTableCellElement, table: Table, storeIndex: number, column: TableColumn) => {
						if (!columnValue) {
							return "";
						}

						return columnValue.map((id: number) => this.findSelectOption(id, this.field.dataType.options!)?.text).join(", ")

					}
				}
			)
		)
	}
}

export class UserCustomField extends AbstractCustomField {
	createTableColumn() {
		return column(
			Object.assign(
				this.getColumnConfig(), {
					width: 100,
					renderer: async (columnValue: any, record: any, td: HTMLTableCellElement, table: Table, storeIndex: number, column: TableColumn) => {
						if (!columnValue) {
							return "";
						}
						const u = await principalDS.single(columnValue);
						return u ? u.name : "";
					}
				})
		)
	}
}

export class NumberCustomField extends AbstractCustomField {
	createTableColumn() {
		return numbercolumn(Object.assign(this.getColumnConfig(), {decimals: this.field.options.decimals}))
	}

	public createFormField() {
		return numberfield(Object.assign(this.getFormFieldConfig(), {decimals: this.field.options.decimals}));
	}
}

export class GroupCustomField extends AbstractCustomField {
	createTableColumn() {
		return column(
			Object.assign(
				this.getColumnConfig(), {
					width: 100,
					renderer: async (columnValue: any, record: any, td: HTMLTableCellElement, table: Table, storeIndex: number, column: TableColumn) => {
						if (!columnValue) {
							return "";
						}
						const u = await groupDS.single(columnValue);
						return u ? u.name : "";
					}
				})
		)

	}
}

export class HtmlCustomField extends AbstractCustomField {
	protected getColumnConfig(): { id: string; property: string; header: string; hidden: boolean; resizable: boolean } {
		return Object.assign(super.getColumnConfig(), {renderer: (v: string | undefined) => v ? v.stripTags() : ""});
	}

	public createFormField() {
		return htmlfield(this.getFormFieldConfig());
	}
}

export class TextAreaCustomField extends AbstractCustomField {
	protected getColumnConfig(): { id: string; property: string; header: string; hidden: boolean; resizable: boolean } {
		return Object.assign(super.getColumnConfig(), {renderer: (v: string | undefined) => v ? v.replace(/\n/g, " ") : ""});
	}

	public createFormField() {
		return textarea(this.getFormFieldConfig());
	}
}

export class ProjectCustomField extends AbstractCustomField {
	createTableColumn() {
		return column(
			Object.assign(
				this.getColumnConfig(), {
					width: 100,
					renderer: async (columnValue: any, record: any, td: HTMLTableCellElement, table: Table, storeIndex: number, column: TableColumn) => {
						if (!columnValue) {
							return "";
						}
						const u = await jmapds("Project").single(columnValue);
						return u ? u.name : "";
					}
				})
		)

	}
}

export class ContactCustomField extends AbstractCustomField {
	createTableColumn() {
		return column(
			Object.assign(
				this.getColumnConfig(), {
					width: 100,
					renderer: async (columnValue: any, record: any, td: HTMLTableCellElement, table: Table, storeIndex: number, column: TableColumn) => {
						if (!columnValue) {
							return "";
						}
						const u = await jmapds("Contact").single(columnValue);
						return u ? u.name : "";
					}
				})
		)

	}
}