import {t} from "@intermesh/goui";
import {TextAreaDialog} from "./TextAreaDialog.js";
import {Type} from "./Type.js";

export class TextArea extends Type{
	constructor() {
		super();

		this.name = "TextArea";

		this.label = t("TextArea");
		this.icon = "description";
	}

	getDialog() {
		return new TextAreaDialog();
	}
}
