import {Type} from "./Type.js";
import {boolcolumn, checkbox, displaycheckboxfield, t} from "@intermesh/goui";
import {FieldDialog} from "../FieldDialog.js";
import {CheckboxDialog} from "./CheckboxDialog.js";
import {customFields, Field} from "../CustomFields.js";

export class Checkbox extends Type {
	constructor() {
		super();

		this.name = "Checkbox";
		this.icon = "check_box";
		this.label = t("Checkbox");
	}

	getDialog(): FieldDialog {
		return new CheckboxDialog();
	}

	createTableColumField(field:Field) {
		return boolcolumn(this.getColumnConfig(field));
	}

	public createFormField(field:Field) {
		return checkbox(this.getFormFieldConfig(field))
	}

	createDetailField(field:Field) {
		return displaycheckboxfield(this.getDetailFieldConfig(field));
	}
}

customFields.registerType(Checkbox);