import {Type} from "./Type.js";
import {displayfield, htmlfield, t} from "@intermesh/goui";
import {FieldDialog} from "../FieldDialog.js";
import {customFields, Field} from "../CustomFields.js";
import {EncryptedText} from "./EncryptedText.js";

export class Html extends Type {
	constructor() {
		super();

		this.name = "Html";
		this.label = t("HTML");
		this.icon = "html";
	}

	getDialog(): FieldDialog {
		return new FieldDialog();
	}

	protected getColumnConfig(field:Field) {
		return {...super.getColumnConfig(field), renderer: (v: string | undefined) => v ? v.stripTags() : ""};
	}

	public createFormField(field:Field) {
		return htmlfield(this.getFormFieldConfig(field));
	}

	createDetailField(field:Field) {
		return displayfield({
			...this.getDetailFieldConfig(field),
			htmlEncode: false
		})
	}
}
customFields.registerType(Html);