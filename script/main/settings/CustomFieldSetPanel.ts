import {datasourceform} from "@intermesh/goui";
import {AbstractSettingsPanel} from "./AbstractSettingsPanel.js";
import {userDS} from "../../auth/index.js";
import {FieldSet, FormFieldset} from "../../customfields/index.js";

/**
 * Page in the user settings for a User custom field set that is shown as a tab
 */
export class CustomFieldSetPanel extends AbstractSettingsPanel {
	constructor(fieldSet: FieldSet) {
		super("customfields-" + fieldSet.id, fieldSet.name, "description");

		const fs = new FormFieldset(fieldSet);
		fs.legend = "";

		this.items.add(this.form = datasourceform({dataSource: userDS, width: 700}, fs));
	}
}
