import {Type} from "./Type.js";
import {t} from "@intermesh/goui";
import {FieldDialog} from "../FieldDialog.js";

export class Data extends Type {
	constructor() {
		super();

		this.name = "Data";
		this.label = t("Data");
		this.icon = "storage";
	}

	getDialog(): FieldDialog {
		return new FieldDialog();
	}
}