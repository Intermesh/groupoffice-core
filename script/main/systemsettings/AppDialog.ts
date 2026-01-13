import {FormWindow} from "../../components/index.js";
import {displayfield, fieldset, t} from "@intermesh/goui";
import {Module2} from "./Apps.js";
import {AppPermissionPanel} from "./AppPermissionsPanel.js";

export class AppDialog extends FormWindow {
	constructor(moduleInfo:Module2) {
		super("Module");

		this.title = moduleInfo.title;
		this.stateId = "module-dialog";
		this.modal = true;
		this.maximizable = true;

		this.width = 1000;
		this.height = 800;

		this.generalTab.items.add(
			fieldset({},
				displayfield({
					label: t("Author"),
					value: moduleInfo.author
				}),
				displayfield({
					label: t("Description"),
					value: moduleInfo.description
				})
			)
		);

		const permissionPanel = new AppPermissionPanel(moduleInfo);
		permissionPanel.cls = "fit";
		this.cards.items.add(permissionPanel);

		permissionPanel.load();
	}
}
