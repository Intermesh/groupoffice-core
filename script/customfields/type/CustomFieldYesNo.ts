import {CustomFieldType} from "./CustomFieldType.js";
import {boolcolumn, displayfield, select, t} from "@intermesh/goui";
import {CustomFieldDialog} from "../CustomFieldDialog.js";
import {CustomFieldYesNoDialog} from "./CustomFieldYesNoDialog.js";
import {CustomField, customFields} from "../CustomFields.js";

export class CustomFieldYesNo extends CustomFieldType {
	constructor() {
		super("YesNo", "check_box", t("Yes or no"));
	}

	getDialog(): CustomFieldDialog {
		return new CustomFieldYesNoDialog();
	}

	createTableColumField(field:CustomField) {
		return boolcolumn(this.getColumnConfig(field));
	}

	public createFormField(field:CustomField) {
		return select({
			...this.getFormFieldConfig(field),
			options: [
				{value: null, name: ""},
				{value: 0, name: t("No")},
				{value: 1, name: t("Yes")}
			]
		});
	}

	createDetailField(field:CustomField) {
		return displayfield({
			...this.getDetailFieldConfig(field),
			renderer: (v: string) => {
				return v === null || v === undefined ? "" : v ? t("Yes") : t("No");
			}
		})
	}
}

customFields.registerType(new CustomFieldYesNo);