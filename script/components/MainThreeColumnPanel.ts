import {Component, splitter, btn, t, router} from "@intermesh/goui";

export abstract class MainThreeColumnPanel extends Component {
	protected readonly center;
	protected readonly west;
	protected readonly east;

	protected constructor(idAndRoute:string) {
		super("section");

		this.id = idAndRoute;

		this.cls = "hbox fit mobile-cards";

		this.center = this.createCenter();
		this.center.itemId = "center";

		//center is active by default
		this.center.el.classList.add("active");

		this.west = this.createWest();
		this.west.itemId = "west";

		this.east = this.createEast();
		this.east.itemId = "east";

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

	protected abstract createWest():Component
	protected abstract createEast():Component
	protected abstract createCenter():Component

	/**
	 * Activate panel
	 * @param active
	 */
	public activatePanel(active:Component) {
		this.center.el.classList.remove("active");
		this.east.el.classList.remove("active");
		this.west.el.classList.remove("active");
		active.el.classList.add("active");

	}
}