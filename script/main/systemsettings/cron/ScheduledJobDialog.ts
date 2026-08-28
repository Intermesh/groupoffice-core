import {FormWindow} from "../../../components";
import {checkbox, fieldset, t, textfield} from "@intermesh/goui";

export class ScheduledJobDialog extends FormWindow {
	constructor() {
		super("CronJobSchedule");

		this.title = t("Scheduled task");
		this.maximizable = false;
		this.resizable = false;
		this.closable = true;

		this.generalTab.items.add(
			fieldset({flex: 1},
				textfield({
					name: "description",
					label: t("Description"),
					required: true
				}),
				textfield({
					name: "expression",
					label: t("Expression"),
					required: true
				}),
				checkbox({
					type: "switch",
					name: "enabled",
					label: t("Enabled")
				})
			)
		);


	}
}