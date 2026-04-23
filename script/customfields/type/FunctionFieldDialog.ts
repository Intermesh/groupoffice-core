import {FieldDialog} from "../FieldDialog.js";
import {comp, numberfield, t, textarea} from "@intermesh/goui";

export class FunctionFieldDialog extends FieldDialog {
	constructor() {
		super();

		this.validationFieldset.items.clear();
		this.validationFieldset.remove();

		this.hintField.remove();
		this.prefixField.remove();
		this.suffixField.remove();

		this.generalFieldset.items.add(
			comp({
				tagName: "h4",
				text: t("You can create a function using other number fields. Use the 'databaseName' property as tag. For example {foo} + {bar}. You can use the following operators: / , * , + and -")
			}),
			numberfield({
				name: "options.numberDecimals",
				label: t("Decimals"),
				value: 2,
				decimals: 0,
				width: 160
			}),
			textarea({
				name: "options.function",
				label: t("Function")
			})
		)
	}
}