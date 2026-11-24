import {
	comp,
	Observable,
	root,
	t,
	Button,
	btn,
	tbar,
	Window,
	win,
	INotification,
	h3,
	Notifier as GOUINotifier,
	list, store, Store, List, datasourcestore, Format, DefaultEntity, Component, Config
} from "@intermesh/goui";
import {jmapds} from "../jmap";
import {entities} from "../Entities";


export interface AlertEntity extends DefaultEntity{
	createdBy: string
	// data from db
	data:any
	// set client side by this onBeforeLoad event
	entityData:any
	// entitytype  name
	entity: string
	entityId: string
	// is email sent
	isSent: boolean
	permissionLevel: number
	recurrenceId?: string
	// should email be send
	sendMail?: boolean
	// date when alert should no longer show
	staleAt: string
	tag: string
	// date: alert should not show before this date
	triggerAt: string
	userId: number
}

// "beforeshow"
// "beforenotify"

/**
 * The kind of sound. "email" and "reminder" can be muted separately in the user settings.
 */
type SoundType = 'question' | 'email' | 'reminder';

// The resources are next to the dist folder of this package
const resourcePath = new URL('../style/resources/', import.meta.url).href;
const iconPath = resourcePath + 'notify/';
const soundPath = resourcePath + 'sounds/';
const soundFiles: Record<SoundType, string> = {question: 'question', email: 'email', reminder: 'email'};
const defaultIcon = iconPath+'reminder.png'
const seconds = (when: Date) => Math.ceil((when.getTime() - (new Date()).getTime()) / 1000);


// Sound that the browser refused to play because the user didn't interact with the page yet.
// Only the last one is kept, so several notifications don't all play at once.
let pendingSound: (() => void) | undefined;

const playPendingSound = () => {
	const play = pendingSound;
	pendingSound = undefined;
	play?.();
};

// These events count as user activation. "pointerdown" doesn't for touch, so it's not used.
for (const ev of ['pointerup', 'keydown', 'touchend']) {
	window.addEventListener(ev, playPendingSound, {capture: true});
}

export class Notifier extends Observable {

