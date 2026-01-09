import {Type} from "./Type.js";
import {FieldDialog} from "../FieldDialog.js";
import {btn, column, ComboBox, combobox, comp, displayfield, p, t,	Field as FormField} from "@intermesh/goui";
import {NotesDialog} from "./NotesDialog.js";
import {customFields, Field} from "../CustomFields.js";
import {TemplateField} from "./TemplateField.js";
import {Notes} from "./Notes.js";
import {jmapds} from "../../jmap/index.js";
import {TextDialog} from "./TextDialog.js";


export class Project extends Type {
	constructor() {
		super("Project", "star", t("Project"));
	}

	getDialog(): FieldDialog {
		return new TextDialog();
	}


	private renderer = async (columnValue: any) => {
		if (!columnValue) {
			return "";
		}
		const u = await jmapds("Project").single(columnValue);
		return u ? comp({tagName: "a", text: u.name, attr: {href: `#project/${columnValue}`}}) : "";
	}

	createTableColumField(field:Field) {
		return column({
			...this.getColumnConfig(field),
			width: 100,
			renderer: this.renderer
		})
	}

	createDetailField(field:Field) {
		return displayfield({
			...this.getDetailFieldConfig(field),
			renderer: this.renderer
		});
	}

	createFormField(field:Field): FormField {
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

customFields.registerType(new Project);