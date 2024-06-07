import {
	AbstractDataSource,
	BaseEntity,
	btn,
	CardContainer,
	CardMenu,
	cardmenu,
	cards,
	comp,
	Component,
	containerfield,
	datasourceform,
	DataSourceForm, DefaultEntity,
	EntityID,
	Listener,
	ObservableListenerOpts,
	t,
	tbar, Toolbar,
	Window,
	WindowEventMap
} from "@intermesh/goui";
import {sharepanel, SharePanel} from "../permissions";
import {jmapds} from "../jmap";


/**
 * @inheritDoc
 */
export interface FormWindowEventMap<Type> extends WindowEventMap<Type> {

	/**
	 * Fires when the window is shown and loaded with data. Also fires if the dialog is for creating new entities and
	 * not loaded.
	 *
	 * @param window
	 */
	ready: (window: Type, currentId: string|undefined) => void

	addlink: (window: Type, entityName: string, entityId: string) => void
}

export interface FormWindow<EntityType extends BaseEntity = DefaultEntity> {
	on<K extends keyof FormWindowEventMap<this>, L extends Listener>(eventName: K, listener: Partial<FormWindowEventMap<this>>[K], options?: ObservableListenerOpts): L;
	un<K extends keyof FormWindowEventMap<this>>(eventName: K, listener: Partial<FormWindowEventMap<this>>[K]): boolean
	fire<K extends keyof FormWindowEventMap<this>>(eventName: K, ...args: Parameters<FormWindowEventMap<any>[K]>): boolean
}

export abstract class FormWindow<EntityType extends BaseEntity = DefaultEntity> extends Window {
	public readonly form;

	protected currentId?: EntityID;
	protected readonly cards: CardContainer;
	protected sharePanel?: SharePanel;
	protected bbar: Toolbar

	/**
	 * The first tab
	 *
	 * @protected
	 */
	protected readonly generalTab: Component;
	private cardMenu: CardMenu;

	/**
	 * Constructor
	 *
	 * @param entityName Name of the entity for the datasource form
	 * @protected
	 */
	protected constructor(public entityName:string) {
		super();

		this.baseCls = "goui-window form-window";
		this.cls = "vbox";
		this.width = 460;


		this.items.add(
			this.form = datasourceform<EntityType>(
				{
					dataSource: jmapds(this.entityName),
					cls: "vbox",
					flex: 1,
					listeners: {
						save: (form, data) => {
							this.currentId = data.id;
							this.close();
						},

						invalid: (form) => {

							const invalid = form.findFirstInvalid();

							if (invalid) {
								const tab = invalid.findAncestor(cmp => {
									return cmp.el.classList.contains('card-container-item');
								});
								if (tab) {
									tab.show();
								}
								invalid.focus();
							}
						}
					}
				}
				,

				this.cardMenu = cardmenu(),

				this.cards = cards({flex: 1},

					this.generalTab = comp({
							cls: "scroll fit",
							title: t("General")
						}
					)
				),

				this.bbar = tbar({cls: "border-top"},
					"->",
					btn({
						type: "submit",
						text: t("Save")
					})
				)
			)
		)

		// fire the ready event if not loading the form with data. If it's loading then the ready event will fire
		// on the form load event.
		this.on("show", () => {
			return this.onShow();
		})

		this.on("beforeclose", (win, byUser) => {
			return this.onBeforeClose(byUser);
		})

	}

	protected onBeforeClose(byUser: boolean) {
		if(!byUser) {
			return true;
		}
		if(this.form.isModified()) {
			Window.confirm(t("Are you sure you want to close this window and discard your changes?")).then((confirmed) => {
				if(confirmed) {
					this.close();
				}
			});

			return false;
		}
	}

	protected onShow() {
		// do a setTimeout so currentId is set if win.show().load() is called in that order.
		setTimeout(() => {

			this.cardMenu.hidden = this.cards.items.count() < 2;

			if (!this.currentId) {
				// focus form for new entities and not for existing ones.
				this.form.focus();
				this.fire("ready", this, this.currentId);
			}
		});
	}

	/**
	 * Add a share panel to set permissions
	 *
	 * @params options if not provided the default is:
	 * [
	 * 	{value: "", name: ""},
	 * 	{value: 10, name: t("Read")},
	 * 	{value: 20, name: t("Create")},
	 * 	{value: 30, name: t("Write")},
	 * 	{value: 40, name: t("Delete")},
	 * 	{value: 50, name: t("Manage")}
	 * ]
	 */
	protected addSharePanel(levels?:{ [key: string]: any }[]) {
		this.sharePanel = sharepanel({
			cls: "fit",
			levels,
			listeners: {
				show: () => {
					this.sharePanel!.load();
				}
			}
		});
		this.cards.items.add(this.sharePanel);

		this.on("ready", () => {
			this.sharePanel!.setEntity(this.entityName, this.currentId);
		})

	}

	public async load(id: EntityID) {

		this.mask();

		try {
			this.currentId = id;
			await this.form.load(id);
			this.fire("ready", this, this.currentId);
		} catch (e) {
			void Window.error(e + "");
		} finally {
			this.unmask();
		}

		return this;
	}


	protected addCustomFields() {

		this.on("render", () => {
			if(this.hidden) {
				this.on("show", () => this.renderCustomFields())
			} else {
				this.renderCustomFields();
			}
		})
	}


	private renderCustomFields() {
		if (go.Entities.get(this.entityName).customFields) {

			const fieldsets = go.customfields.CustomFields.getFormFieldSets(this.entityName);
			fieldsets.forEach((fs: any) => {

				//replace customFields. because we will use a containerfield here.
				fs.cascade((item: any) => {
					if (item.getName) {
						let fieldName = item.getName().replace('customFields.', '');
						item.name = item.hiddenName =  fieldName;
					}
				});

				if (fs.fieldSet.isTab) {
					fs.title = null;
					fs.collapsible = false;

					this.cards.items.add(
						containerfield({
							name: "customFields",
							cls: "scroll",
							title: fs.fieldSet.name,
							listeners: {
								show: () => {
									fs.doLayout();
								}
							}
						}, fs
						)
					);
				} else {
					//in case formPanelLayout is set to column
					fs.columnWidth = 1;
					this.generalTab.items.add(containerfield({name: "customFields"}, fs));
				}
			}, this);

		}
	}

	/**
	 * Adds a link between two entities on save.
	 *
	 * @param {string} entityName - The name of the target entity.
	 * @param {string} entityId - The ID of the target entity.
	 * @return {void}
	 */

	public addLinkOnSave(entityName:string, entityId:string) {

		const unbindkey = this.form.on("save", (form1, data) => {
			const link = {
				"toId": entityId,
				"toEntity": entityName,
				"fromId": data.id,
				"fromEntity": this.entityName
			}

			jmapds("Link").create(link).catch((e) => {
				Window.error(e.message);
			})
		}, {once: true});

		this.on("close", () => {
			// set timeout because close will fire before the save listeners above are fired.
			setTimeout(() => {
				this.form.un("save", unbindkey);
			})
		})

		this.fire("addlink", this, entityName, entityId);
	}

}