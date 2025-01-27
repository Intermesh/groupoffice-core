import {FieldDialog} from "../FieldDialog.js";
import {comp, t, textarea} from "@intermesh/goui";

export class TemplateFieldDialog extends FieldDialog {
	constructor() {
		super();

		this.validationFieldset.items.clear();
		this.validationFieldset.remove();

		this.hintField.remove();
		this.prefixField.remove();
		this.suffixField.remove();

		this.generalFieldset.items.add(
			comp({
				tagName: "a",
				cls: "normal-link",
				attr: {target: "_blank", href: "https://groupoffice.readthedocs.io/en/latest/system-settings/custom-fields.html#template-field"},
				html: t("Visit documentation page")
			}),
			textarea({
				name: "options.template",
				label: t("Template"),
				value: "[assign firstContactLink = entity | links:Contact | first]{{firstContactLink.name}}"
			})
		)
	}
}