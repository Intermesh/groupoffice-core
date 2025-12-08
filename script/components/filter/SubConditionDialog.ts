import {btn, t, tbar, Window} from "@intermesh/goui";
import {FilterFieldset} from "./FilterFieldset.js";

export class SubConditionDialog extends Window {
	public filterFieldset: FilterFieldset;

	constructor(entityName: string) {
		super();

		this.title = t("Conditions");
		this.height = 500;
		this.width = 1050;
		this.modal = true;

		this.items.add(
			this.filterFieldset = new FilterFieldset(entityName),
			tbar({
					cls: "border-top",
				},
				'->',
				btn({
					cls: "primary filled",
					text: t("Save"),
					handler: () => {
						this.filterFieldset.form.submit();
						this.close();
					}
				})
			)
		);
	}

	public load(value:Record<string, any>) {
		this.filterFieldset.form.value = value;
	}
}