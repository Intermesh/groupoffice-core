import {Type} from "./Type.js";
import {t} from "@intermesh/goui";
import {FieldDialog} from "../FieldDialog.js";
import {NumberDialog} from "./NumberDialog.js";

export class Number extends Type {
	constructor() {
		super();

		this.name = "Number";
		this.label = t("Number");
		this.icon = "format_list_numbered";
	}

	getDialog(): FieldDialog {
		return new NumberDialog();
	}
}