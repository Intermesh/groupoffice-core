import {
	comp,
	Observable,
	root,
	t,
	Button,
	btn,
	tbar,
	Window,
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

type SoundName = 'question' | 'email' | 'reminders';
//type IconName = 'reminder' | 'email';

const iconPath = 'views/goui/groupoffice-core/style/resources/notify/';
const soundPath = 'views/goui/groupoffice-core/style/resources/sounds/';
const queue: (() => void)[] = [];
const defaultIcon = iconPath+'reminder.png'
const defaultTitle = t("Reminders");
const seconds = (when: Date) => Math.ceil((when.getTime() - (new Date()).getTime()) / 1000);


let audioUnlocked = false;
window.addEventListener('pointerdown', () => {
	audioUnlocked = true;
	while (queue.length) queue.shift()?.();
}, { once: true });

export class Notifier extends Observable {

	declare btn: Button
	private canNotify = false
	private readonly store: Store<INotification>
	private panel
	private count = 0
	private alertCount = 0;
	private alertStore;
	private msgList: List
	private notificationRenderers: {[entityType:string]: (alert:any, closeFn: ()=>void) => INotification | undefined} = {};
	private nextTriggerIntervalId?: number
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
				return Promise.all(promises).then(() => alerts);
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
					const closeFn = ()=>{jmapds("Alert").destroy(alert.id);};
					const clickFn = () => {
						const e = entities.get(alert.entity);
						debugger;
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

			// what is msg already exists?
			switch(msg.category) {
				case 'status':
					return true; // goui toast
				case 'system':
				case 'error':
				case 'alarm':
					sidePanel.show(); // severe, open panel
				case 'message':
				case 'progress':
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
		this.btn.el.dataset.count = ''+(c>0?c:'');
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

	private remove(msg:INotification) {
		this.store.remove(msg);
		this.msgList.onStoreLoad();
		this.count--;
		this.updateCount();
	}

	async initNotifications() {
		if (!('Notification' in window) || !isSecureContext) {
			return;
		}
		let p = Notification.permission;
		if (p === 'default') {
			try {
				p = await Notification.requestPermission();
			} catch {
				return;
			}
		}
		this.canNotify = (p === 'granted');
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
		const rm = () => {
			// remove from list, if in list. otherwise its an alert
			if(this.store.has(msg))
				this.remove(msg);
			msg.onClose?.();
		}
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
				btn({text:a!.text, icon:a!.icon}).on('click', ()=>{a!.run(); })))] : [])
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

	playSound(filename: SoundName = 'question') {
		if(!GO.util.empty(go.User.mute_sound) ||
			(filename === 'email' && go.User.mute_new_mail_sound) ||
			(filename === 'question' && go.User.mute_reminder_sound)) {
			return;
		}
		const play= () => {new Audio(soundPath+filename+'.mp3').play().catch(() => {})}

		if (audioUnlocked) play();
		else queue.push(play);
	}
}
