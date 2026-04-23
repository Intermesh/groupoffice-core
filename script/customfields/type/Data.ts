import {Type} from "./Type.js";
import {t} from "@intermesh/goui";
import {FieldDialog} from "../FieldDialog.js";
import {customFields} from "../CustomFields.js";
import {Checkbox} from "./Checkbox.js";

export class Data extends Type {
	constructor() {
		super("Data", "storage", t("Data"));
	}

	getDialog(): FieldDialog {
		return new FieldDialog();
	}
}


customFields.registerType(new Data);