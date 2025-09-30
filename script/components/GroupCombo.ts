import {
	AutocompleteEventMap,
	BaseEntity,
	ComboBox,
	ComboBoxConfig,
	ComboBoxDefaultRenderer, ComboBoxStoreConfig, ComboRenderer,
	createComponent,
	t, TableConfig
} from "@intermesh/goui";
import {JmapDataSource, jmapds} from "../jmap/index.js";
import {Group, groupDS, Principal, principalDS, User} from "../auth/index.js";
import {PrincipalCombo, PrincipalComboConfig} from "./PrincipalCombo";



export class GroupCombo extends ComboBox<JmapDataSource<Group>> {

	constructor(
		renderer:ComboRenderer = ComboBoxDefaultRenderer,
		storeConfig:ComboBoxStoreConfig<JmapDataSource<Group>> = {
			queryParams: {
				limit: 50
			}
		},
		tableConfig?: Partial<TableConfig>,
		protected selectFirst: boolean = false
		) {

		super(
			groupDS,
			"name",
			"id",
			renderer,
			storeConfig,
			tableConfig,
			selectFirst
		);

		this.name = "groupId";
		this.label = t("Group");

	}
}

export type GroupComboConfig = Omit<ComboBoxConfig<GroupCombo>, "dataSource"> & {
	entity?: string
}

export const groupcombo = (config?:GroupComboConfig) =>
	createComponent(new GroupCombo(
			config?.renderer ?? ComboBoxDefaultRenderer,
			config?.storeConfig ?? {	queryParams: {limit: 50}},
			config?.tableConfig ?? {},
			config?.selectFirst ?? false
		),
		config);

