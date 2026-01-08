import {Type} from "./Type.js";
import {column, displayfield, t} from "@intermesh/goui";
import {FieldDialog} from "../FieldDialog.js";
import {SelectDialog} from "./SelectDialog.js";
import {customFields, Field, SelectOption} from "../CustomFields.js";
import {treeselect} from "../TreeSelectField.js";
import {EncryptedText} from "./EncryptedText.js";

export class Select extends Type {
	constructor() {
		super();

		this.name = "Select";
		this.label = t("Select");
		this.icon = "list";
	}

	getDialog(): FieldDialog {
		return new SelectDialog();
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

	createTableColumField(field:Field) {
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

	createFormField(field:Field) {
		return treeselect(
			{
				...this.getFormFieldConfig(field),
				options: field.dataType.options!
			}
		);
	}

	createDetailField(field:Field) {
		return displayfield({
			...this.getDetailFieldConfig(field),
			renderer: v => {
				const o = this.findSelectOption(v, field.dataType.options!);
				return o?.path ?? "";
			}
		})
	}
}

customFields.registerType(Select);