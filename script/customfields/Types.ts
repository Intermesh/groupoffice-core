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
	TableColumnConfig, Config, t, datefield,
	Field as FormField, datetimefield, checkbox, select, numberfield, htmlfield, textarea, table, datasourcestore,
	autocompletechips, store, combobox, btn, ComboBox, span, Component, p, TextField
} from "@intermesh/goui";
import {principalcombo} from "../components/index";
import {groupcombo} from "../components/GroupCombo";
import {treeselect} from "./TreeSelectField";


/**
 * TODO:
 *
 * requiredCondition
 *
 * detail view
 *
 * MultiContact
 *
 * collapse if empty
 *
 */

export abstract class AbstractCustomField {
	constructor(protected readonly field: Field) {
	}

	public createFormField() : Component|undefined {
		return undefined;
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


		if(this.field.prefix) {
			cfg.label +=  ' (' + this.field.prefix + ')';
		}

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

	public createTableColumn() : TableColumn|undefined {
		return column(this.getColumnConfig());
	}

	protected getColumnConfig() : TableColumnConfig {
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
	public createFormField() : Component|undefined {
		return textfield(this.getFormFieldConfig())
	}
}

export class TemplateCustomField extends AbstractCustomField {
}

export class NotesCustomField extends AbstractCustomField {
	createFormField() {
		return p({html: this.field.options.formNotes});
	}

	createTableColumn() {
		return  undefined;
	}
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
		return select({
			...this.getFormFieldConfig(),
			options: [
				{value: null, name: ""},
				{value: 0, name: t("No")},
				{value: 1, name: t("Yes")}
			]
		});
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
		return column({
			...this.getColumnConfig(),
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
		})
	}

	createFormField() {

		return treeselect(
			{
				...this.getFormFieldConfig(),
				options: this.field.dataType.options!
			}
		);
	}
}

export class MultiSelectCustomField extends SelectCustomField {
	createTableColumn() {
		return column(
			{
				...this.getColumnConfig(),
				width: 100,
				renderer: (columnValue: any, record: any, td: HTMLTableCellElement, table: Table, storeIndex: number, column: TableColumn) => {
					if (!columnValue) {
						return "";
					}

					return columnValue.map((id: number) => this.findSelectOption(id, this.field.dataType.options!)?.text).join(", ")

				}
			}

		)
	}

	createFormField(): any {

		return autocompletechips({
			...this.getFormFieldConfig(),
			listeners: {
				autocomplete: ({target, input}) => {

				}
			},

			chipRenderer: (chip, value) => {
				chip.text = this.findSelectOption(value, this.field.dataType.options!)?.text ?? "?";
			},
			pickerRecordToValue (field, record) : any {
				return record.id;
			},

			list: table({
				fitParent: true,
				headers: false,
				store: store({
					data: this.field.dataType.options
				}),
				columns: [
					column({
						id: "text"
					})
				]
			})
		});
	}
}

export class UserCustomField extends AbstractCustomField {
	createTableColumn() {
		return column(
			{
				...this.getColumnConfig(),
				width: 100,
				renderer: async (columnValue: any, record: any, td: HTMLTableCellElement, table: Table, storeIndex: number, column: TableColumn) => {
					if (!columnValue) {
						return "";
					}
					const u = await principalDS.single(columnValue);
					return u ? u.name : "";
				}
			}
		)
	}

	createFormField(): FormField {
		return principalcombo({...this.getFormFieldConfig(), storeConfig: {filters: {default: {isEmployee: true}}}});
	}
}

export class NumberCustomField extends AbstractCustomField {
	createTableColumn() {
		return numbercolumn({...this.getColumnConfig(),decimals: this.field.options.decimals});
	}

	public createFormField() {
		return numberfield({...this.getFormFieldConfig(), decimals: this.field.options.decimals});
	}
}

export class FunctionCustomField extends AbstractCustomField {
	createTableColumn() {
		return numbercolumn({...this.getColumnConfig(), decimals: this.field.options.decimals})
	}

