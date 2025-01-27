import {Type} from "./Type.js";
import {t} from "@intermesh/goui";
import {FieldDialog} from "../FieldDialog.js";
import {TemplateFieldDialog} from "./TemplateFieldDialog.js";

export class TemplateField extends Type {
	constructor() {
		super();

		this.name = "TemplateField";
		this.label  = t("Template");
		this.icon = "note";
	}

	getDialog(): FieldDialog {
		return new TemplateFieldDialog();
	}
}