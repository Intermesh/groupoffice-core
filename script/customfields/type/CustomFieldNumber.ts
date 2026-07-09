import {CustomFieldType} from "./CustomFieldType.js";
import {displayfield, Format, numbercolumn, numberfield, t} from "@intermesh/goui";
import {CustomFieldDialog} from "../CustomFieldDialog.js";
import {CustomFieldNumberDialog} from "./CustomFieldNumberDialog.js";
import {CustomField, customFields} from "../CustomFields.js";

export class CustomFieldNumber extends CustomFieldType {
	constructor() {
		super("Number", "format_list_numbered", t("Number"));
	}

	getDialog(): CustomFieldDialog {
		return new CustomFieldNumberDialog();
	}

	createTableColumField(field:CustomField) {
		return numbercolumn({...this.getColumnConfig(field),decimals: field.options.decimals});
	}

	public createFormField(field:CustomField) {
		return numberfield({...this.getFormFieldConfig(field), decimals: field.options.decimals});
	}

	createDetailField(field:CustomField) {
		return displayfield({
			...this.getDetailFieldConfig(field),
			renderer: v => Format.number(v, field.options.decimals)
		});
	}
}

customFields.registerType(new CustomFieldNumber);