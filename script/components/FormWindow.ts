import {
	BaseEntity,
	btn,
	Button,
	CardContainer,
	CardMenu,
	cardmenu,
	cards,
	comp,
	Component,
	containerfield,
	datasourceform,
	DataSourceFormEventMap,
	DefaultEntity,
	EntityID,
	t,
	tbar,
	Toolbar,
	Window,
	WindowEventMap
} from "@intermesh/goui";
import {sharepanel, SharePanel} from "../permissions";
import {jmapds} from "../jmap";
import {CreateLinkButton, createlinkbutton} from "./CreateLinkButton";
import {Link} from "../model/Link";
import {customFields} from "../customfields/CustomFields";
import {FormFieldset} from "../customfields/FormFieldset";


/**
 * @inheritDoc
 */
export interface FormWindowEventMap extends WindowEventMap {

	/**
	 * Fires when the window is shown and loaded with data. Also fires if the dialog is for creating new entities and
	 * not loaded.
	 *
	 * @param window
	 */
	ready: {currentId: EntityID|undefined}

	addlink: {entityName: string, entityId: EntityID}
}



export abstract class FormWindow<EntityType extends BaseEntity = DefaultEntity, EventMap extends FormWindowEventMap = FormWindowEventMap> extends Window<EventMap> {
	public readonly form;
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
	protected readonly createLinkBtn: CreateLinkButton;

	/**
	 * Enable this for linkable entities. It will show a create link button for new items
	 */
	public hasLinks = false;
	protected submitBtn: Button;
	private readonly browseLinksBtn: Button;

	protected closeOnSave = true;

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
		this.height = 600;
		this.maximizable = true;
		this.resizable = true;

		this.items.add(
			this.form = datasourceform<EntityType>(
				{
					dataSource: jmapds(this.entityName),
					cls: "vbox",
					flex: 1,
					listeners: {
						save: () => {
							if(this.closeOnSave)
								this.close();
						},

						invalid: ({target}) => {

							const invalid = target.findFirstInvalid();

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
					this.createLinkBtn = createlinkbutton({
						hidden: true
					}),

					this.browseLinksBtn = btn({
						hidden: true,
						icon: "link",
						handler: () => {
							var lb = new go.links.LinkBrowser({
								entity: this.entityName,
								entityId: this.form.currentId
							});

							lb.show();
						}
					}),
					"->",
					this.submitBtn = btn({
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

		this.on("beforeclose", ({byUser}) => {
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
					this.internalClose();
				}
			});

			return false;
		}
	}

	protected onShow() {

		this.cardMenu.hidden = this.cards.items.count() < 2;

		// do a setTimeout so currentId is set if win.show().load() is called in that order.
		setTimeout(() => {
			if (!this.form.currentId) {
				if(this.hasLinks) {
					this.createLinkBtn.show();
				}
				// focus form for new entities and not for existing ones.
				this.form.focus();
				this.fire("ready", {currentId: this.form.currentId});
			} else {
				this.createLinkBtn.hide();
				if(this.hasLinks) {
					this.browseLinksBtn.show();
				}
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
			this.sharePanel!.setEntity(this.entityName, this.form.currentId);
		})

	}

	public async load(id: EntityID) {

		this.mask();

		try {
			await this.form.load(id);
			this.fire("ready", {currentId: this.form.currentId});
		} catch (e) {
			void Window.error(e + "");
		} finally {
			this.unmask();
		}

		return this;
	}


	protected addCustomFields() {

		const fieldsets = customFields.getFieldSets("Project3").map(fs => new FormFieldset(fs))

		fieldsets.forEach((fs) => {
			if (fs.fieldSet.isTab) {
				fs.legend = "";
				this.cards.items.add(
					containerfield({
						keepUnknownValues: false, // important because we create multiple container fields with the same object. If this is true then they will overwrite eachother.
						name: "customFields",
						cls: "scroll",
						title: fs.fieldSet.name
						}, fs
					)
				);
			} else {
				this.generalTab.items.add(containerfield({name: "customFields", keepUnknownValues: false}, fs));
			}
		}, this);
	}

	/**
	 * Adds a link between two entities on save.
	 *
	 * @param entityName - The name of the target entity.
	 * @param  entityId - The ID of the target entity.
	 */

	public addLinkOnSave(entityName:string, entityId:string) {

		if(this.createLinkBtn) {
			this.createLinkBtn.show();
			this.createLinkBtn.createLinkField.value = [{entityId: entityId, entityName: entityName}]
		} else {

			const onSave = ({data}:DataSourceFormEventMap["save"]) => {
				const link = {
					"toId": entityId,
					"toEntity": entityName,
					"fromId": data.id,
					"fromEntity": this.entityName
				}

				jmapds<Link>("Link").create(link).catch((e) => {
					void Window.error(e);
				})
			};

			this.form.on("save", onSave, {once: true});

			this.on("close", () => {
				// set timeout because close will fire before the save listeners above are fired.
				setTimeout(() => {
					this.form.un("save", onSave);
				})
			})
		}

		this.fire("addlink", {entityName, entityId});
	}

}