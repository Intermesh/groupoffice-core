import {AbstractSystemSettingsPanel} from "./AbstractSystemSettingsPanel.js";
import {btn, column, store, Store, t, table} from "@intermesh/goui";
import {EntityDialog} from "../../customfields/index.js";
import {modules} from "../../Modules.js";
import {entities} from "../../Entities.js";
import {systemSettingsPanels} from "./SystemSettingsWindow.js";

interface EntityWithCustomfields {
	entityName: string,
	moduleTitle: string
}

class CustomFields extends AbstractSystemSettingsPanel {

	private readonly store: Store<EntityWithCustomfields>
	constructor() {
		super("customfields", t("Custom fields"), "storage");

		this.cls = "fit scroll";

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
					rowdblclick: ({storeIndex}) => {
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

	public async load() {
		const tableData: EntityWithCustomfields[] = [];

		const mods = modules.getAll();

		for (const mod of mods) {
			for (const entityName in mod.entities) {
				const entity = entities.get(entityName.toString());

				if (entity == undefined) {
					continue;
				}

				if (entity.customFields) {
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


systemSettingsPanels.add(CustomFields);