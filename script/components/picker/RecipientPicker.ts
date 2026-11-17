import {
	btn,
	Button,
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
import {modules} from "../../Modules.js";


interface RecipientPickerComponent extends Component {
	/**
	 * Get all results. When not implemented the "Add all results" button is hidden.
	 */
	getAll?(): Promise<Recipient[]>;
	getSelected(): Recipient[] | Promise<Recipient[]>;
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

function contactToRecipient(contact:any) : Recipient {
	return {
		entity: "Contact",
		id: "Contact:"+contact.id,
		avatarId: contact.photoBlobId,
		name: contact.name,
		email: contact.emailAddresses[0]?.email,
	}
}

export class AddressBookPicker extends ExtJSWrapper implements RecipientPickerComponent{
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
		return jmapds("Contact").get(ids).then(r => r.list.map(contactToRecipient));
	}

	getSelected(): Recipient[] {
		return this.extJSComp.grid.getSelectionModel().getSelections().map((r:any) => contactToRecipient(r.data));
	}
}

/**
 * Selects the contacts or users of address lists from the newsletters module
 */
export class AddressListPicker extends ExtJSWrapper implements RecipientPickerComponent {
	/**
	 * @param entityName "Contact" or "User"
	 */
	constructor(private readonly entityName: "Contact" | "User") {
		const panelCls = entityName == "Contact" ?
			go.modules.business.newsletters.SelectContactDialogPanel :
			go.modules.business.newsletters.SelectUserDialogPanel;

		// no title so the ExtJS panel doesn't render a header inside the card
		super(new panelCls({title: undefined}));

		this.title = panelCls.prototype.title;
		this.cls = "fit";

		// the ExtJS panel calls dialog.addSelection() on double click
		this.extJSComp.dialog = {
			addSelection: async () => {
				const dlg = this.findAncestorByType(RecipientPicker)!;
				dlg.fire("select", {recipients: await this.getSelected()});
				dlg.close();
			}
		};
	}

	async getSelected(): Promise<Recipient[]> {
		const ids: string[] = await this.extJSComp.addSelection();
		if(!ids.length) {
			return [];
		}

		if(this.entityName == "Contact") {
			return jmapds("Contact").get(ids).then(r => r.list.map(contactToRecipient));
		}

		return principalDS.get(ids).then(r => r.list.map(p => ({
			entity: "User",
			id: p.id,
			avatarId: p.avatarId,
			name: p.name,
			email: p.email
		})));
	}
}

export class RecipientPicker extends Window<RecipientPickerEventMap> {

	/**
	 * The default picker cards: users, contacts and the address lists of the newsletters module if available
	 */
	public static defaultTypes(): (new () => RecipientPickerComponent)[] {
		const types: (new () => RecipientPickerComponent)[] = [UserPicker, AddressBookPicker];
		if(modules.isAvailable("business", "newsletters")) {
			types.push(
				class extends AddressListPicker { constructor() { super("Contact"); } },
				class extends AddressListPicker { constructor() { super("User"); } }
			);
		}
		return types;
	}

	private cards;
	constructor(types: (new () => RecipientPickerComponent)[] = RecipientPicker.defaultTypes()) {
		super();

		this.modal = true;
		this.width = 800;
		this.height = 600;
		this.resizable = true;
		this.collapsible = true;
		this.maximizable = true;

		this.title = t("Select people");

		let addAllBtn: Button;

		this.items.add(
			cardmenu(),

			this.cards = cards({flex: 1,
					listeners: {
						cardchange: () => {
							addAllBtn.hidden = !(this.cards.activeItemComponent as RecipientPickerComponent).getAll;
						}
					}
				},
				...types.map(type => new type),
				),

			tbar({cls: "border-top"},
				"->",

				addAllBtn = btn({
					text: t("Add all results"),
					cls: "filled primary",
					handler: async ()=> {

						const recipients = await (this.cards.activeItemComponent as RecipientPickerComponent).getAll!();

						const confirmed = await Window.confirm(t("Are you sure you want to select all {count} results?").replace('{count}', recipients.length), t("Confirm"));
						if(!confirmed) {
							return;
						}

						this.fire("select", {recipients});
						this.close();
					}
				}),

				btn({
					text: t("Add selection"),
					cls: "filled primary",
					handler: async ()=>{
						const recipients = await (this.cards.activeItemComponent as RecipientPickerComponent).getSelected();

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


		this.rowSelectionConfig = {multiSelect: true};
		this.scrollLoad = true;

		this.on("render", () => {
			void this.store.load();
		})
	}
}

export class UserPicker extends Component implements RecipientPickerComponent {

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