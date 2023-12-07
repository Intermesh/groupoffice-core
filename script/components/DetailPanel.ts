import {
	BaseEntity,
	comp,
	Component,
	ComponentEventMap,
	DefaultEntity,
	FunctionUtil,
	EntityID,
	ObservableListenerOpts,
	t,
	tbar,
	Toolbar,
	Window
} from "@intermesh/goui";
import {jmapds} from "../jmap";
import {router} from "../Router";
// import {EntityID} from "../../../dist/goui/script";


export interface DetailPanelEventMap<Type, EntityType extends BaseEntity = DefaultEntity> extends ComponentEventMap<Type> {
	/**
	 * Fires when entity is loaded
	 */
	load: (detailPanel: Type, entity: EntityType) => false | void

	/**
	 * Fires when the panel is reset
	 *
	 * @param detailPanel
	 */
	reset: (detailPanel: Type) => void

}

export interface DetailPanel<EntityType extends BaseEntity = DefaultEntity> extends Component {
	on<K extends keyof DetailPanelEventMap<this, EntityType>>(eventName: K, listener: Partial<DetailPanelEventMap<this, EntityType>>[K], options?: ObservableListenerOpts): void

	fire<K extends keyof DetailPanelEventMap<this, EntityType>>(eventName: K, ...args: Parameters<DetailPanelEventMap<any, EntityType>[K]>): boolean

}

/**
 * Detail panel
 *
 * Used to show an entity when selected in the grid.
 */
export abstract class DetailPanel<EntityType extends BaseEntity = DefaultEntity> extends Component {
	protected titleCmp?: Component;
	protected entity?: EntityType;
	protected readonly scroller: Component;
	private detailView: any;
	protected toolbar!: Toolbar;

	protected constructor(public entityName:string) {
		super();

		// reload or reset on entity update or destroy
		jmapds(this.entityName).on("change", (ds, changes) => {
			if(this.entity) {
				const id = this.entity.id + "";
				if (changes.updated && changes.updated.indexOf(id) > -1) {
					this.load(this.entity.id);
				}

				if (changes.destroyed && changes.destroyed.indexOf(id) > -1) {
					this.reset();

					// update router path
					const rPath = router.getPath();
					if(rPath.match("/" + id +"$")) {
						router.setPath(rPath.substring(0, rPath.length - id.length - 1));
					}
				}
			}
		})

		this.baseCls = "detail";

		// this.style.position = "relative";
		this.disabled = true;
		this.cls = "vbox";

		this.items.add(
			this.createToolbar(),
			this.scroller = comp({flex: 1, cls: "scroll", hidden: true})
		);

	}

	private get legacyDetailView() {
		if(!this.detailView) {
			if("ResizeObserver" in window) {
				const ro = new ResizeObserver(FunctionUtil.buffer(100, () => {
					this.detailView.doLayout();
				}));

				ro.observe(this.el);
			}

			this.detailView = new go.detail.Panel({
				width: undefined,
				entityStore: go.Db.store(this.entityName),
				header: false
			});

			this.scroller.items.add(this.detailView);
		}

		return this.detailView;
	}

	protected addCustomFields() {
		this.legacyDetailView.addCustomFields();
	}

	protected addLinks() {
		this.legacyDetailView.addLinks();
	}
	protected addComments() {
		this.legacyDetailView.addComments();
	}
	protected addFiles() {
		this.legacyDetailView.addFiles();
	}
	protected addHistory() {
		this.legacyDetailView.addHistory();
	}

	private createToolbar() {
		return this.toolbar = tbar({
				cls: "border-bottom"
			},
			'->'
		);
	}

	set title(title: string) {
		super.title = title;

		if(this.titleCmp) {
			this.titleCmp.text = title;
		}
	}

	get title() {
		return super.title;
	}

	public async load(id: EntityID) {


		this.mask();

		try {
			this.entity = await jmapds<EntityType>(this.entityName).single(id.toString());

			if(!this.entity) {
				throw "notfound";
			}

			this.scroller.hidden = false;
			this.disabled = false;
			this.fire("load", this, this.entity);

			// this.title = this.entity.name;
			//
			// this.content.items.clear();
			// this.content.items.add(Image.replace(this.entity.content));

			this.legacyOnLoad();

		} catch (e) {
			console.error(e);
			void Window.error(e + "");
		} finally {
			this.unmask();
		}

		return this;
	}


	public reset() {
		this.entity = undefined;
		this.title = "";

		if(this.detailView) {
			this.detailView.reset();
		}
		this.disabled = true;
		this.scroller.hidden = true;

		this.fire("reset", this);
	}

	private legacyOnLoad() {
		if(this.detailView) {
			this.detailView.currentId = this.entity!.id;
			this.detailView.internalLoad(this.entity);
		}
	}
}