import {CustomFieldType} from "./CustomFieldType.js";
import {CustomFieldDialog} from "../CustomFieldDialog.js";
import {column, displayfield, Field as FormField, t} from "@intermesh/goui";
import {principalDS} from "../../auth/index.js";
import {CustomField, customFields} from "../CustomFields.js";
import {principalcombo} from "../../components/index.js";

export class CustomFieldUserCustomField extends CustomFieldType {
	constructor() {
		super( "User", "person", t("User"));

	}

	getDialog(): CustomFieldDialog {
		return new CustomFieldDialog();
	}

	private renderer = async (columnValue: any) => {
		if (!columnValue) {
			return "";
		}
		const u = await principalDS.single(columnValue);
		return u ? u.name : "";
	}


	createTableColumField(field:CustomField) {
		return column({
			...this.getColumnConfig(field),
			width: 100,
			renderer: this.renderer
		})
	}

	createDetailField(field:CustomField) {
		return displayfield({
			...this.getDetailFieldConfig(field),
			renderer: this.renderer
		});
	}

	createFormField(field:CustomField): FormField {
		return principalcombo({...this.getFormFieldConfig(field), storeConfig: {filters: {default: {isEmployee: true}}}});
	}
}

customFields.registerType(new CustomFieldUserCustomField);