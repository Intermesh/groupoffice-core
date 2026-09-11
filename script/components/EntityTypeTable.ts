import {column, Config, createComponent, store, Store, Table} from "@intermesh/goui";
import {entities, LinkConfig} from "../Entities";

export class EntityTypeTable extends Table<Store<LinkConfig>> {
	constructor() {

		super(
			store({
				data: entities.getLinkConfigs()
			}),
			[
				column({
					id: "iconCls",
					sortable: false,
					width: 48,
					htmlEncode: false,
					renderer: (iconCls, record, td, table1, storeIndex, column1) => {
						return `<div class="icon ${iconCls}"</div>`;
					}
				}),
				column({
					id: "title"
				})
			]

		);

		this.headers = false;
		this.rowSelectionConfig = {multiSelect: true, clickToAdd: true};
	}
}

export const entityttypeable = (config?: Config<EntityTypeTable>) => createComponent(new EntityTypeTable(), config);
