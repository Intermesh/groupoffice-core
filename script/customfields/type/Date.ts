import {Type} from "./Type.js";
import {t} from "@intermesh/goui";
import {FieldDialog} from "../FieldDialog.js";
import {DateDialog} from "./DateDialog.js";

export class Date extends Type {
	constructor() {
		super();

		this.name = "Date";
		this.label = t("Date");
		this.icon = "event";
	}

	getDialog(): FieldDialog {
		return new DateDialog();
	}
}