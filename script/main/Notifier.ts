import {
	comp,
	Observable,
	root,
	t,
	E,
	Button,
	btn,
	tbar,
	Window,
	INotification,
	h3,
	i,
	Notifier,
	list, store, Store, img, List
} from "@intermesh/goui";

// "beforeshow"
// "beforenotify"

type SoundName = 'question' | 'email' | 'reminders';
type IconName = 'reminder' | 'email';

const iconPath = 'views/goui/groupoffice-core/style/resources/notify/';
const soundPath = 'views/goui/groupoffice-core/style/resources/sounds/';
const queue: (() => void)[] = [];
const defaultIcon = iconPath+'reminder.png'
const defaultTitle = t("Reminders")

let audioUnlocked = false;
window.addEventListener('pointerdown', () => {
	audioUnlocked = true;
	while (queue.length) queue.shift()?.();
}, { once: true });

export class Notify extends Observable {

	declare btn: Button
	private canNotify = false
	private readonly store: Store<INotification>
	private panel
	private count = 0
	private msgList: List

	constructor() {
		super();

		this.store = store<INotification>({data:[]});

		// has child with cls "notifications"
		const area = comp({cls:'notifications', hidden:true},
			tbar({},'->',
				btn({icon: 'delete_sweep', title: t('Dismiss all')}).on('click', _=>{

					Window.confirm(t("Confirm"), t('Are you sure you want to dismiss all notifications?')).then(ok => {
						area.hide();
						ok && this.clear();
					});
				}),
				btn({icon: "close", title: t("Close")}).on('click',() => {
					area.hide()
				})
			),
			this.msgList = list({
				store: this.store,
				renderer: (msg:any) => [this.card(msg)]
			})
		);

		root.items.add(area);

		this.btn = btn({icon: "notifications"}).on('click',_=>{
			area.hidden ? area.show() : area.hide();
		});

		Notifier.on('notify',({msg})=>{

			// what is msg already exists?
			switch(msg.category) {
				case 'status':
					return true; // goui toast
				case 'message':
				case 'system':
				case 'progress':
				case 'error':
				case 'alarm':
					this.notify(msg);
			}

			this.add(msg);

			return false; // prevent goui toast
		});

		this.panel = area;

		this.initNotifications();
	}

	private clear(){
		// this.notifications.forEach(msg => {
		// 	msg.el.remove(); // todo
		// });
		this.store.clear();
		this.count = 0;
		this.btn.el.dataset.count = '';
	}

	private add(msg: INotification) {
		this.store.add(msg);
		this.msgList.onStoreLoad();
		this.count++;
		this.btn.el.dataset.count = this.count+'';
	}

	private remove(msg:INotification) {
		this.store.remove(msg);
		this.msgList.onStoreLoad();
		this.count--;
		this.btn.el.dataset.count = this.count === 0 ? '' : this.count+'';
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

	async notify(msg: INotification) {

		console.log(msg);
		if(['alarm','message'].includes(msg.category!)) {
			this.playSound(msg.category==='alarm' ? 'reminders' : 'email');
		}

		// Hard fallback conditions
		if (!this.canNotify) {
			return this.flyout(msg);
		}

		try {
			const n = new Notification(msg.title || defaultTitle, {body:msg.text, icon: msg.icon?.link || defaultIcon});
			if (msg.actions?.click) {
				n.onclick = (e) => {
					e.preventDefault();
					msg.actions!.click.run();
					n.close();
				};
				delete msg.actions.click;
			}
			n.onclose = () => {
				// TODO: some OSes and Browsers auto close in a few seconds. re-open to keep persistent?
			};
			n.onerror = () => {
				this.flyout(msg);
			};

			return n;
		} catch {
			return this.flyout(msg);
		}
	}

	private card(msg: INotification)
	{
		const onClose = () =>{
			// remove from list
			// dispose here??
			this.remove(msg);
		}

		const card = comp({cls:msg.category},
			h3({text:msg.title},
				comp({tagName:'i',cls:'icon',text: msg.icon?.name, style:{color:msg.icon?.color}}),
				btn({icon:'close', title:t('Close'), hidden: msg.category==='alarm'}).on('click', onClose)
			),
			comp({text:msg.text}),
			...(msg.actions ? [tbar({},...Object.values(msg.actions).map(a => btn({text:a.text, icon:a.icon}).on('click', ()=>{})))] : [])
		);
		const seconds = (when: Date) => Math.floor((when.getTime() - (new Date()).getTime()) / 1000);

		if (msg.time) {
			setTimeout(() => {card.show()}, seconds(msg.time));
		}
		if(msg.stale) {
			setTimeout(() => {card.remove()}, seconds(msg.stale));
		}

		return card.on('render', e => {
			if(msg.actions?.click)
				e.target.el.on('click', () => {
					msg.actions!.click.run(); // todo
				})
		})
	}

	flyout(msg: INotification) {

		const c = this.card(msg);

		if(msg.category==='status' || msg.category === 'message') {
			setTimeout(() => {
				c.remove();
			}, 5000);
		}

		this.panel.items.add(c);

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
