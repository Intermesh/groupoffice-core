import {Type} from "./Type.js";
import {t} from "@intermesh/goui";
import {FieldDialog} from "../FieldDialog.js";
import {DateTimeDialog} from "./DateTimeDialog.js";

export class DateTime extends Type {
	constructor() {
		super();

		this.name = "DateTime";
		this.label = t("Date and time");
		this.icon = "schedule";
	}

	getDialog(): FieldDialog {
		return new DateTimeDialog();
	}
}