import {CustomFieldType} from "./CustomFieldType.js";
import {column, displayfield, Field as FormField, t} from "@intermesh/goui";
import {CustomFieldDialog} from "../CustomFieldDialog.js";
import {groupDS} from "../../auth/index.js";
import {CustomField, customFields} from "../CustomFields.js";
import {groupcombo} from "../../components/GroupCombo.js";

export class CustomFieldGroupCustomField extends CustomFieldType {
	constructor() {
		super("Group", "group", t("Group"));
	}

	getDialog(): CustomFieldDialog {
		return new CustomFieldDialog();
	}


	private renderer = async (columnValue: any) => {
		if (!columnValue) {
			return "";
		}
		const u = await groupDS.single(columnValue);
		return u ? u.name : "";
	}
	createTableColumField(field:CustomField) {
		return column({
			...this.getColumnConfig(field),
			width: 100,
			renderer: this.renderer
		})

	}

	createFormField(field:CustomField): FormField {
		return groupcombo(this.getFormFieldConfig(field));
	}

	createDetailField(field:CustomField) {
		return displayfield({
			...this.getDetailFieldConfig(field),
			renderer: this.renderer
		});
	}
}

customFields.registerType(new CustomFieldGroupCustomField);