	public createFormField() {
		return numberfield({...this.getFormFieldConfig(), readOnly: true,decimals: this.field.options.decimals});
	}
}

export class GroupCustomField extends AbstractCustomField {
	createTableColumn() {
		return column({
			...this.getColumnConfig(),
			width: 100,
			renderer: async (columnValue: any, record: any, td: HTMLTableCellElement, table: Table, storeIndex: number, column: TableColumn) => {
				if (!columnValue) {
					return "";
				}
				const u = await groupDS.single(columnValue);
				return u ? u.name : "";
			}
		})

	}

	createFormField(): FormField {
		return groupcombo(this.getFormFieldConfig());
	}
}

export class HtmlCustomField extends AbstractCustomField {
	protected getColumnConfig() {
		return {...super.getColumnConfig(), renderer: (v: string | undefined) => v ? v.stripTags() : ""};
	}

	public createFormField() {
		return htmlfield(this.getFormFieldConfig());
	}
}

export class TextAreaCustomField extends AbstractCustomField {
	protected getColumnConfig() {
		return {...super.getColumnConfig(), renderer: (v: string | undefined) => v ? v.replace(/\n/g, " ") : ""};
	}

	public createFormField() {
		return textarea(this.getFormFieldConfig());
	}
}

export class ProjectCustomField extends AbstractCustomField {
	createTableColumn() {
		return column({
			...this.getColumnConfig(),
				width: 100,
				renderer: async (columnValue: any, record: any, td: HTMLTableCellElement, table: Table, storeIndex: number, column: TableColumn) => {
					if (!columnValue) {
						return "";
					}
					const u = await jmapds("Project").single(columnValue);
					return u ? u.name : "";
				}
			}
		)

	}

	createFormField(): FormField {
		return combobox({
			...this.getFormFieldConfig(),
			dataSource: jmapds("Project"),
			filterName: "text",
			buttons: [btn({
				icon: "clear",
				handler: (button, ev) => {
					button.findAncestorByType(ComboBox)!.value = null;
				}
			})]
		})
	}
}

export class ContactCustomField extends AbstractCustomField {
	createTableColumn() {
		return column({
			...this.getColumnConfig(),
			width: 100,
			renderer: async (columnValue: any, record: any, td: HTMLTableCellElement, table: Table, storeIndex: number, column: TableColumn) => {
				if (!columnValue) {
					return "";
				}
				const u = await jmapds("Contact").single(columnValue);
				return u ? u.name : "";
			}
		})
	}

	createFormField(): FormField {

		const filter:any = {isOrganization: this.field.options.isOrganization};

		if(this.field.options.addressBookId?.length) {
			filter.addressBookId = this.field.options.addressBookId;
		}

		return combobox({
			...this.getFormFieldConfig(),
			dataSource: jmapds("Contact"),
			filterName: "text",
			buttons: [btn({
				icon: "clear",
				handler: (button, ev) => {
					button.findAncestorByType(ComboBox)!.value = null;
				}
			})],
			storeConfig: {
				filters: {
					default: filter
				}
			}
		})
	}
}



export class FileCustomField extends AbstractCustomField {

	createFormField(): FormField {

		const filter:any = {isOrganization: this.field.options.isOrganization};

		if(this.field.options.addressBookId?.length) {
			filter.addressBookId = this.field.options.addressBookId;
		}

		return textfield({
			...this.getFormFieldConfig(),

			buttons: [btn({
				icon: "clear",
				handler: (button, ev) => {
					button.findAncestorByType(ComboBox)!.value = null;
				}
			}),
				btn({
					icon: "folder",
					handler: (button, ev) => {

						const field = button.findAncestorByType(TextField)!

						GO.files.createSelectFileBrowser();

						GO.selectFileBrowser.setFileClickHandler((r:any) => {
							if(r){
								field.value = r.data.path;
							}else
							{
								field.value = GO.selectFileBrowser.path;
							}

							GO.selectFileBrowserWindow.hide();
						}, this);


						GO.selectFileBrowser.setRootID(0, 0);
						GO.selectFileBrowserWindow.show();
					}
				})
			]

		})
	}
}