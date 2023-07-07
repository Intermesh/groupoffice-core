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
	fieldset,
	t,
	tbar,
	Window
} from "@intermesh/goui";
import {sharepanel, SharePanel} from "../permissions";
import {jmapds} from "../jmap";

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
		this.width = 500;
		this.height = 400;

		this.items.add(
			this.form = datasourceform(
				{
					dataSource: jmapds(this.entityName),
					cls: "vbox",
					flex: 1,
					listeners: {
						save: ()=> {
							this.close();
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

		this.on("show", () => {
			setTimeout(() => {
				if(!this.currentId) {
					this.sharePanel!.setEntity(this.entityName);
				}
			});
		})

		this.form.on("load", (form1, data) => {
			this.sharePanel!.setEntity(this.entityName, data.id);
		})
	}

	public async load(id: EntityID) {

		this.mask();

		try {
			await this.form.load(id);
			this.currentId = id;
		} catch (e) {
			void Window.alert(t("Error"), e + "");
		} finally {
			this.unmask();
		}

		return this;
	}


	protected addCustomFields() {

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