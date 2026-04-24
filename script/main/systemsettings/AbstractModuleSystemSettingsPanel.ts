import {Component, containerfield, datasourceform, MaterialIcon, ObjectUtil} from "@intermesh/goui";
import {moduleDS, modules} from "../../Modules.js";
import {AbstractSystemSettingsPanel} from "./AbstractSystemSettingsPanel.js";

export class AbstractModuleSystemSettingsPanel extends AbstractSystemSettingsPanel {
	protected form;

	constructor( itemId:string,  title:string, protected modulePackage:string, protected moduleName:string, icon:MaterialIcon) {
		super(itemId, title, icon);

		this.itemId = itemId;
		this.title = title;

		this.cls = "fit scroll";

		this.form = datasourceform({
				dataSource: moduleDS,
				patchMode: true
			},
			containerfield({
					name: "settings",
					keepUnknownValues: false
				},
				...this.formItems()
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
		}
	}

	async save(): Promise<any> {
		return this.form.submit();
	}

	protected formItems():Component[] {
		return [];
	}
}