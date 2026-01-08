import {t} from "@intermesh/goui";
import {Type} from "./Type.js";
import {FieldDialog} from "../FieldDialog.js";

export class TextArea extends Type{
	constructor() {
		super();

		this.name = "TextArea";

		this.label = t("TextArea");
		this.icon = "description";
	}

	getDialog() {
		return new FieldDialog();
	}
}
