import {Type} from "./Type.js";
import {displayfield, Format, numbercolumn, numberfield, t} from "@intermesh/goui";
import {FieldDialog} from "../FieldDialog.js";
import {NumberDialog} from "./NumberDialog.js";
import {customFields, Field} from "../CustomFields.js";
import {EncryptedText} from "./EncryptedText.js";

export class Number extends Type {
	constructor() {
		super();

		this.name = "Number";
		this.label = t("Number");
		this.icon = "format_list_numbered";
	}

	getDialog(): FieldDialog {
		return new NumberDialog();
	}

	createTableColumField(field:Field) {
		return numbercolumn({...this.getColumnConfig(field),decimals: field.options.decimals});
	}

	public createFormField(field:Field) {
		return numberfield({...this.getFormFieldConfig(field), decimals: field.options.decimals});
	}

	createDetailField(field:Field) {
		return displayfield({
			...this.getDetailFieldConfig(field),
			renderer: v => Format.number(v, field.options.decimals)
		});
	}
}

customFields.registerType(Number);