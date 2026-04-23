import {Component, MaterialIcon, t, textfield} from "@intermesh/goui";
import {TextDialog} from "./TextDialog.js";
import {Type} from "./Type.js";
import {customFields, Field} from "../CustomFields.js";

export class Text extends Type {

	constructor(name = "Text", icon:MaterialIcon = "description", label = t("Text")) {
		super(name, icon, label);
	}

	getDialog() {
		return new TextDialog();
	}

	public createFormField(field:Field) : Component|undefined {
		return textfield(this.getFormFieldConfig(field))
	}
}

customFields.registerType(new Text);