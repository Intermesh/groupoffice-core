import {
	comp,
	Component,
	Config, createComponent,
	DataSourceStore,
	Store,
	StoreComponent,
	StoreEventMap,
	StoreRecord,
	t
} from "@intermesh/goui";

export class TableTitle extends Component implements StoreComponent {
	private titleCmp;
	private countCmp;
	private _store?: DataSourceStore;
	constructor() {
		super();

		this.baseCls = "table-title";

		this.items.add(
			this.titleCmp = comp({tagName: "h4", html: "&nbsp;"}),
			this.countCmp = comp({tagName: "small", html: "&nbsp;"}),
		)
	}

	public countEntityText = t("items");

	set store(store: DataSourceStore|undefined) {
		if(this._store) {
			this._store.unbindComponent(this);
		}

		this._store = store;
		if(store) {
			store.bindComponent(this);
			store.queryParams.calculateTotal = true;
		}
	}

	get store() {
		return this._store;
	}

	set title(title: string) {
		this.titleCmp.text = title;
	}

	get title() {
		return this.titleCmp.text;
	}

	set count(count: string) {
		this.countCmp.text = count;
	}

	get count() {
		return this.countCmp.text;
	}

	onBeforeStoreLoad(ev: StoreEventMap<StoreRecord>["beforeload"] & { target: Store }): void {
	}

	onRecordAdd(ev: StoreEventMap<StoreRecord>["add"] & { target: Store }): void {
	}

	onRecordRemove(ev: StoreEventMap<StoreRecord>["remove"] & { target: Store }): void {
	}

	onStoreLoad(ev: StoreEventMap<StoreRecord>["load"] & { target: Store }): void {
		this.count = this._store!.total + " " + this.countEntityText;
	}

	onStoreLoadException(ev: StoreEventMap<StoreRecord>["loadexception"] & { target: Store }): void {
	}
}

export const tabletitle = (config?: Config<TableTitle>) => createComponent(new TableTitle(), config);