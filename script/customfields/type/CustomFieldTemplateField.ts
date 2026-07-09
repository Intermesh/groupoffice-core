import {CustomFieldType} from "./CustomFieldType.js";
import {t} from "@intermesh/goui";
import {CustomFieldDialog} from "../CustomFieldDialog.js";
import {CustomFieldTemplateFieldDialog} from "./CustomFieldTemplateFieldDialog.js";
import {customFields} from "../CustomFields.js";

export class CustomFieldTemplateField extends CustomFieldType {
	constructor() {
		super("TemplateField", "note", t("Template"));
	}

	getDialog(): CustomFieldDialog {
		return new CustomFieldTemplateFieldDialog();
	}
}

customFields.registerType(new CustomFieldTemplateField);