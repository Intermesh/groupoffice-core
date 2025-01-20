import {
	btn,
	column,
	Component,
	Store,
	store,
	t,
	table
} from "@intermesh/goui";
import {EntityDialog} from "./EntityDialog.js";
import {modules} from "../Modules.js";
import {entities} from "../Entities.js";

interface EntityWithCustomfields {
	entityName: string,
	moduleTitle: string
}

export class SystemSettingsPanel extends Component {
	private readonly store: Store<EntityWithCustomfields>

	constructor() {
		super();

		this.store = store<EntityWithCustomfields>({});

		this.title = t("Custom fields");
		this.stateId = "customfields";

		this.cls = "scroll fit";

		this.items.add(
			table({
				fitParent: true,
				store: this.store,
				cls: "bg-lowest",
				rowSelectionConfig: {
					multiSelect: false
				},
				listeners: {
					rowdblclick: (list,storeIndex, row, ev) => {
						const dlg = new EntityDialog();
						void dlg.load(this.store.get(storeIndex)!.entityName);
						dlg.show();
					}
				},
				columns: [
					column({
						id: "entityName",
						header: t("Name"),
						hidable: false
					}),
					column({
						id: "moduleTitle",
						header: t("Module")
					}),
					column({
						id: "edit",
						sticky: true,
						width: 50,
						renderer: (columnValue, record, td, table1, storeIndex) => {
							return btn({
								icon: "edit",
								handler: () => {
									const dlg = new EntityDialog();
									void dlg.load(record.entityName);
									dlg.show();
								}
							});
						}
					})
				]
			})
		);

		void this.load();
	}

	private async load() {
		const tableData: EntityWithCustomfields[] = [];

		const mods = await modules.getAll();

		for (const mod of mods) {
			for (const entityName in mod.entities) {
				const entity = await entities.get(entityName);

				if (entity.supportsCustomFields) {
					const cfEntity: EntityWithCustomfields = {
						entityName: entity.name,
						moduleTitle: mod.name
					}

					tableData.push(cfEntity);
				}
			}
		}
		this.store.loadData(tableData);
	}
}
