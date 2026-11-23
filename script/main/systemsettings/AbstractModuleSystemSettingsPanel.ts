import {comp, Component, ContainerField, containerfield, datasourceform, MaterialIcon, t} from "@intermesh/goui";
import {moduleDS, modules} from "../../Modules.js";
import {AbstractSystemSettingsPanel} from "./AbstractSystemSettingsPanel.js";

export class AbstractModuleSystemSettingsPanel extends AbstractSystemSettingsPanel {
	protected form;
	protected readonly settingsForm: ContainerField;

	/**
	 * Settings that are locked in the server configuration file (config.php). Their fields are disabled.
	 */
	protected readOnlyKeys: string[] = [];

	private readonly readOnlyNotice: Component;

	constructor( itemId:string,  title:string, protected modulePackage:string, protected moduleName:string, icon:MaterialIcon) {
		super(itemId, title, icon);

		this.itemId = itemId;
		this.title = title;

		this.cls = "fit scroll";

		this.readOnlyNotice = comp({
			tagName: "p",
			cls: "notice pad",
			hidden: true,
			html: "<i class='icon'>info</i> " + t("Some fields on this page can't be edited because they have been locked in the server configuration file.")
		});

		this.form = datasourceform({
				dataSource: moduleDS,
				patchMode: true
			},

			this.readOnlyNotice,

			this.settingsForm = containerfield({
					name: "settings",
					keepUnknownValues: false
				}
			)
		)
		this.items.add(this.form);
	}

	async load(): Promise<any> {
		const mod = modules.get(this.modulePackage, this.moduleName);
		if (mod) {
			this.form.value = mod;
			this.form.trackReset();

			this.form.currentId = mod.id;

			this.applyReadOnlyKeys(mod.settings?.readOnlyKeys ?? []);
		}
	}

	/**
	 * Check if a setting is locked in the server configuration file
	 *
	 * @param name The setting name
	 */
	protected isReadOnly(name: string): boolean {
		return this.readOnlyKeys.indexOf(name) > -1;
	}

	/**
	 * Disables the fields of settings that are locked in the server configuration file and shows a notice when there
	 * are any. Disabled fields are left out of the submitted value.
	 */
	private applyReadOnlyKeys(readOnlyKeys: string[]) {
		this.readOnlyKeys = readOnlyKeys;

		let hasReadOnlyFields = false;
		for (const key of readOnlyKeys) {
			for (const field of this.settingsForm.findFields(key)) {
				field.disabled = true;
				hasReadOnlyFields = true;
			}
		}

		this.readOnlyNotice.hidden = !hasReadOnlyFields;
	}

	async save(): Promise<any> {
		return this.form.submit();
	}

	protected formItems():Component[] {
		return [];
	}
}
