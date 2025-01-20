import {t, Window} from "@intermesh/goui";
import {EntityPanel} from "./EntityPanel.js";
import {entities} from "../Entities.js";

export class EntityDialog extends Window {
	constructor() {
		super();

		this.maximized = true;
		this.modal = true;
	}

	public async load(entityName: string) {
		const entity = await entities.get(entityName)

		this.title = t("Custom fields") + ": " + t(entityName);

		const entityPanel = new EntityPanel(entityName);

		this.items.add(
			entityPanel
		);

		void entityPanel.load();
	}
}