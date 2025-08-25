import {FieldDialog} from "../FieldDialog.js";
import {NumberField, numberfield, t} from "@intermesh/goui";

export class NumberDialog extends FieldDialog {
	private defaultField: NumberField;

	constructor() {
		super();

		this.generalFieldset.items.add(
			numberfield({
				name: "options.numberDecimals",
				value: 2,
				width: 180,
				decimals: 0,
				label: t("Decimals"),
				listeners: {
					change: ({newValue}) => {
						this.defaultField.decimals = newValue;
					}
				}
			}),
			this.defaultField = numberfield({
				name: "default",
				decimals: 2,
				label: t("Default value")
			})
		)
	}
}