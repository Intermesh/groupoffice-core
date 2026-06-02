import {Component, splitter, btn, t, router, browser, checkbox, Config, Button, ComponentState} from "@intermesh/goui";

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
	protected constructor(idAndRoute:string) {
		super("section");

		this.id = idAndRoute;
		this.stateId = "main-3-col-" + idAndRoute

		this.cls = "hbox fit mobile-cards";

		this.center = this.createCenter();
		this.center.itemId = "center";
		if(!this.center.minWidth) {
			this.center.minWidth = 300;
		}

		if(!this.center.width) {
			this.center.width = 500;
		}

		//center is active by default
		this.center.el.classList.add("active");

		this.west = this.createWest();
		this.west.stateId = "west";

		if(!this.west.minWidth) {
			this.west.minWidth = 140;
		}
		if(!this.west.width) {
			this.west.width = 300;
		}

		this.east = this.createEast();
		this.east.itemId = "east";
		this.east.flex = 1;
		if(!this.east.minWidth) {
			this.east.minWidth = 140;
		}


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


	/**
	 * Button to show the west panel. Use in overrides.
	 *
	 * @protected
	 */
	protected showWestButton(cfg:Config<Button> = {}) {
		return btn({
			...cfg,
			cls: "small",
			title: t("Show sidebar"),
			icon: browser.isMobile() ? "menu" : "left_panel_open",
			listeners: {
				render: ({target}) => {
					this.west.on('show', () => {
						target.hide();
					})

					this.west.on('hide', () => {
						target.show();
					})

					target.hidden = !this.west.hidden;
				}
			},
			handler: (button, ev) => {
				this.activatePanel(this.west);

				if(button.icon == "left_panel_open") {
					this.west.hidden = false;
					this.west.saveState();
				}
			}
		})
	}

	/**
	 * Button to show the center panel. Use in overrides.
	 * @protected
	 */
	protected showCenterButton() {
		return btn({
			cls: "small",
			title: t("Close sidebar"),
			icon: browser.isMobile() ? "close" : "left_panel_close",
			listeners: {
				render: ({target}) => {

					if(this.west.findChild(target)) {
						this.west.on('show', () => {
							target.show();
						})

						this.west.on('hide', () => {
							target.hide();
						})
					} else {
						target.icon = "close";
						target.cls = target.cls + " for-small-device";
					}

					// target.hidden = !this.west.hidden;
				}
			},
			handler: (button, ev) => {
				this.activatePanel(this.center);
				router.setPath(this.id);

				if(button.icon == "left_panel_close") {
					this.west.hidden = true;
					this.west.saveState();
				}
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
	public activatePanel(active:Component) {
		this.center.el.classList.remove("active");
		this.east.el.classList.remove("active");
		this.west.el.classList.remove("active");
		active.el.classList.add("active");

	}
}