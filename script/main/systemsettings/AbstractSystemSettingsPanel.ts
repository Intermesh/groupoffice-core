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
}