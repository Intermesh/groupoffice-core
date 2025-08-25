import {FieldDialog} from "../FieldDialog.js";
import {
	ArrayField,
	arrayfield,
	btn,
	comp,
	ContainerField,
	containerfield,
	fieldset,
	t,
	textfield
} from "@intermesh/goui";

export class MultiSelectDialog extends FieldDialog {
	private arrayField: ArrayField;

	constructor() {
		super();

		this.generalTab.items.add(
			fieldset({},
				comp({
					tagName: "h4",
					text: t("Options")
				}),
				containerfield({
						name: "dataType"
					},
					this.arrayField = arrayfield({
						name: "options",
						label: t("Options"),
						buildField: () => {
							const field = containerfield({
									cls: "group",
								},
								textfield({
									name: "text",
									flex: 1
								}),
								btn({
									icon: "delete",
									title: t("Delete"),
									handler: () => {
										field.remove();
									}
								}),
								btn({
									cls: "handle",
									icon: "drag_handle",
									title: "Sort",
									listeners: {
										render: ({target}) => {
											target.el.addEventListener("mousedown", () => {
												const row = target.findAncestorByType(ContainerField)!
												row.el.draggable = true;
											});

											target.el.addEventListener("mouseup", () => {
												const row = target.findAncestorByType(ContainerField)!
												row.el.draggable = false;
											});
										}
									}
								})
							)

							return field
						}
					}),
					btn({
						text: t("Add"),
						width: 160,
						handler: () => {
							this.arrayField.addValue({});
						}
					})
				)
			)
		)
	}
}