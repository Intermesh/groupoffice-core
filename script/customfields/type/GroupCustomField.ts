import {Type} from "./Type.js";
import {column, displayfield, Field as FormField, t} from "@intermesh/goui";
import {FieldDialog} from "../FieldDialog.js";
import {groupDS} from "../../auth/index.js";
import {customFields, Field} from "../CustomFields.js";
import {groupcombo} from "../../components/GroupCombo.js";
import {EncryptedText} from "./EncryptedText.js";

export class GroupCustomField extends Type {
	constructor() {
		super("Group", "group", t("Group"));
	}

	getDialog(): FieldDialog {
		return new FieldDialog();
	}


	private renderer = async (columnValue: any) => {
		if (!columnValue) {
			return "";
		}
		const u = await groupDS.single(columnValue);
		return u ? u.name : "";
	}
	createTableColumField(field:Field) {
		return column({
			...this.getColumnConfig(field),
			width: 100,
			renderer: this.renderer
		})

	}

	createFormField(field:Field): FormField {
		return groupcombo(this.getFormFieldConfig(field));
	}

	createDetailField(field:Field) {
		return displayfield({
			...this.getDetailFieldConfig(field),
			renderer: this.renderer
		});
	}
}

customFields.registerType(new GroupCustomField);