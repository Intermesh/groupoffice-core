import {FieldDialog} from "../FieldDialog.js";
import {fieldset, t, textarea, textfield} from "@intermesh/goui";

export class NotesDialog extends FieldDialog {
	constructor() {
		super();

		this.generalFieldset.hide();
		this.validationFieldset.hide();

		this.generalTab.items.add(
			fieldset({},
				textfield({
					name: "name",
					label: t("Name"),
					required: true,
					listeners: {
						change: (field, newValue) => {
							this.nameField.value = newValue;
						}
					}
				}),
				textarea({
					name: "options.formNotes",
					label: t("Form"),
					hint: t("These notes will display in the form")
				}),
				textarea({
					name: "options.detailNotes",
					label: t("Detail"),
					hint: t("These notes will display in the detail view")
				})
			)
		)
	}
}