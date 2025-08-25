import {
	btn,
	checkboxcolumn,
	column,
	DataSourceStore,
	datasourcestore,
	t,
	table,
	tbar,
	Window
} from "@intermesh/goui";
import {client} from "../jmap/index.js";
import {entities, Entity} from "../Entities.js";
import {fieldSetDS} from "../CustomFields.js";

export class ExportDialog extends Window {
	private entity!: Entity;
	private readonly store: DataSourceStore;

	constructor() {
		super();

		this.width = 1000;
		this.height = 800;

		this.store = datasourcestore({
			dataSource: fieldSetDS
		});

		this.items.add(
			tbar({},
				btn({
					icon: "save",
					handler: async () => {
						const fieldSetIds: string[] = [];

						this.store.data.forEach((record) => {
							if (record.export) {
								fieldSetIds.push(record.id);
							}
						});

						if (fieldSetIds.length > 0) {
							const params = {
								fieldSetIds: fieldSetIds,
								entity: this.entity.name
							}

							client.jmap("FieldSet/exportToJson", params).then((response) => {
								client.downloadBlobId(response.blobId, this.entity.name + ".json");
							})
						}
					}
				})
			),
			table({
				fitParent: true,
				store: this.store,
				columns: [
					checkboxcolumn({
						id: "export",
						header: t("Export")
					}),
					column({
						id: "name",
						header: t("Field set")
					})
				]
			})
		);
	}

	public async load(entityName: string) {
		const entity = await entities.get(entityName);

		this.title = t("Export fieldsets to JSON-file") + ": " + t(entityName);

		this.store.setFilter("entity", {entities: entity});

		this.entity = entity;

		void this.store.load();
	}
}