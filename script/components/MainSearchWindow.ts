import {t, Window} from "@intermesh/goui";
import {SelectSearchPanel} from "./links/index.js";
import {entities} from "../Entities.js";


export class MainSearchWindow extends Window {
	private selectSearchPanel: SelectSearchPanel;
	constructor() {
		super();

		this.modal = true;
		this.title = t("Search")
		this.width = 800;
		this.height = 500;
		this.header = false;

		this.maximizable = true;
		this.resizable = true;

		this.items.add(
			this.selectSearchPanel = new SelectSearchPanel()
		);

		this.selectSearchPanel.resultTable.on("rowclick", ({storeIndex}) => {
			const record = this.selectSearchPanel.resultTable.store.get(storeIndex);
			if(record) {
				entities.get(record.entity).goto(record.entityId);
				this.close();
			}
		})

		this.on('focus', () => {
			this.selectSearchPanel.focus();
		});

		this.selectSearchPanel.on('select', ({record}) => {
			entities.get(record.entity).goto(record.entityId);
			this.close();
		});


	}

	protected createModalOverlay() {
		const o = super.createModalOverlay();
		o.el.addEventListener("click", () => {
			this.close();
		})
		return o;
	}

}