import {Type} from "./Type.js";
import {t} from "@intermesh/goui";
import {FieldDialog} from "../FieldDialog.js";
import {YesNoDialog} from "./YesNoDialog.js";

export class YesNo extends Type {
	constructor() {
		super();

		this.name = "YesNo";
		this.label = t("Yes or no");
		this.icon = "check_box";
	}

	getDialog(): FieldDialog {
		return new YesNoDialog();
	}
}