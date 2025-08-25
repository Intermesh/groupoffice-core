import {t, Window} from "@intermesh/goui";
import {EntityPanel} from "./EntityPanel.js";

export class EntityDialog extends Window {
	constructor() {
		super();

		this.maximized = true;
		this.modal = true;
	}

	public async load(entityName: string) {
		this.title = t("Custom fields") + ": " + t(entityName);

		const entityPanel = new EntityPanel(entityName);

		this.items.add(entityPanel);

		void entityPanel.load();
	}
}