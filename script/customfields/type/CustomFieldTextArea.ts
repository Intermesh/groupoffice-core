import {t, textarea} from "@intermesh/goui";
import {CustomFieldType} from "./CustomFieldType.js";
import {CustomFieldDialog} from "../CustomFieldDialog.js";
import {CustomField, customFields} from "../CustomFields.js";

export class CustomFieldTextArea extends CustomFieldType {
	constructor() {
		super("TextArea", "description", t("Text area"));
	}

	getDialog() {
		return new CustomFieldDialog();
	}

	protected getColumnConfig(field:CustomField) {
		return {...super.getColumnConfig(field), renderer: (v: string | undefined) => v ? v.replace(/\n/g, " ") : ""};
	}

	public createFormField(field:CustomField) {
		return textarea(this.getFormFieldConfig(field));
	}
}
customFields.registerType(new CustomFieldTextArea);