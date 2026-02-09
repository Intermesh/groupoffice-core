import {
	btn,
	cardmenu,
	cards,
	checkboxselectcolumn,
	column,
	comp,
	Component,
	DataSourceStore,
	datasourcestore, EntityID, RowSelect,
	splitter,
	t,
	Table,
	tbar,
	Window, WindowEventMap
} from "@intermesh/goui";
import {groupDS, Principal, principalDS} from "../../auth/index.js";


interface RecipientPickerComponent extends Component {
	table: Table<DataSourceStore<typeof principalDS>> & {rowSelection: RowSelect};
}

interface RecipientPickerEventMap extends WindowEventMap {
	select: {
		principalIds: EntityID[]
	}
}

export class RecipientPicker extends Window<RecipientPickerEventMap> {
	private cards;
	constructor() {
		super();

		this.modal = true;
		this.width = 800;
		this.height = 600;
		this.resizable = true;
		this.collapsible = true;
		this.maximizable = true;

		this.title = "Recipient picker";

		this.items.add(
			cardmenu(),

			this.cards = cards({flex: 1},
				new UserPicker()
				),

			tbar({cls: "border-top"},
				"->",

				btn({
					text: t("Add all results"),
					cls: "filled primary",
					handler: async ()=> {

						const tbl = (this.cards.activeItemComponent as RecipientPickerComponent).table;
						const p = structuredClone(tbl.store.queryParams);
						delete p.limit;
						delete p.position;

						const response = await principalDS.query(p);

						const confirmed = await Window.confirm(t("Are you sure you want to select all {count} results?").replace('{count}', response.ids.length), t("Confirm"));
						if(!confirmed) {
							return;
						}

						this.fire("select", {principalIds: response.ids});
						this.close();
					}
				}),

				btn({
					text: t("Add selected"),
					cls: "filled primary",
					handler: ()=>{
						const principalIds = (this.cards.activeItemComponent as RecipientPickerComponent).table.rowSelection.getSelected().map(r => r.id);

						this.fire("select", {principalIds});
						this.close();
					}
				})
				)
		)
	}
}

class GroupTable extends Table<DataSourceStore<typeof groupDS>> {
	constructor() {
		super(
			datasourcestore({
				dataSource: groupDS,
				sort: [{property:"name"}],
				filters: {
					default: {
						hideUsers: true
					}
				},
			}),
			[
				checkboxselectcolumn(),
				column({id: "name", header: t("Name")}),
			]
		);
		this.scrollLoad = true;
		this.fitParent = true;
		this.rowSelectionConfig = {multiSelect: true};

		this.on("render", () => {
			void this.store.load();
		})
	}
}

class UserTable extends Table<DataSourceStore<typeof principalDS>> {
	constructor() {
		super(
			datasourcestore({
				dataSource: principalDS,
				filters: {
					default: {entity: "User"}
				},
				sort: [{property:"displayName"}]
			}),
			[
				checkboxselectcolumn(),
				column({id: "name", header: t("Name")}),
				column({id: "email", header: t("E-mail")}),
			]
		);

		this.fitParent = true;

		this.rowSelectionConfig = {multiSelect: true};
		this.scrollLoad = true;

		this.on("render", () => {
			void this.store.load();
		})
	}
}

class UserPicker extends Component {

	public readonly table;
	constructor() {
		super();

		this.cls = "fit hbox";
		this.title = t("Users");

		this.table = new UserTable()

		const groupTable = new GroupTable();
		groupTable.rowSelection!.on("selectionchange", ({selected}) => {
			const groupIds = selected.map(r => r.id);
			void this.table.store.setFilter("groupId", groupIds.length ? {groupId: groupIds} : undefined).load();
		})

		this.items.add(
			comp({cls: "scroll bg-lowest", width: 300}, groupTable),
			splitter({
				resizeComponent: s => s.previousSibling()!
			}),
			comp({flex: 1, cls: "scroll bg-lowest"}, this.table),
		)
	}
}