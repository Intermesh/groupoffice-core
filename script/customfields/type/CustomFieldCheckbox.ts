import {CustomFieldType} from "./CustomFieldType.js";
import {boolcolumn, checkbox, displaycheckboxfield, t} from "@intermesh/goui";
import {CustomFieldDialog} from "../CustomFieldDialog.js";
import {CustomFieldCheckboxDialog} from "./CustomFieldCheckboxDialog.js";
import {CustomField, customFields} from "../CustomFields.js";

export class CustomFieldCheckbox extends CustomFieldType {
	constructor() {
		super(
			"Checkbox","check_box", t("Checkbox")
		)
	}

	getDialog(): CustomFieldDialog {
		return new CustomFieldCheckboxDialog();
	}

	createTableColumField(field:CustomField) {
		return boolcolumn(this.getColumnConfig(field));
	}

	public createFormField(field:CustomField) {
		return checkbox(this.getFormFieldConfig(field))
	}

	createDetailField(field:CustomField) {
		return displaycheckboxfield(this.getDetailFieldConfig(field));
	}
}

customFields.registerType(new CustomFieldCheckbox);