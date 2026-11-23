import {t} from "@intermesh/goui";
import {moduleDS, modules} from "../../Modules.js";
import {AbstractSystemSettingsPanel} from "./AbstractSystemSettingsPanel.js";
import {systemSettingsPanels} from "./SystemSettingsWindow.js";
import {ModulePermissionPanel} from "./ModulePermissionPanel.js";
import {ModuleInfo} from "./SystemSettingsModules.js";

/**
 * The rights of the core module: which groups may change users, groups and custom fields. Core isn't in the list of
 * modules, so these are set here.
 */
class SystemPermissions extends AbstractSystemSettingsPanel {

	private static readonly rights = ["mayChangeUsers", "mayChangeGroups", "mayChangeCustomFields"];

	private permissionPanel?: ModulePermissionPanel;
	private coreId?: string;

	constructor() {
		super("systempermissions", t("System permissions"), "admin_panel_settings");

		this.cls = "fit vbox";
	}

	async load(): Promise<any> {
		const core = modules.get("core", "core");
		if (!core) {
			return;
		}

		// Read the permissions fresh, the module in the session may be outdated
		const module = await moduleDS.single(core.id);
		this.coreId = module.id;

		const info = {
			...module,
			rights: SystemPermissions.rights.filter(r => module.rights.includes(r)),
			model: {id: module.id}
		} as unknown as ModuleInfo;

		this.permissionPanel = new ModulePermissionPanel(info, false);
		this.permissionPanel.flex = 1;
		this.permissionPanel.value = module.permissions ?? {};
		this.items.replace(this.permissionPanel);

		this.permissionPanel.load();
	}

	async save(): Promise<any> {
		if (!this.permissionPanel || !this.coreId) {
			return;
		}

		return moduleDS.update(this.coreId, {permissions: this.permissionPanel.value as any});
	}
}

systemSettingsPanels.add(SystemPermissions);
