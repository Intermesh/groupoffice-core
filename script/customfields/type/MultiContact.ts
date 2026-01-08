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
	datasourcestore, autocompletechips, AutocompleteChips, table
} from "@intermesh/goui";
import {NotesDialog} from "./NotesDialog.js";
import {customFields, Field} from "../CustomFields.js";
import {TemplateField} from "./TemplateField.js";
import {Notes} from "./Notes.js";
import {jmapds} from "../../jmap/index.js";
import {TextDialog} from "./TextDialog.js";


export class MultiContact extends Type {
	constructor() {
		super();

		this.name = "MultiContact";
		this.label = t("Contact") + " (Multiple)";
		this.icon = "person";
	}

	getDialog(): FieldDialog {
		return new TextDialog();
	}

	private renderer = async (columnValue: any) => {

		const response = await jmapds("Contact").get(columnValue);
		return comp({cls:"comma-list"}, ...response.list.map(c => comp({tagName: "a", text: c.name, attr: {href: `#contact/${c.id}`}})));
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

		const store =datasourcestore({
			dataSource:  jmapds("Contact"),
			filters: {default: filter}
		});

		return autocompletechips({
			...this.getFormFieldConfig(field),

			chipRenderer: async (chip, value) => {
				chip.text = (await jmapds("Contact").single(value)).name;
			},
			pickerRecordToValue (field, record) : any {
				return record.id;
			},

			listeners: {
				autocomplete: ({input}) => {
					store.setFilter("search", {text: input});
					void store.load();
				}
			},


			buttons: [btn({
				icon: "clear",
				handler: (button) => {
					button.findAncestorByType(AutocompleteChips)!.value = [];
				}
			})],

			list: table({
				fitParent: true,
				headers: false,
				store: store,
				columns: [
					column({
						id: "name"
					})
				]
			})
		});
	}
}

customFields.registerType(MultiContact);