import {t, textarea} from "@intermesh/goui";
import {Type} from "./Type.js";
import {FieldDialog} from "../FieldDialog.js";
import {customFields, Field} from "../CustomFields.js";
import {EncryptedText} from "./EncryptedText.js";

export class TextArea extends Type {
	constructor() {
		super("TextArea", "description", t("Text area"));
	}

	getDialog() {
		return new FieldDialog();
	}

	protected getColumnConfig(field:Field) {
		return {...super.getColumnConfig(field), renderer: (v: string | undefined) => v ? v.replace(/\n/g, " ") : ""};
	}

	public createFormField(field:Field) {
		return textarea(this.getFormFieldConfig(field));
	}
}
customFields.registerType(new TextArea);