import {FieldDialog} from "../FieldDialog.js";
import {t} from "@intermesh/goui";

export class TextDialog extends FieldDialog{
	constructor() {
		super();

		this.typeField.value = t("Text");
	}
}