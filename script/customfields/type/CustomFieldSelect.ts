import {CustomFieldType} from "./CustomFieldType.js";
import {column, displayfield, MaterialIcon, t} from "@intermesh/goui";
import {CustomFieldDialog} from "../CustomFieldDialog.js";
import {CustomFieldSelectDialog} from "./CustomFieldSelectDialog.js";
import {CustomField, customFields, SelectOption} from "../CustomFields.js";
import {treeselect} from "../TreeSelectField.js";

export class CustomFieldSelect extends CustomFieldType {
	constructor(name = "Select", icon:MaterialIcon = "list", label = t("Select")) {
		super(name, icon, label);
	}

	getDialog(): CustomFieldDialog {
		return new CustomFieldSelectDialog();
	}


	protected findSelectOption(optionId: number, options: SelectOption[], path: string = ""): (SelectOption & {
		path: string
	}) | undefined {
		if (!optionId) {
			return undefined;
		}

		let o;
		for (let i = 0, l = options.length; i < l; i++) {
			o = options[i];
			if (o.id == optionId) {

				if (path != "") {
					path += " > ";
				}
				path += o.text;

				return Object.assign(o, {path});
			}

			if (o.children) {
				const nested = this.findSelectOption(optionId, o.children, path == "" ? o.text : path + " > " + o.text);
				if (nested) {
					return nested;
				}
			}
		}

		return undefined;
	}

	createTableColumField(field:CustomField) {
		return column({
			...this.getColumnConfig(field),
			width: 100,
			renderer: (columnValue: any, record: any, td: HTMLTableCellElement) => {
				const o = this.findSelectOption(columnValue, field.dataType.options!);
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

	createFormField(field:CustomField) {
		return treeselect(
			{
				...this.getFormFieldConfig(field),
				options: field.dataType.options!
			}
		);
	}

	createDetailField(field:CustomField) {
		return displayfield({
			...this.getDetailFieldConfig(field),
			renderer: v => {
				const o = this.findSelectOption(v, field.dataType.options!);
				return o?.path ?? "";
			}
		})
	}
}

customFields.registerType(new CustomFieldSelect);