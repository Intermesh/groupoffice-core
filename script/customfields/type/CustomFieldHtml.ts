import {CustomFieldType} from "./CustomFieldType.js";
import {displayfield, htmlfield} from "@intermesh/goui";
import {CustomFieldDialog} from "../CustomFieldDialog.js";
import {CustomField, customFields} from "../CustomFields.js";

export class CustomFieldHtml extends CustomFieldType {
	constructor() {
		super("Html", "html", "HTML");
	}

	getDialog(): CustomFieldDialog {
		return new CustomFieldDialog();
	}

	protected getColumnConfig(field:CustomField) {
		return {...super.getColumnConfig(field), renderer: (v: string | undefined) => v ? v.stripTags() : ""};
	}

	public createFormField(field:CustomField) {
		return htmlfield(this.getFormFieldConfig(field));
	}

	createDetailField(field:CustomField) {
		return displayfield({
			...this.getDetailFieldConfig(field),
			htmlEncode: false
		})
	}
}
customFields.registerType(new CustomFieldHtml);