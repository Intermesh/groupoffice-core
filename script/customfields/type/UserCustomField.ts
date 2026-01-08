import {Type} from "./Type.js";
import {FieldDialog} from "../FieldDialog.js";
import {column, displayfield, Field as FormField, t} from "@intermesh/goui";
import {principalDS} from "../../auth/index.js";
import {customFields, Field} from "../CustomFields.js";
import {principalcombo} from "../../components/index.js";
import {EncryptedText} from "./EncryptedText.js";

export class UserCustomField extends Type {
	constructor() {
		super();

		this.name = "User";
		this.icon = "person";
		this.label = t("User");

	}

	getDialog(): FieldDialog {
		return new FieldDialog();
	}

	private renderer = async (columnValue: any) => {
		if (!columnValue) {
			return "";
		}
		const u = await principalDS.single(columnValue);
		return u ? u.name : "";
	}


	createTableColumField(field:Field) {
		return column({
			...this.getColumnConfig(field),
			width: 100,
			renderer: this.renderer
		})
	}

	createDetailField(field:Field) {
		return displayfield({
			...this.getDetailFieldConfig(field),
			renderer: this.renderer
		});
	}

	createFormField(field:Field): FormField {
		return principalcombo({...this.getFormFieldConfig(field), storeConfig: {filters: {default: {isEmployee: true}}}});
	}
}

customFields.registerType(UserCustomField);