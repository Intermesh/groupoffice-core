import {Type} from "./Type.js";
import {t} from "@intermesh/goui";
import {FieldDialog} from "../FieldDialog.js";
import {MultiSelectDialog} from "./MultiSelectDialog.js";

export class MultiSelect extends Type {
	constructor() {
		super();

		this.name = "MultiSelect";
		this.label = t("Multi Select");
		this.icon = "list";
	}

	getDialog(): FieldDialog {
		return new MultiSelectDialog();
	}
}