import {Component, containerfield, datasourceform, Fieldset} from "@intermesh/goui";
import {moduleDS, modules} from "../../Modules";

export class ModuleSettingsFieldset extends Fieldset {

	protected form;

	constructor(title: string, protected modulePackage: string, protected moduleName: string) {
		super();
		this.modulePackage = modulePackage;
		this.moduleName = moduleName;
		this.legend = title;

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
		this.on("render", () => void this.load());
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

	protected formItems(): Component[] {
		return [];
	}
}