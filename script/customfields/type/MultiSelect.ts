import {Type} from "./Type.js";
import {autocompletechips, column, displayfield, store, t, table} from "@intermesh/goui";
import {FieldDialog} from "../FieldDialog.js";
import {MultiSelectDialog} from "./MultiSelectDialog.js";
import {Select} from "./Select.js";
import {Field} from "../CustomFields.js";

export class MultiSelect extends Select {
	constructor() {
		super();

		this.name = "MultiSelect";
		this.label = t("Multi Select");
		this.icon = "list";
	}

	getDialog(): FieldDialog {
		return new MultiSelectDialog();
	}

	private renderer = (columnValue: any, field:Field) => {
		if (!columnValue) {
			return "";
		}

		return columnValue.map((id: number) => this.findSelectOption(id, field.dataType.options!)?.text).join(", ")

	}
	createTableColumField(field:Field) {
		return column(
			{
				...this.getColumnConfig(field),
				width: 100,
				renderer: (v) => this.renderer(v, field)
			}

		)
	}

	createDetailField(field:Field) {
		return displayfield({
			...this.getDetailFieldConfig(field),
			renderer: (v) => this.renderer(v, field)
		})
	}

	createFormField(field:Field): any {

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