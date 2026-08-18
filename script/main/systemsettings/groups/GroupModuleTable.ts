import {
	autocompletechips,
	checkbox,
	CheckboxColumn,
	checkboxcolumn,
	checkboxselectcolumn,
	column,
	DataSourceStore,
	datasourcestore,
	EntityID,
	store,
	t,
	table,
	Table
} from "@intermesh/goui";
import {moduleDS} from "../../../Modules.js";

export class GroupModuleTable extends Table<DataSourceStore> {
	private groupId: string | undefined;

	constructor() {
		const moduleStore = datasourcestore({
			dataSource: moduleDS,
			sort: [{property: "enabled"}]
		});

		const columns = [
			column({
				id: "title",
				header: t("Name")
			}),
			column({
				id: "package",
				header: t("Package")
			}),
			column({
				id: "permissions",
				header: t("Permissions"),
				width: 500,
				renderer: (columnValue, record, td) => {
					const groupKey = this.groupId ?? "null";
					const entry = columnValue ? columnValue[groupKey] : undefined;
					const moduleId = record.moduleId ?? record.id;

					if (!entry) {
						return "-";
					}

					if (this.groupId == "1") {
						const allRights = Object.keys(entry.rights)
							.filter(r => r !== 'mayRead' && entry.rights[r])
							.map(r => t(r));
						return allRights.length ? allRights.join(', ') : t("Use");
					}
					const rightKeys = (record.rights as string[]).filter(r => r !== 'mayRead');

					const field = autocompletechips({
						list: table({
							fitParent: true,
							headers: false,
							store: store({
								data: rightKeys.map(name => ({
									id: name,
									name: t(name)
								}))
							}),
							columns: [
								checkboxselectcolumn(),
								column({id: "name", sortable: false, resizable: false})
							],
							rowSelectionConfig: {multiSelect: true}
						}),
						value: rightKeys.filter(name => !!entry.rights[name]),
						chipRenderer: async (chip, value) => {
							chip.text = t(value, record.package, record.name);
						}
					});

					field.on("change", async ({newValue}) => {
						const groupKey = this.groupId ?? "null";

						const moduleGetResponse = await moduleDS.get([moduleId]);
						if (moduleGetResponse.list) {
							const permissions = moduleGetResponse.list[0].permissions;
							const freshEntry: any = permissions[groupKey] ?? entry;

							const updatedRights = {
								...freshEntry.rights,
								...Object.fromEntries(
									rightKeys.map(key => [key, (newValue as string[]).includes(key)])
								)
							};

							permissions[groupKey] = {
								...freshEntry,
								rights: updatedRights
							};

							await moduleDS.update(moduleId, {permissions});
							this.store.reload();
						}
					});

					return field;
				}
			}),
			checkboxcolumn({
				id: "selected",
				header: t("Enabled"),
				width: 40,
				resizable: false,
				sortable: false,

				renderer: (val, record, td, table, rowIndex, col) => {
					const groupKey = this.groupId ?? "null";
					const checked = !!(record.permissions && record.permissions[groupKey]);
					const disabled = record.package === "core" && this.groupId === "2";

					return checkbox({
						value: checked,
						disabled: disabled,
						listeners: {
							change: async ({target, newValue}) => {
								let permissions = record.permissions || {};

								if (newValue) {
									if (!permissions[groupKey]) {
										permissions[groupKey] = {rights: {}};
									}
								} else {
									delete permissions[groupKey];
								}

								await moduleDS.update(record.moduleId ?? record.id, {permissions});

								(col as CheckboxColumn).fire("change", {
									checkbox: target,
									checked: newValue,
									record,
									storeIndex: rowIndex
								});

								this.store.reload();
							}
						}
					});
				}
			}),
		];

		super(moduleStore, columns);

		this.fitParent = true;
	}

	public load(groupId: string) {
		this.groupId = groupId;

		void this.store.load();
	}
}