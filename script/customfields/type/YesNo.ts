import {Type} from "./Type.js";
import {boolcolumn, displayfield, select, t} from "@intermesh/goui";
import {FieldDialog} from "../FieldDialog.js";
import {YesNoDialog} from "./YesNoDialog.js";
import {customFields, Field} from "../CustomFields.js";
import {EncryptedText} from "./EncryptedText.js";

export class YesNo extends Type {
	constructor() {
		super();

		this.name = "YesNo";
		this.label = t("Yes or no");
		this.icon = "check_box";
	}

	getDialog(): FieldDialog {
		return new YesNoDialog();
	}

	createTableColumField(field:Field) {
		return boolcolumn(this.getColumnConfig(field));
	}

	public createFormField(field:Field) {
		return select({
			...this.getFormFieldConfig(field),
			options: [
				{value: null, name: ""},
				{value: 0, name: t("No")},
				{value: 1, name: t("Yes")}
			]
		});
	}

	createDetailField(field:Field) {
		return displayfield({
			...this.getDetailFieldConfig(field),
			renderer: (v: string) => {
				return v === null || v === undefined ? "" : v ? t("Yes") : t("No");
			}
		})
	}
}

customFields.registerType(YesNo);