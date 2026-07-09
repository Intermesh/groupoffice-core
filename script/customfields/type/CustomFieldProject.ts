import {CustomFieldType} from "./CustomFieldType.js";
import {CustomFieldDialog} from "../CustomFieldDialog.js";
import {btn, column, ComboBox, combobox, comp, displayfield, Field as FormField, t} from "@intermesh/goui";
import {CustomField, customFields} from "../CustomFields.js";
import {jmapds} from "../../jmap/index.js";
import {CustomFieldTextDialog} from "./CustomFieldTextDialog.js";


export class CustomFieldProject extends CustomFieldType {
	constructor() {
		super("Project", "star", t("Project"));
	}

	getDialog(): CustomFieldDialog {
		return new CustomFieldTextDialog();
	}


	private renderer = async (columnValue: any) => {
		if (!columnValue) {
			return "";
		}
		const u = await jmapds("Project").single(columnValue);
		return u ? comp({tagName: "a", text: u.name, attr: {href: `#project/${columnValue}`}}) : "";
	}

	createTableColumField(field:CustomField) {
		return column({
			...this.getColumnConfig(field),
			width: 100,
			renderer: this.renderer
		})
	}

	createDetailField(field:CustomField) {
		return displayfield({
			...this.getDetailFieldConfig(field),
			renderer: this.renderer
		});
	}

	createFormField(field:CustomField): FormField {
		return combobox({
			...this.getFormFieldConfig(field),
			dataSource: jmapds("Project"),
			filterName: "text",
			buttons: [btn({
				icon: "clear",
				handler: (button) => {
					button.findAncestorByType(ComboBox)!.value = null;
				}
			})]
		})
	}
}

customFields.registerType(new CustomFieldProject);