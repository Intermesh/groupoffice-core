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
import {Principal, principalDS, User} from "../auth/index.js";



export class PrincipalCombo extends ComboBox<JmapDataSource<Principal>> {

	constructor(
		/**
		 * If provided, it will only show entities of this type. For example "User"
		 */
		entity?:string,

		storeConfig:ComboBoxStoreConfig<JmapDataSource<Principal>> = {
			queryParams: {
				limit: 50
			}
		},
		tableConfig?: Partial<TableConfig>,
		protected selectFirst: boolean = false
		) {

		super(
			principalDS,
			"name",
			"id",
			(field, record) => {
				return `<h3>${record.name?.htmlEncode()}</h3><h4>${record.description?.htmlEncode()}</h4>`;
			},
			storeConfig,
			tableConfig,
			selectFirst

		);

		this.name = "userId";

		if(entity === 'User') {
			this.label = t("User");
		}

		this.filter = {entity: entity};
	}
}

export type PrincipalComboConfig = Omit<ComboBoxConfig<PrincipalCombo>, "dataSource"> & {
	/**
	 * If provided, it will only show entities of this type. For example "User"
	 */
	entity?: string
}

export const principalcombo = (config?:PrincipalComboConfig) =>
	createComponent(new PrincipalCombo(
			config?.entity,
			config?.storeConfig ?? {	queryParams: {limit: 50}},
			config?.tableConfig ?? {},
			config?.selectFirst ?? false
		),
		config);