	declare btn: Button
	private permissionRequest?: Promise<boolean>
	/** Text of the desktop notifications shown by key, so the same message isn't shown again on every check */
	private readonly notifiedTexts = new Map<string, string>()
	private readonly desktopNotifications = new Map<string, Notification>()
	private readonly store: Store<INotification>
	private panel
	private count = 0
	private alertCount = 0;
	private alertStore;
	private msgList: List
	private notificationRenderers: {[entityType:string]: (alert:any, closeFn: ()=>void) => INotification | undefined} = {};
	private nextTriggerIntervalId?: any
	private lastCount: number = 0;
	constructor() {
		super();

		this.store = store<INotification>({data:[]});

		this.alertStore = datasourcestore({
			dataSource:jmapds<AlertEntity>('Alert'),
			onBeforeLoad: async (records: AlertEntity[]): Promise<any[]> => { // add dynamic relations

				const promises:Promise<any>[] = [];
				const alerts: any[] = [];
				const now = new Date();
				let nextTrigger = null;
				for(const alert of records) {
					const triggerDate = new Date(alert.triggerAt);
					if(triggerDate > now) {
						if(!nextTrigger || triggerDate < nextTrigger)
							nextTrigger = triggerDate;
						continue;
					}
					if(alert.staleAt && now > new Date(alert.staleAt)) {
						//jmapds("Alert").destroy(alert.id);
						console.warn("Removing stale alert: ", alert);
					}
					const ds = jmapds(alert.entity);
					if(!ds) continue; // no dataSource for entity type found
					alerts.push(alert);
					promises.push(ds.single(alert.entityId).then((entity:any) => {
						alert.entityData = entity;
					}).catch(e =>{console.warn("Failed to fetch relation", e)}));
				}
				if(nextTrigger) {
					// set timer to show future alerts
					console.log('next trigger:'+ seconds(nextTrigger));
					if(this.nextTriggerIntervalId)
						clearTimeout(this.nextTriggerIntervalId);
					this.nextTriggerIntervalId = setTimeout(()=>{
						this.load();
					}, seconds(nextTrigger)*1000)
				}
				this.alertCount = alerts.length;
				this.updateCount();
				return Promise.all(promises).then(() => {
					void this.notifyAlerts(alerts);
					return alerts;
				});
			}
		});

		// has child with cls "notifications"
		const sidePanel = comp({cls:'notifications', hidden:true},
			tbar({style:{paddingLeft:'0'}},
				btn({icon: "chevron_right", title: t("Close")}).on('click',() => {
					sidePanel.hide()
				}),
				'->',
				btn({icon: 'delete_sweep', title: t('Dismiss all')}).on('click', _=>{

					Window.confirm(t("Confirm"), t('Are you sure you want to dismiss all notifications?')).then(ok => {
						sidePanel.hide();
						ok && this.clear();
					});
				})
			),
			comp({flex: 1, cls: "scroll"},
			this.msgList = list({
				emptyStateHtml: '<div style="position:absolute;z-index:-1" class="goui-empty-state"><b>'+t('No notifications')+'</b></div>',
				store: this.store,
				renderer: (msg:any) => [this.card(msg)]
			}),
			list({
				emptyStateHtml: '',
				store: this.alertStore,
				renderer: (alert:any) => {
					const closeFn = ()=>{
						this.closeDesktopNotification('alert-' + alert.id);
						jmapds("Alert").destroy(alert.id);
					};
					const clickFn = () => {
						const e = entities.get(alert.entity);
						e.goto(alert.entityId);
						//closeFn();
					};

					if(!alert.entityData && alert.entityId) {
						console.log(alert.entity+' with id '+alert.entityId+' not longer exists, removing...');
						closeFn();
						return [];
					}

					let notification = this.notificationRenderers?.[alert.entity]?.(alert, closeFn);
					notification ??= this.defaultNotificationRenderer(alert, closeFn);

					notification.onClose ??= closeFn;
					notification.onClick ??= clickFn;

					return [this.card(notification)];
				}
			})
			)
		);

		root.items.add(sidePanel);

		this.btn = btn({icon: "notifications"}).on('click',_=>{
			sidePanel.hidden ? sidePanel.show() : sidePanel.hide();
		});

		GOUINotifier.on('notify',({msg})=>{

			// legacy code often doesn't pass a category
			const category = msg.category ?? 'message';

			// what is msg already exists?
			switch(category) {
				case 'status':
					return true; // goui toast
				case 'system':
				case 'error':
				case 'alarm':
					sidePanel.show(); // severe, open panel
				case 'message':
				case 'progress':
					if(category === 'alarm' || category === 'message') {
						this.desktopNotify(msg);
					}
					this.add(msg);
			}

			return false; // prevent goui toast
		 });

		this.panel = sidePanel;
	}

	async load() {
		return this.alertStore.load();
	}

	/**
	 * Register a renderer for a specific entity type
	 * @param entityType
	 * @param renderer
	 */
	regRenderer(entityType:string, renderer: (alert: AlertEntity, closeFn: ()=>void) => INotification | undefined) {
		this.notificationRenderers[entityType] = renderer;
	}

	private clear(){
		// this.notifications.forEach(msg => {
		// 	msg.el.remove(); // todo
		// });
		this.store.clear();
		this.count = 0;
		this.updateCount();
	}

	private updateCount(){
		const c = (this.alertCount + this.count);
		if(c > this.lastCount && !go.User.mute_reminder_sound) {
			this.playSound('reminder');
		}
		this.btn.el.dataset.count = ''+(c>0?c:'');
		this.lastCount = c;
	}

	private add(msg: INotification) {
		if(msg.tag) {
			const oldMsg = this.store.find(v => v.tag == msg.tag);
			console.log(oldMsg);
			if(oldMsg) this.remove(oldMsg);
		}
		this.store.add(msg);
		this.msgList.onStoreLoad();
		this.count++;
		this.updateCount();
	}

	/**
	 * Remove a notification from the notification panel
	 *
	 * @param msg the notification or one with the same tag
	 * @param silent don't call onClose, for example when the notification is postponed instead of dismissed
	 */
	close(msg: INotification, silent = false) {
		// remove from list, if in list. otherwise its an alert
		const existing = this.store.has(msg) ? msg : (msg.tag ? this.store.find(v => v.tag === msg.tag) : undefined);
		if(existing) {
			this.remove(existing);
		}
		if(msg.tag) {
			// so it's shown again when it returns
			this.closeDesktopNotification(msg.tag);
		}
		if(!silent) {
			msg.onClose?.();
		}
	}

