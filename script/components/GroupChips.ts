import {
	autocompletechips, AutoCompleteChipsConfig,
	AutoCompleteConfig,
	checkboxselectcolumn,
	column,
	DataSourceStore,
	datasourcestore, sortable,
	t,
	Table,
	table
} from "@intermesh/goui";
import {groupDS} from "../auth/index.js";

export function groupchips(config?: Partial<AutoCompleteChipsConfig<Table<DataSourceStore>>>) {
	return autocompletechips({
		name: "groups",
		label: t("Groups"),
		list: table({
			fitParent: true,
			headers: false,
			store: datasourcestore({
				dataSource: groupDS,
				filters:{
					default: {hideUsers: true, excludeEveryone: true}
				}
			}),
			rowSelectionConfig: {
				multiSelect: true
			},
			columns: [
				checkboxselectcolumn(),
				column({
					header: t("Name"),
					id: "name",
					sortable: true,
					resizable: true
				})
			]
		}),
		hint: t("Users will automatically be added to these groups"),
		chipRenderer: async (chip, value) => {
			const record = await groupDS.single(value.groupId ? value.groupId : value);
			chip.text = record.name;
		},
		pickerRecordToValue(field, record): any {
			return record.id;
		},
		listeners: {
			autocomplete: ({target, input}) => {
				target.list.store.setFilter("search", {text: input});
				void target.list.store.load();
			}
		},
		...config
	})
}