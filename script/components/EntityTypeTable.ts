import {
	checkboxselectcolumn,
	column,
	Config,
	createComponent,
	ListEventMap,
	store,
	Store,
	Table
} from "@intermesh/goui";
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

		this.style.width = "100%";

		this.headers = false;
		this.rowSelectionConfig = {multiSelect: true, clickToAdd: true};

		// this.on("rowclick", ({storeIndex}) => {
		// 	this.rowSelection!.clear();
		// 	this.rowSelection!.selectIndex(storeIndex);
		// })
	}
}

export const entityttypeable = (config?: Config<EntityTypeTable>) => createComponent(new EntityTypeTable(), config);
