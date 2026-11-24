import {
	btn,
	Button,
	comp,
	Component,
	Config,
	createComponent,
	DataSourceStore,
	h3,
	MaterialIcon,
	p,
	Store,
	t
} from "@intermesh/goui";

/**
 * Filters that mean the user searches or filters, unless a list passes its own with {@link EmptyState.filterNames}
 */
const defaultFilterNames = ["search", "text", "user", "customfilters"];

/**
 * Empty state of a list that explains what the items are for and offers to add the first one
 *
 * While the user searches or filters, it only says that no items are found, because adding an item isn't what they're
 * after then.
 *
 * Set it as the `emptyState` of a List or Table:
 *
 * ```
 * this.noteGrid.emptyState = emptystate({
 * 	store: this.noteGrid.store,
 * 	icon: "sticky_note_2",
 * 	heading: t("No notes yet"),
 * 	description: t("Write down information you want to keep, like meeting minutes or instructions."),
 * 	addText: t("Add note"),
 * 	mayAdd: () => !this.addButton.disabled,
 * 	onAdd: () => this.addNote()
 * });
 * ```
 */
export class EmptyState extends Component {
	/**
	 * Icon shown above the title
	 */
	public icon: MaterialIcon = "article";

	/**
	 * Heading when the list has no items, like "No notes yet"
	 */
	public heading = "";

	/**
	 * What the items are for
	 */
	public description = "";

	/**
	 * Text of the button that adds the first item. Without it or {@link onAdd} the empty state has no button.
	 */
	public addText = "";

	/**
	 * Adds an item, like the add button in the toolbar of the list
	 */
	public onAdd?: () => void;

	/**
	 * Whether the user may add an item now, for example when a container with write permission is selected
	 */
	public mayAdd: () => boolean = () => true;

	/**
	 * Names of the store filters that mean the user searches or filters
	 */
	public filterNames = defaultFilterNames;

	private readonly iconEl;
	private readonly headingEl;
	private readonly descriptionEl;
	private readonly addButton: Button;

	constructor(public readonly store: Store) {
		super();

		this.cls = "goui-empty-state empty-state";

		this.items.add(
			this.iconEl = comp({tagName: "i", cls: "icon"}),
			this.headingEl = h3(),
			this.descriptionEl = p(),
			this.addButton = btn({
				cls: "filled primary",
				icon: "add",
				handler: () => this.onAdd?.()
			})
		);

		const onLoad = () => this.refresh();
		store.on("load", onLoad);
		this.on("remove", () => store.un("load", onLoad));
		this.on("render", onLoad);
	}

	/**
	 * Whether one of the {@link filterNames} is set with a value
	 */
	public isFiltered(): boolean {
		const store = this.store;
		if(!(store instanceof DataSourceStore)) {
			return false;
		}

		return this.filterNames.some(name => {
			const filter = store.getFilter(name);
			return filter !== undefined && Object.values(filter).some(v => v !== undefined && v !== "" && !(Array.isArray(v) && !v.length));
		});
	}

	/**
	 * Shows the full empty state or "No items found", and whether the user may add an item
	 */
	public refresh() {
		const filtered = this.isFiltered();

		this.iconEl.text = filtered ? "search_off" : this.icon;
		this.headingEl.text = filtered ? t("No items found") : this.heading;
		this.descriptionEl.text = filtered ? t("Try other search words or filters.") : this.description;
		this.descriptionEl.hidden = !this.descriptionEl.text;

		this.addButton.text = this.addText;
		this.addButton.hidden = filtered || !this.onAdd || !this.addText || !this.mayAdd();
	}
}

/**
 * Shorthand function to create {@link EmptyState}
 */
export const emptystate = (config: Config<EmptyState> & {store: Store}) => createComponent(new EmptyState(config.store), config);
