import {t} from "@intermesh/goui";
import {TextDialog} from "./TextDialog.js";
import {Type} from "./Type.js";

export class Text extends Type {

	constructor() {
		super();

		this.name = "Text";

		this.label = t("Text");
		this.icon = "description";
	}

	getDialog() {
		return new TextDialog();
	}

}