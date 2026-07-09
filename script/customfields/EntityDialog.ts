import {t, Window} from "@intermesh/goui";
import {CustomFieldEntityPanel} from "./CustomFieldEntityPanel.js";

export class EntityDialog extends Window {
	constructor() {
		super();

		this.maximized = true;
		this.modal = true;
	}

	public async load(entityName: string) {
		this.title = t("Custom fields") + ": " + t(entityName);

		const entityPanel = new CustomFieldEntityPanel(entityName);

		this.items.add(entityPanel);

		void entityPanel.load();
	}
}