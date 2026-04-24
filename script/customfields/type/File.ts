import {Type} from "./Type.js";
import {FieldDialog} from "../FieldDialog.js";
import {
	btn,
	column,
	ComboBox,
	combobox,
	comp,
	displayfield,
	p,
	t,
	Field as FormField,
	textfield, TextField
} from "@intermesh/goui";
import {NotesDialog} from "./NotesDialog.js";
import {customFields, Field} from "../CustomFields.js";
import {TemplateField} from "./TemplateField.js";
import {Notes} from "./Notes.js";
import {jmapds} from "../../jmap/index.js";
import {TextDialog} from "./TextDialog.js";


export class File extends Type {
	constructor() {
		super("File", "star", t("File"));
	}

	getDialog(): FieldDialog {
		return new TextDialog();
	}

	private renderer = (columnValue: any) => {
		if (!columnValue) {
			return "";
		}

		return comp({
			tagName: "a",
			text: columnValue,
			listeners: {
				render: ({target}) => {
					target.el.addEventListener("click", () => {
						GO.files.launchFile({
							path: columnValue
						})
					});
				}
			}
		});
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

		const filter:any = {isOrganization: field.options.isOrganization};

		if(field.options.addressBookId?.length) {
			filter.addressBookId = field.options.addressBookId;
		}

		return textfield({
			...this.getFormFieldConfig(field),

			buttons: [btn({
				icon: "clear",
				handler: (button) => {
					button.findAncestorByType(ComboBox)!.value = null;
				}
			}),
				btn({
					icon: "folder",
					handler: (button) => {

						const field = button.findAncestorByType(TextField)!

						GO.files.createSelectFileBrowser();

						GO.selectFileBrowser.setFileClickHandler((r:any) => {
							if(r){
								field.value = r.data.path;
							}else
							{
								field.value = GO.selectFileBrowser.path;
							}

							GO.selectFileBrowserWindow.hide();
						}, this);


						GO.selectFileBrowser.setRootID(0, 0);
						GO.selectFileBrowserWindow.show();
					}
				})
			]

		})
	}
}

customFields.registerType(new File);