	private remove(msg:INotification) {
		this.store.remove(msg);
		this.msgList.onStoreLoad();
		this.count--;
		this.updateCount();
	}

	/**
	 * Ask the user once per session for permission to show desktop notifications
	 *
	 * Browsers only show the permission prompt after a user action, so the user presses "Ok" in a dialog first.
	 *
	 * @return true if desktop notifications may be shown
	 */
	initNotifications(): Promise<boolean> {
		if (!('Notification' in window) || !isSecureContext) {
			return Promise.resolve(false);
		}
		if (Notification.permission !== 'default') {
			return Promise.resolve(Notification.permission === 'granted');
		}
		// Window.alert() has no button, while the text asks to press "Ok"
		this.permissionRequest ??= new Promise<void>(resolve => {
				const w = win({
						title: t("Setup notifications"),
						modal: true,
						width: 600,
						listeners: {
							close: () => resolve()
						}
					},
					comp({
						cls: "pad",
						text: t("Please choose if you'd like to allow desktop notifications by Group-Office after pressing 'Ok'.")
					}),
					tbar({},
						"->",
						btn({
							cls: "filled primary",
							text: t("Ok"),
							handler: () => w.close()
						})
					)
				);
				w.show();
			})
			.then(() => Notification.requestPermission())
			.then(p => p === 'granted')
			.catch(() => false);

		return this.permissionRequest;
	}

	/**
	 * Show a desktop notification of the browser for a notification
	 *
	 * The same text with the same key is shown only once, until the notification is removed in GroupOffice.
	 *
	 * @param msg the notification
	 * @param key identifies the notification, defaults to its tag
	 */
	private desktopNotify(msg: INotification, key = msg.tag) {
		if (!('Notification' in window) || !isSecureContext || Notification.permission === 'denied' || !msg.text) {
			return;
		}

		const body = msg.text.stripTags();
		if(key) {
			if(this.notifiedTexts.get(key) === body) {
				return;
			}
			this.notifiedTexts.set(key, body);
		}

		void this.initNotifications().then(granted => {
			if(!granted) {
				return;
			}
			try {
				if(key) {
					this.desktopNotifications.get(key)?.close();
				}
				const n = new Notification(msg.title || t("Reminders"), {
					body,
					tag: key,
					icon: msg.icon?.link ?? defaultIcon
				});
				n.addEventListener("click", () => {
					window.focus();
					n.close();
					msg.onClick?.();
				});
				if(key) {
					this.desktopNotifications.set(key, n);
					n.addEventListener("close", () => {
						if(this.desktopNotifications.get(key) === n) {
							this.desktopNotifications.delete(key);
						}
					});
				}
			} catch (e) {
				// Mobile browsers only allow notifications from a service worker
				console.warn("Desktop notification failed", e);
			}
		});
	}

	private async hasPushSubscription(): Promise<boolean> {
		try {
			const registration = await navigator.serviceWorker?.getRegistration();
			return !!(await registration?.pushManager?.getSubscription());
		} catch {
			return false;
		}
	}

	private closeDesktopNotification(key: string) {
		this.notifiedTexts.delete(key);
		this.desktopNotifications.get(key)?.close();
		this.desktopNotifications.delete(key);
	}

	/**
	 * Show desktop notifications for alerts that weren't shown yet
	 */
	private async notifyAlerts(alerts: AlertEntity[]) {
		// With a push subscription of the webpush module the alerts are pushed to the browser by the server
		if(await this.hasPushSubscription()) {
			return;
		}

		const now = new Date();
		for(const alert of alerts) {
			if(!alert.entityData || (alert.data && "progress" in alert.data) || (alert.staleAt && now > new Date(alert.staleAt))) {
				continue;
			}
			const key = 'alert-' + alert.id;
			if(this.notifiedTexts.has(key)) {
				continue;
			}
			const closeFn = () => {jmapds("Alert").destroy(alert.id);};
			let notification: INotification | undefined;
			try {
				notification = this.notificationRenderers?.[alert.entity]?.(alert, closeFn);
				notification ??= this.defaultNotificationRenderer(alert, closeFn);
			} catch (e) {
				console.warn("Failed to render alert", e, alert);
				continue;
			}
			if(notification.category === 'progress') {
				continue;
			}
			this.desktopNotify({
				...notification,
				onClick: notification.onClick ?? (() => entities.get(alert.entity).goto(alert.entityId))
			}, key);
		}
	}

