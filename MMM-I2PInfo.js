Module.register("MMM-I2PInfo", {
	// Setup Config
	defaults: {
		ip: "http://127.0.0.1",
		port: "7657",
		site: "/jsonrpc/",
		version: 1,
		password: "itoopie",
		interval: 1000,
	},

	getStyles: function() {
		return ["font-awesome.css", "Style.css"];
	},

	//---// MagicMirror Functions //---//
	loaded: function(callback) {
		//Log.log("Loading " + this.name);
		//const URL = this.ip + ":" + this.port + this.site;
		//Log.log("Url is " + URL);

		//this.sendSocketNotification("I2P_CreateClient&Authenticate", { URL: URL, Version: this.version, Password: this.password });

		//Log.log("Finished loading " + this.name);
		callback();
	},

	socketNotificationReceived: async function(notification, payload) {
		switch (notification) {
			case "I2P_ClientCreated":
				Log.debug("Token: "+this.token);
				if (this.token != undefined) break;
				this.client = payload.client;
				this.token = payload.token;
				Log.debug("Token: "+this.token);
				Log.debug("Interval: "+this.config.interval / 1000+" sec")

				// Request the Initial Update
				this.sendSocketNotification("I2P_FetchRouterInfo", { token: this.token })
				// Setup the Intervalled Fetching
				setInterval(() => this.sendSocketNotification("I2P_FetchRouterInfo", { token: this.token }), this.config.interval)
				break;
			case "I2P_RouterInfoFetched":
				Log.debug("New Info Received");
				if (payload.token != this.token) break;
				this.Router = payload.routerInfo;
				Log.log(this.Router);

				this.updateDom();
				break;
			default:
				break;
		}
	},

	start: function() {
		const URL = this.config.ip + ":" + this.config.port + this.config.site;
		Log.log("Url is " + URL);

		//this.client = "";
		//this.token = "";

		this.sendSocketNotification("I2P_CreateClient&Authenticate", { URL: URL, Version: this.config.version, Password: this.config.password });

		//while (this.token == undefined) {};
		//setInterval(() => this.sendSocketNotification("I2P_FetchRouterInfo", { client: this.client, token: this.token }), this.config.interval)
	},

	getHeader: function() {
		const version = (this.Router != undefined) ? this.Router.version : "Loading...";
		return "I2P" + " " + version;
	},

	getDom: function() {
		const wrapper = document.createElement("div");
		wrapper.className = "I2P";

		// If I2P Info hasn't been fetched yet, return the plain DOM
		if (this.Router == undefined) return wrapper;

		// Construct the DOM
		wrapper.appendChild(this.getDomStatus());
		wrapper.appendChild(this.getDomUptime());
		wrapper.appendChild(this.getDomPeers());
		wrapper.appendChild(this.getDomNetwork());
		wrapper.appendChild(this.getDomTunnels());
		wrapper.appendChild(this.getDomReseeding());

		return wrapper;
	},

	//---// DOM constructs //---//
	getDomStatus: function() {
		const wrapper = document.createElement("div");
		wrapper.className = "Status";

		const netStatus = this.Router.netStatus;
		const statusState = {
			0: "OK",
			1: "OK",
			2: "WARN",
			3: "HIDDEN",
			4: "WARN",
			5: "WARN",
			6: "WARN",
			7: "WARN",
			8: "ERROR",
			9: "ERROR",
			10: "ERROR",
			11: "ERROR",
			12: "ERROR",
			13: "ERROR",
			14: "ERROR"
		};
		const state = statusState[netStatus];
		const statusText = {
			0: "Accepting Tunnel Requests!",
			1: "Testing...",
			2: "Firewalled!",
			3: "Hidden",
			4: "Firewalled While Fast!",
			5: "Firewalled While Floodfill!",
			6: "Firewalled! (Inbound TCP)",
			7: "Firewalled! (UDP Disabled)",
			8: "I2CP",
			9: "Clock Skew!",
			10: "Private TCP Address!",
			11: "Symmetric NAT!",
			12: "UDP Port In Use!",
			13: "No Active Peers!<br>Check Connection And Firewall.",
			14: "UDP Disabled And TCP Unset!"
		};

		wrapper.innerHTML = `<${state}>Status: ${statusText[netStatus]}</${state}>`;

		return wrapper;
	},
	getDomUptime: function() {
		const wrapper = document.createElement("div");
		wrapper.className = "Uptime";

		// Initialize Uptime in different formats
		let _msec = this.Router.uptime;
		let _sec = _msec / 1000;
		let _min = _sec / 60;
		let _hours = _min / 60;
		let _days = _hours / 24;

		// Format Uptime
		const days = _days > 0 ? Math.floor(_days) : 0;
		_hours -= days*24;
		const hours = _hours > 0 ? Math.floor(_hours) : 0;
		_min -= hours*60+days*24*60;
		const min = _min > 0 ? Math.floor(_min) : 0;
		_sec -= min*60+hours*60*60+days*24*60*60;
		const sec = _sec > 0 ? Math.floor(_sec) : 0;

		// Stringify
		const Sdays = days > 0 ? `${days} d` : "";
		const Shours = hours > 0 ? `${hours} h` : "";
		const Smin = min > 0 ? `${min} m` : "";
		const Ssec = sec > 0 ? `${sec} s` : "";
		const TimeString = `${Sdays} ${Shours} ${Smin} ${Ssec}`.trim();

		wrapper.innerHTML = "Uptime: "+TimeString;
		return wrapper;
	},
	getDomPeers: function() {
		const wrapper = document.createElement("div");
		wrapper.className = "Peers";

		const active = this.Router.activePeers;
		const fast = this.Router.fastPeers;
		const highCapacity = this.Router.highCapacityPeers;
		const known = this.Router.knownPeers;

		const aSymbol = "person-rays";
		const fSymbol = "person-running";
		const hSymbol = "user-group";
		const kSymbol = "users";

		const aClass = `<active><symbol><span class=\"fa fa-${aSymbol}\"</span></symbol>${active}</active>`;
		const fClass = `<fast><symbol><span class=\"fa fa-${fSymbol}\"</span></symbol>${fast}</fast>`;
		const hClass = `<highCapacity><symbol><span class=\"fa fa-${hSymbol}\"</span></symbol>${highCapacity}</highCapacity>`;
		const kClass = `<known><symbol><span class=\"fa fa-${kSymbol}\"</span></symbol>${known}</known>`;

		wrapper.innerHTML = `${aClass}  ${fClass}  ${hClass}  ${kClass}`;
		return wrapper;
	},
	getDomNetwork: function() {
		const wrapper = document.createElement("div");
		wrapper.className = "Network";

		const _in1s = this.Router.inbound1s;
		const _in15s = this.Router.inbound15s;
		const _out1s = this.Router.outbound1s;
		const _out15s = this.Router.outbound15s;

		// Convert Bps to KBps
		const in1s = Math.round(_in1s/100) / 10 + " KBps";
		const in15s = Math.round(_in15s/100) / 10 + " KBps";
		const out1s = Math.round(_out1s/100) / 10 + " KBps";
		const out15s = Math.round(_out15s/100) / 10 + " KBps";

		const up1s = "<span class=\"fa fa-angle-up\"</span>";
		const down1s = "<span class=\"fa fa-angle-down\"</span>";
		const up15s = "<span class=\"fa fa-angles-up\"</span>";
		const down15s = "<span class=\"fa fa-angles-down\"</span>";

		wrapper.innerHTML = `<short><symbol>${up1s}</symbol>${in1s} - <symbol>${down1s}</symbol>${out1s}</short><br>`
											+`<long><symbol>${up15s}</symbol>${in15s} - <symbol>${down15s}</symbol>${out15s}</long>`;
		return wrapper;
	},
	getDomTunnels: function() {
		const wrapper = document.createElement("div");
		wrapper.className = "Tunnels";

		const participating = this.Router.participating;
		const pSymbol = "code-commit";

		wrapper.innerHTML = `<symbol><span class=\"fa fa-${pSymbol}\"</span></symbol> ${participating}`;
		return wrapper;
	},
	getDomReseeding: function() {
		const wrapper = document.createElement("div");
		wrapper.className = "Reseeding";

		const reseeding = this.Router.isReseeding;
		const yesSymbol = "&#10003;";
		const noSymbol = "&#10007;";
		const state = (reseeding) ? yesSymbol : noSymbol;
		const RSymbol = "seedling";

		wrapper.innerHTML = `<symbol><span class=\"fa fa-${RSymbol}\"></span></symbol><symbol> ${state}</symbol>`;
		return wrapper;
	}
});
