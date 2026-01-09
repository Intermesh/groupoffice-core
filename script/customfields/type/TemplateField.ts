import {Type} from "./Type.js";
import {t} from "@intermesh/goui";
import {FieldDialog} from "../FieldDialog.js";
import {TemplateFieldDialog} from "./TemplateFieldDialog.js";
import {customFields} from "../CustomFields.js";

export class TemplateField extends Type {
	constructor() {
		super("TemplateField", "note", t("Template"));
	}

	getDialog(): FieldDialog {
		return new TemplateFieldDialog();
	}
}

customFields.registerType(new TemplateField);