import {Component, t, textfield} from "@intermesh/goui";
import {TextDialog} from "./TextDialog.js";
import {Type} from "./Type.js";
import {customFields, Field} from "../CustomFields.js";

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

	public createFormField(field:Field) : Component|undefined {
		return textfield(this.getFormFieldConfig(field))
	}
}

customFields.registerType(Text);