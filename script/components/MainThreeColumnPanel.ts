import {browser, btn, Button, comp, Component, Config, router, splitter, t} from "@intermesh/goui";

/**
 * MainThreeColumnPanel class
 *
 * Base class for modules that use a typical 3 column layout:
 *
 * west: navigation
 * center: main grid
 * east: Show detail
 */
export abstract class MainThreeColumnPanel extends Component {
	protected readonly center;
	protected readonly west;
	protected readonly east;

	/**
	 * Constructor
	 *
	 * @param idAndRoute Used for state saving and also as the route to the main panel
	 * @protected
	 */
	protected constructor(idAndRoute: string) {
		super("section");

		this.id = idAndRoute;
		this.stateId = "main-3-col-" + idAndRoute

		this.cls = "hbox fit main-3-col";

		this.center = this.createCenter();
		this.center.el.classList.add("center");
		this.center.itemId = "center";
		this.center.stateId = this.stateId + "-center";
		if (!this.center.minWidth) {
			this.center.minWidth = 300;
		}

		if (!this.center.width) {
			this.center.width = 500;
		}

		//center is active by default
		this.center.el.classList.add("active");

		this.west = this.createWest();
		this.west.stateId = this.stateId + "-west";
		this.west.el.classList.add("west");

		if (!this.west.minWidth) {
			this.west.minWidth = 140;
		}
		if (!this.west.width) {
			this.west.width = 300;
		}

		this.east = this.createEast();
		this.east.itemId = "east";
		this.east.stateId = this.stateId + "-east";
		this.east.flex = 1;
		if (!this.east.minWidth) {
			this.east.minWidth = 140;
		}

		this.east.el.classList.add("east");

		this.items.add(
			this.west,

			splitter({
				resizeComponent: this.west,
				stateId: this.id + "-west-splitter"
			}),

			this.center,

			splitter({
				stateId: this.id + "-center-splitter",
				resizeComponent: this.center
			}),

			this.east
		);
	}

	protected openWestButton(cfg: Config<Button> = {}) {
		return btn({
			...cfg,
			cls: "small not-medium-device",
			title: t("Show sidebar"),
			icon: "left_panel_open",
			listeners: {
				render: ({target}) => {
					this.west.on('show', () => {
						target.hide();
					});

					this.west.on('hide', () => {
						target.show();
					});

					target.hidden = !this.west.hidden;

				}
			},
			handler: (button, ev) => {
				this.west.hidden = false;
				this.west.saveState();
			}
		})
	}

	/**
	 * Button to show the west panel. Use in overrides.
	 *
	 * @protected
	 */
	protected showWestButton(cfg: Config<Button> = {}) {
		return btn({
			...cfg,
			cls: "small for-medium-device",
			title: t("Show sidebar"),
			icon: "menu",
			handler: (button, ev) => {
				this.activatePanel(this.west);
			}
		})
	}


	/**
	 * Button to show the center panel. Use in overrides.
	 * @protected
	 */
	protected closeWestButton() {
		return btn({
			cls: "small not-medium-device",
			title: t("Close sidebar"),
			icon: "left_panel_close",
			listeners: {
				render: ({target}) => {


					this.west.on('show', () => {
						target.show();
					})

					this.west.on('hide', () => {
						target.hide();
					})

				}
			},
			handler: (button, ev) => {

				this.west.hidden = true;
				this.west.saveState();

			}
		})
	}

	/**
	 * Button to show the center panel. Use in overrides.
	 * @protected
	 */
	protected hideWestButton() {
		return btn({
			cls: "small for-medium-device",
			title: t("Close sidebar"),
			icon: "close",
			handler: (button, ev) => {
				this.activatePanel(this.center);
				router.setPath(this.id);
			}
		})
	}


	protected openEastButton(cfg: Config<Button> = {}) {
		return btn({
			...cfg,
			cls: "small",
			title: t("Show details"),
			icon: "right_panel_open",
			listeners: {
				render: ({target}) => {
					this.east.on('show', () => {
						target.hide();
					});

					this.east.on('hide', () => {
						target.show();
					});

					target.hidden = !this.east.hidden;

				}
			},
			handler: (button, ev) => {
				this.east.hidden = false;
				this.east.saveState();
			}
		})
	}


	/**
	 * Button to show the center panel. Use in overrides.
	 * @protected
	 */
	protected closeEastButton() {
		return btn({
			cls: "small",
			title: t("Close details"),
			icon: "right_panel_close",
			listeners: {
				render: ({target}) => {

					this.east.on('show', () => {
						target.show();
						this.center.flex = "";
					})

					this.east.on('hide', () => {
						target.hide();
						this.center.flex = 1;
					})

					if(this.east.hidden) {
						this.center.flex = 1;
					}

				}
			},
			handler: (button, ev) => {

				this.east.hidden = true;
				this.east.saveState();

			}
		})
	}

	protected hideEastButton() {
		return btn({
			cls: "small for-small-device",
			title: t("Back"),
			icon: "chevron_left",
			handler: (button, ev) => {
				this.activatePanel(this.center);
				router.setPath(this.id);
			}
		})
	}


	/**
	 * Create west panel
	 *
	 * @protected
	 */
	protected abstract createWest(): Component

	/**
	 * Create east panel
	 *
	 * @protected
	 */
	protected abstract createEast(): Component

	/**
	 * Create center panel
	 *
	 * @protected
	 */
	protected abstract createCenter(): Component

	/**
	 * Activate the given panel
	 *
	 * @param active
	 */
	public activatePanel(active: Component) {

		active.parent?.items.forEach(c => c.el.classList.remove("active"))

		active.hidden = false;
		active.el.classList.add("active");

	}
}