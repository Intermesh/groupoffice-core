import {
	btn,
	CardContainer,
	cardmenu,
	cards,
	containerfield,
	datasourceform,
	DataSourceForm,
	EntityID,
	Fieldset,
	fieldset, ObservableListenerOpts,
	t,
	tbar,
	Window, WindowEventMap
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
}

export interface FormWindow {
	on<K extends keyof FormWindowEventMap<this>>(eventName: K, listener: Partial<FormWindowEventMap<this>>[K], options?: ObservableListenerOpts): void;

	fire<K extends keyof FormWindowEventMap<this>>(eventName: K, ...args: Parameters<FormWindowEventMap<any>[K]>): boolean
}

export abstract class FormWindow extends Window {
	public readonly form: DataSourceForm;

	protected currentId?: EntityID;
	protected readonly cards: CardContainer;
	protected sharePanel?: SharePanel;

	/**
	 * The first tab
	 *
	 * @protected
	 */
	protected readonly generalTab: Fieldset;

	/**
	 * Constructor
	 *
	 * @param entityName Name of the entity for the datasource form
	 * @protected
	 */
	protected constructor(public entityName:string) {
		super();

		this.cls = "vbox";
		this.width = 600;
		this.height = 600;

		this.items.add(
			this.form = datasourceform(
				{
					dataSource: jmapds(this.entityName),
					cls: "vbox",
					flex: 1,
					listeners: {
						save: ()=> {
							this.close();
						},

						invalid: (form) => {

							const invalid = form.findFirstInvalid();

							if(invalid) {
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
				},

				cardmenu(),

				this.cards = cards({flex: 1},

					this.generalTab = fieldset({
							cls: "scroll fit",
							title: t("General")
						}
					)
				),

				tbar({cls: "border-top"},
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
			setTimeout(() => {
				if (!this.currentId) {
					// focus form for new entities and not for existing ones.
					this.form.focus();
					this.fire("ready", this, this.currentId);
				}
			});
		})

	}


	/**
	 * Add a share panel to set permissions
	 *
	 * @protected
	 */

	protected addSharePanel() {
		this.sharePanel = sharepanel({
			cls: "fit",
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
			void Window.alert(t("Error"), e + "");
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

					this.cards.items.add(containerfield({name: "customFields", cls: "scroll", title: fs.fieldSet.name}, fs));
				} else {
					//in case formPanelLayout is set to column
					fs.columnWidth = 1;
					this.generalTab.items.add(containerfield({name: "customFields"}, fs));
				}
			}, this);

		}
	}

}