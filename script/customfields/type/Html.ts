import {Type} from "./Type.js";
import {t} from "@intermesh/goui";
import {FieldDialog} from "../FieldDialog.js";

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
}