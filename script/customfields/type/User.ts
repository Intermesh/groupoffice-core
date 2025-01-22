import {Type} from "./Type.js";
import {FieldDialog} from "../FieldDialog.js";
import {t} from "@intermesh/goui";

export class User extends Type {
	constructor() {
		super();

		this.name = "User";
		this.icon = "person";
		this.label = t("User");

	}

	getDialog(): FieldDialog {
		return new FieldDialog();
	}
}