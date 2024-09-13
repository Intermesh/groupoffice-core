import {Component, splitter, btn, t, router} from "@intermesh/goui";

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

		this.cls = "hbox fit mobile-cards";

		this.center = this.createCenter();
		this.center.itemId = "center";
		this.center.flex = 1;

		//center is active by default
		this.center.el.classList.add("active");

		this.west = this.createWest();
		this.west.itemId = "west";
		if(!this.west.width) {
			this.west.width = 300;
		}

		this.east = this.createEast();
		this.east.itemId = "east";
		if(!this.east.width) {
			this.east.width = 300;
		}

		this.items.add(

			this.west,

			splitter({
				resizeComponentPredicate: "west",
				stateId: this.id + "-west-splitter",
				minSize: 140
			}),

			this.center,

			splitter({
				stateId: this.id + "-east-splitter",
				resizeComponentPredicate: "east"
			}),

			this.east

		);
	}

	/**
	 * Button to show the west panel. Use in overrides.
	 *
	 * @protected
	 */
	protected showWestButton() {
		return btn({
			cls: "for-small-device",
			title: t("Menu"),
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
	protected showCenterButton() {
		return btn({
			cls: "for-small-device",
			title: t("Close"),
			icon: "close",
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
	public activatePanel(active:Component) {
		this.center.el.classList.remove("active");
		this.east.el.classList.remove("active");
		this.west.el.classList.remove("active");
		active.el.classList.add("active");

	}
}