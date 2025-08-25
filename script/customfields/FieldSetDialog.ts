import {FormWindow} from "../components/index.js";
import {
	checkbox,
	ComboBox,
	combobox,
	fieldset,
	hiddenfield,
	numberfield,
	t,
	textfield
} from "@intermesh/goui";
import {jmapds} from "../jmap/index.js";

export class FieldSetDialog extends FormWindow {
	private readonly fieldSetCombo: ComboBox

	constructor() {
		super("FieldSet");

		this.title = t("Field set");
		this.maximizable = true;
		this.resizable = true;

		this.height = 800;
		this.width = 1000;

		this.addSharePanel();

		this.generalTab.items.add(
			fieldset({},
				textfield({
					name: "name",
					label: t("Name"),
					required: true
				}),
				hiddenfield({
					name: "entity"
				}),
				checkbox({
					name: "isTab",
					label: t("Show as tab"),
					listeners: {
						change: ({newValue}) =>{
							this.fieldSetCombo["disabled"] = newValue;
						}
					}
				}),
				checkbox({
					name: "collapseIfEmpty",
					label: t("Collapse when empty"),
					hint: t("Show this fieldset collapsed when all of its field have the initial value")
				}),
				this.fieldSetCombo = combobox({
					dataSource: jmapds("FieldSet"),
					name: "parentFieldSetId",
					label: t("Show on tab"),
					placeholder: t("Default")
				}),
				textfield({
					name: "description",
					label: t("Description"),
					hint: t("This description will show in the edit form")
				}),
				numberfield({
					name: "columns",
					label: t("Columns"),
					value: 2,
					decimals: 0
				})
			)
		)
	}
}