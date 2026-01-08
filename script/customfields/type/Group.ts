import {Type} from "./Type.js";
import {t} from "@intermesh/goui";
import {FieldDialog} from "../FieldDialog.js";

export class Group extends Type {
	constructor() {
		super();

		this.name = "Group";
		this.label = t("Group")
		this.icon = "group";
	}

	getDialog(): FieldDialog {
		return new FieldDialog();
	}
}