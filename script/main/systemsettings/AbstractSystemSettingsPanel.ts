import {Component, MaterialIcon} from "@intermesh/goui";
import {User} from "../../auth/index.js";

export abstract class AbstractSystemSettingsPanel extends Component {

	constructor(itemId: string, title: string, icon:MaterialIcon) {
		super();

		this.itemId = itemId;
		this.title = title;
		this.dataSet.icon = icon;
	}

	public async save() : Promise<any> {
		return Promise.resolve();
	}

	public async load() :Promise<any> {
		return Promise.resolve();
	}

	/**
	 * Check if the page must be reloaded after saving, because the changes only apply on a new page load. Like the
	 * title, logo or colours. Called before {@link save()}.
	 */
	public needsReload(): boolean {
		return false;
	}
}