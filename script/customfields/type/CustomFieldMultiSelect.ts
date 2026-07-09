import {autocompletechips, column, displayfield, store, t, table} from "@intermesh/goui";
import {CustomFieldDialog} from "../CustomFieldDialog.js";
import {CustomFieldMultiSelectDialog} from "./CustomFieldMultiSelectDialog.js";
import {CustomFieldSelect} from "./CustomFieldSelect.js";
import {CustomField} from "../CustomFields.js";

export class CustomFieldMultiSelect extends CustomFieldSelect {
	constructor() {
		super("MultiSelect", "list", t("Multi Select"));
	}

	getDialog(): CustomFieldDialog {
		return new CustomFieldMultiSelectDialog();
	}

	private renderer = (columnValue: any, field:CustomField) => {
		if (!columnValue) {
			return "";
		}

		return columnValue.map((id: number) => this.findSelectOption(id, field.dataType.options!)?.text).join(", ")

	}
	createTableColumField(field:CustomField) {
		return column(
			{
				...this.getColumnConfig(field),
				width: 100,
				renderer: (v) => this.renderer(v, field)
			}

		)
	}

	createDetailField(field:CustomField) {
		return displayfield({
			...this.getDetailFieldConfig(field),
			renderer: (v) => this.renderer(v, field)
		})
	}

	createFormField(field:CustomField): any {

		return autocompletechips({
			...this.getFormFieldConfig(field),

			chipRenderer: (chip, value) => {
				chip.text = this.findSelectOption(value, field.dataType.options!)?.text ?? "?";
			},
			pickerRecordToValue (field, record) : any {
				return record.id;
			},

			list: table({
				fitParent: true,
				headers: false,
				store: store({
					data: field.dataType.options
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