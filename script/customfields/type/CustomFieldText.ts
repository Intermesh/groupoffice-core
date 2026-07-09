import {Component, MaterialIcon, t, textfield} from "@intermesh/goui";
import {CustomFieldTextDialog} from "./CustomFieldTextDialog.js";
import {CustomFieldType} from "./CustomFieldType.js";
import {CustomField, customFields} from "../CustomFields.js";

export class CustomFieldText extends CustomFieldType {

	constructor(name = "Text", icon:MaterialIcon = "description", label = t("Text")) {
		super(name, icon, label);
	}

	getDialog() {
		return new CustomFieldTextDialog();
	}

	public createFormField(field:CustomField) : Component|undefined {
		return textfield(this.getFormFieldConfig(field))
	}
}

customFields.registerType(new CustomFieldText);