import {FormWindow} from "../FormWindow.js";
import {fieldset, select, t} from "@intermesh/goui";
import {entities, Entity} from "../../Entities.js";

export class VariableFilterDialog extends FormWindow {
	private entity: Entity;

	constructor(entityName: string) {
		super("EntityFilter");

		this.title = t("Input field");
		this.height = 400;
		this.width = 500;
		this.maximizable = true;
		this.modal = true;

		this.addSharePanel();

		this.entity = entities.get(entityName);

		this.generalTab.items.add(
			fieldset({},
				select({
					name: "name",
					valueField: "name",
					textRenderer: (f: any) => f.title,
					// @ts-ignore
					options: Object.values(this.entity.filters)
				})
			)
		);

		this.form.on("beforesave", ({data}) => {
			data.entity = entityName;
			data.type = "variable";
		})
	}
}