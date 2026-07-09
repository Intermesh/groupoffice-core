import {CustomFieldType} from "./CustomFieldType.js";
import {displayfield, Format, numbercolumn, numberfield, t} from "@intermesh/goui";
import {CustomFieldDialog} from "../CustomFieldDialog.js";
import {CustomFieldFunctionFieldDialog} from "./CustomFieldFunctionFieldDialog.js";
import {CustomField, customFields} from "../CustomFields.js";

export class CustomFieldFunctionField extends CustomFieldType {
	constructor() {
		super("FunctionField", "functions", t("Function"));
	}

	getDialog(): CustomFieldDialog {
		return new CustomFieldFunctionFieldDialog();
	}

	createTableColumField(field:CustomField) {
		return numbercolumn({...this.getColumnConfig(field), decimals: field.options.decimals})
	}

	public createFormField(field:CustomField) {
		return numberfield({...this.getFormFieldConfig(field), readOnly: true,decimals: field.options.decimals});
	}

	createDetailField(field:CustomField) {
		return displayfield({
			...this.getDetailFieldConfig(field),
			renderer: v => v > 0 ? Format.number(v, field.options.decimals) : ""
		});
	}
}


customFields.registerType(new CustomFieldFunctionField);