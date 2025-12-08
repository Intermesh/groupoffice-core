import {btn, Button, Filter, t} from "@intermesh/goui";
import {StrictFilterType} from "./StrictFilterType.js";
import {SubConditionDialog} from "../SubConditionDialog.js";

export class SubConditionFilter extends StrictFilterType {
	public button: Button;
	private readonly entityName: string;

	constructor(filter: Filter, entityName: string) {
		super(filter);

		this.entityName = entityName;

		this.items.add(
			this.button = btn({
				cls: "outlined",
				width: 600,
				text: t("Edit"),
				flex: 1,
				handler: () => {
					const dlg = new SubConditionDialog(this.entityName);

					if (this.valueField.value) {
						dlg.load((this.valueField.value as Record<string, any>));
					}

					dlg.filterFieldset.form.on("submit", ({target}) => {
						if (target.value.conditions.length == 0) {
							return
						}

						const conditionsObj = {};

						target.value.conditions.forEach((condition: any) => {
							Object.assign(conditionsObj, condition);
						});

						this.valueField.value = target.value;
						this.button.text = JSON.stringify(target.value);
					});

					dlg.show();
				}
			})
		);
	}

	public load(value: Record<string, any>) {
		this.button.text = JSON.stringify(value);

		this.valueField.on("render", () => {
			this.valueField.value = value;
		});
	}
}