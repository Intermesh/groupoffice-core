import {Type} from "./Type.js";
import {displayfield, Format, numbercolumn, numberfield, t} from "@intermesh/goui";
import {FieldDialog} from "../FieldDialog.js";
import {FunctionFieldDialog} from "./FunctionFieldDialog.js";
import {customFields, Field} from "../CustomFields.js";
import {EncryptedText} from "./EncryptedText.js";

export class FunctionField extends Type {
	constructor() {
		super("FunctionField", "functions", t("Function"));
	}

	getDialog(): FieldDialog {
		return new FunctionFieldDialog();
	}

	createTableColumField(field:Field) {
		return numbercolumn({...this.getColumnConfig(field), decimals: field.options.decimals})
	}

	public createFormField(field:Field) {
		return numberfield({...this.getFormFieldConfig(field), readOnly: true,decimals: field.options.decimals});
	}

	createDetailField(field:Field) {
		return displayfield({
			...this.getDetailFieldConfig(field),
			renderer: v => v > 0 ? Format.number(v, field.options.decimals) : ""
		});
	}
}


customFields.registerType(new FunctionField);