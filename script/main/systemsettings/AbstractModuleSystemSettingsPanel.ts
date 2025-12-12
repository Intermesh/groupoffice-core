import {AbstractSystemSettingsPanel} from "./AbstractSystemSettingsPanel.js";
import {Component, containerfield, datasourceform} from "@intermesh/goui";
import {moduleDS, modules} from "../../Modules.js";

export class AbstractModuleSystemSettingsPanel extends AbstractSystemSettingsPanel {
	private form;

	constructor( itemId:string,  title:string, protected modulePackage:string, protected moduleName:string) {
		super(itemId, title);

		this.form = datasourceform({
				dataSource: moduleDS
			},
			containerfield({
					name: "settings"
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