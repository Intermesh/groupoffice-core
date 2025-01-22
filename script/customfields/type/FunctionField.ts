import {Type} from "./Type.js";
import {t} from "@intermesh/goui";
import {FieldDialog} from "../FieldDialog.js";
import {FunctionFieldDialog} from "./FunctionFieldDialog.js";

export class FunctionField extends Type {
	constructor() {
		super();

		this.name = "FunctionField";
		this.label = t("Function");
		this.icon = "functions";
	}

	getDialog(): FieldDialog {
		return new FunctionFieldDialog();
	}
}
