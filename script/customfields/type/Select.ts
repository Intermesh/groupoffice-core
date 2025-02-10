import {Type} from "./Type.js";
import {t} from "@intermesh/goui";
import {FieldDialog} from "../FieldDialog.js";
import {SelectDialog} from "./SelectDialog.js";

export class Select extends Type {
	constructor() {
		super();

		this.name = "Select";
		this.label = t("Select");
		this.icon = "list";
	}

	getDialog(): FieldDialog {
		return new SelectDialog();
	}
}