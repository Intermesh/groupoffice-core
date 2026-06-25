import {FormWindow} from "../../components/index.js";
import {displayfield, fieldset, t} from "@intermesh/goui";
import {moduleSystemSettings, ModuleInfo} from "./SystemSettingsModules.js";
import {ModulePermissionPanel} from "./ModulePermissionPanel.js";

export class ModuleDialog extends FormWindow {
	constructor(moduleInfo:ModuleInfo) {
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

		this.generalTab.items.add(...moduleSystemSettings.getPanels(moduleInfo.package, moduleInfo.name).map(c => new c));

		const permissionPanel = new ModulePermissionPanel(moduleInfo);
		permissionPanel.cls = "fit";
		this.cards.items.add(permissionPanel);

		permissionPanel.load();
	}
}