	private defaultNotificationRenderer(alert:any, closeFn: () => void): INotification {

		const entity = alert.entityData;

		let icon = alert.data.icon;
		if(!icon) {
			// oldcode: remove this when the old code for link configs is updated
			const oldIconClass = entities.getLinkConfig(alert.entity)?.iconCls;
			if (oldIconClass) {
				let parts = oldIconClass.split(' ');
				icon = {
					name: parts[1].replace('ic-', ''),
				} as any;
				if (parts[2]) icon.color = parts[2];
				// end of oldcode
			}
		}

		let text = alert.data.body ?? Format.dateTime(alert.triggerAt);

		if(alert.data) {
			if("progress" in alert.data) {
				text = t("Progress") + " " + alert.data.progress + "%";
			// } else {
			// 	text += ": " + JSON.stringify(alert.data, undefined, 1);
			}
		}

		return {
			title: alert.data && alert.data.title ? alert.data.title : entity.name || entity.title || entity.description || alert.entity,
			text,
			icon: icon ?? {name: 'notifications'},
			category: ("progress" in alert.data) ? 'progress' : 'event',
			...(alert.triggerAt && { time: new Date(alert.triggerAt) }),
			...(alert.staleAt && { stale: new Date(alert.staleAt) })
		} as INotification
	}

	private card(msg: INotification)
	{
		const rm = () => this.close(msg);
		const items: Component[] = [comp({text:msg.text})];
		const actions = [msg.actions?.primary,msg.actions?.secondary].filter(Boolean);
		if(msg.category==='progress') {
			const bar = comp({tagName:'progress'});
			items.push(bar);
			msg.onProcessed = (loaded, total) => {
				bar.el.max = total;
				bar.el.value = loaded;
				if(loaded >= total) this.remove(msg); // done!
			};
		}


		const card = comp({cls:msg.variant||''},
			h3({text:msg.title},
				comp({tagName:'i',cls:'icon',text: msg.icon?.name, style:{color:msg.icon?.color}}),
				btn({icon:'close', title:t('Close'), hidden: msg.category==='system'})
					.on('click',(ctx) => { rm(); ctx.ev.stopPropagation(); })
			),
			...items,
			...(actions.length ? [comp({},...Object.values(actions).map(a =>
				// the button is passed so an action can align a menu to it
				btn({text:a!.text, icon:a!.icon}).on('click', ({target, ev})=>{
					ev.stopPropagation();
					(a!.run as (button: Button) => void)(target);
				})))] : [])
		);

		// if (msg.time && msg.time > now) {
		// 	setTimeout(() => {card.show()}, seconds(msg.time)*1000);
		// }
		if(msg.stale) {
			setTimeout(() => {card.remove()}, seconds(msg.stale)*1000);
		}
		msg.card = card; // possible ref for changes

		return card.on('render', e => {
			if(msg.onClick)
				e.target.el.on('click', msg.onClick)
		})
	}

	/**
	 * Play a notification sound unless the user muted it in the settings
	 *
	 * Browsers only play sound after the user interacted with the page. Until then the last sound is kept and played on the next interaction.
	 *
	 * @param type "email" and "reminder" can be muted separately
	 */
	playSound(type: SoundType = 'question') {
		if(!GO.util.empty(go.User.mute_sound) ||
			(type === 'email' && go.User.mute_new_mail_sound) ||
			(type === 'reminder' && go.User.mute_reminder_sound)) {
			return;
		}
		const play = () => {
			new Audio(soundPath + soundFiles[type] + '.mp3').play().catch((e) => {
				if (e.name === 'NotAllowedError') {
					// retry on the next user interaction
					pendingSound = play;
				} else {
					console.warn("Could not play notifier sound: " + e.message);
				}
			});
		};

		if (navigator.userActivation?.hasBeenActive ?? true) {
			play();
		} else {
			pendingSound = play;
		}
	}
}
