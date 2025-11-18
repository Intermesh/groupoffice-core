import {btn, t, tbar, Window, WindowEventMap} from "@intermesh/goui";
import {SelectSearchPanel} from "./SelectSearchPanel";
import {Search} from "../../model/Link";

export  interface SelectSearchWindowEventMap extends WindowEventMap {
	select: {
		records: Search[]
	}
}

export class SelectSearchWindow extends Window<SelectSearchWindowEventMap> {
	private selectSearchPanel: SelectSearchPanel;
	constructor() {
		super();

		this.title = t("Search")
		this.width = 800;
		this.height = 500;

		this.maximizable = true;
		this.resizable = true;

		this.items.add(
			this.selectSearchPanel = new SelectSearchPanel(),

			tbar({cls: "border-top"},
				"->",
					btn({
						cls: "filled primary",
						text: t("Ok"),
						handler: () => {
							this.select();
						}
					})
				)
		);

		this.selectSearchPanel.resultTable.on("rowdblclick", () => {
			this.select()
		})


	}

	private select() {
		const selected = this.selectSearchPanel.resultTable.rowSelection!.getSelected()

		this.close();
		this.fire("select", {records: selected.map(ids =>  ids.record)});
	}
}