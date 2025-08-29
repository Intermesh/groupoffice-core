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
				checkboxselectcolumn({
					id: "selected"
				}),
				column({
					id: "title",
					htmlEncode: false,
					renderer: (columnValue, record) => {
						console.log(record, columnValue);
						return `<div class="icon ${record.iconCls}"></div>&nbsp;${columnValue.htmlEncode()}`;
					}
				})
			]

		);

		this.style.width = "100%";

		this.headers = false;
		this.rowSelectionConfig = {multiSelect: true};

		this.on("rowclick", ({storeIndex}) => {
			this.rowSelection!.clear();
			this.rowSelection!.selectIndex(storeIndex);
		})
	}
}

export const entityttypeable = (config?: Config<EntityTypeTable>) => createComponent(new EntityTypeTable(), config);
