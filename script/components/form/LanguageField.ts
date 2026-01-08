import {createComponent, FieldConfig, SelectField, t} from "@intermesh/goui";

export class LanguageField extends SelectField {
	constructor() {
		super();

		this.label = t("Language");
		this.name = "language";

		this.valueField = "iso";

		this.options = Object.entries(LanguageField.languages).map(([iso, text]) => ({iso, text}));
	}

	public static languages:Record<string, string> = {};
}


/**
 * Shorthand function to create {@link LanguageField}
 *
 * @param config
 */
export const languagefield = (config?: FieldConfig<LanguageField>) => createComponent(new LanguageField(), config);