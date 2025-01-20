import {FieldDialog} from "../FieldDialog.js";
import {t} from "@intermesh/goui";

export class UserDialog extends FieldDialog {
	constructor() {
		super();

		this.typeField.value = t("User");
	}
}