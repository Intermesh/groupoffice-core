import {
	btn,
	cardmenu,
	cards,
	checkboxselectcolumn,
	column,
	comp,
	Component,
	DataSourceStore,
	datasourcestore,
	EntityID,
	splitter,
	t,
	Table,
	tbar,
	Window,
	WindowEventMap
} from "@intermesh/goui";
import {groupDS, principalDS} from "../../auth/index.js";
import {ExtJSWrapper} from "../ExtJSWrapper.js";
import {jmapds} from "../../jmap/index.js";


interface RecipientPickerComponent extends Component {
	getAll(): Promise<Recipient[]>;
	getSelected(): Recipient[];
}

interface Recipient {
	id: EntityID;
	name: string;
	email: string | undefined;
	avatarId: string | undefined;
	entity:string;
}

interface RecipientPickerEventMap extends WindowEventMap {
	select: {
		recipients: Recipient[]
	}
}

class AddressBookPicker extends ExtJSWrapper implements RecipientPickerComponent{
	constructor() {
		super( new go.modules.community.addressbook.SelectDialogPanel({title: undefined}));

		this.title = t("Contacts");
		this.cls = "fit";

		this.extJSComp.on("selectsingle", ( cmp:any,name:string,email:string, id:string) => {
			const recipient:Recipient = {
				id: "Contact:" + id,
				email,
				name,
				entity: "Contact",
				avatarId: undefined
			}

			const dlg = this.findAncestorByType(RecipientPicker)!;
			dlg.fire("select", {recipients: [recipient]});
			dlg.close();
		})
	}

	async getAll(): Promise<Recipient[]> {
		const ids = await this.extJSComp.addAll();
		return jmapds<Recipient>("Contact").get(ids).then(r => r.list.map(this.contactToRecipient));
	}

	private contactToRecipient(contact:any) : Recipient {
		return {
			entity: "Contact",
			id: "Contact:"+contact.id,
			avatarId: contact.photoBlobId,
			name: contact.name,
			email: contact.emailAddresses[0]?.email,
		}
	}

	getSelected(): Recipient[] {
		return this.extJSComp.grid.getSelectionModel().getSelections().map((r:any) => this.contactToRecipient(r.data));
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

		this.title = t("Select people");

		this.items.add(
			cardmenu(),

			this.cards = cards({flex: 1},
				new UserPicker(),
				new AddressBookPicker()
				),

			tbar({cls: "border-top"},
				"->",

				btn({
					text: t("Add all results"),
					cls: "filled primary",
					handler: async ()=> {

						const recipients = await  (this.cards.activeItemComponent as RecipientPickerComponent).getAll();

						const confirmed = await Window.confirm(t("Are you sure you want to select all {count} results?").replace('{count}', recipients.length), t("Confirm"));
						if(!confirmed) {
							return;
						}

						this.fire("select", {recipients});
						this.close();
					}
				}),

				btn({
					text: t("Add selected"),
					cls: "filled primary",
					handler: ()=>{
						const recipients = (this.cards.activeItemComponent as RecipientPickerComponent).getSelected()

						this.fire("select", {recipients});
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

class UserPicker extends Component implements RecipientPickerComponent {

	private readonly table;
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

	public async getAll(): Promise<Recipient[]> {

		const p = structuredClone(this.table.store.queryParams);
		delete p.limit;
		delete p.position;

		const r = await principalDS.query(p);
		return principalDS.get(r.ids).then(r => r.list.map(r => Object.assign(r, {entity: "User"})));
	}

	public getSelected() : Recipient[] {
		return this.table.rowSelection!.getSelected().map(r => {
			return {
				entity: "User",
				id: r.id,
				avatarId: r.record.avatarId,
				name: r.record.name,
				email: r.record.email,
			}
		});
	}
}