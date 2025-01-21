import {Type} from "./Type.js";
import {t} from "@intermesh/goui";
import {FieldDialog} from "../FieldDialog.js";
import {CheckboxDialog} from "./CheckboxDialog.js";

export class Checkbox extends Type {
	constructor() {
		super();

		this.name = "Checkbox";
		this.icon = "check_box";
		this.label = t("Checkbox");
	}

	getDialog(): FieldDialog {
		return new CheckboxDialog();
	}
}