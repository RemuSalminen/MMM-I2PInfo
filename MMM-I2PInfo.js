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
		return ["Style.css"];
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
			0: "Accepting Tunnel Requests",
			1: "Testing",
			2: "Firewalled",
			3: "Hidden",
			4: "Firewalled While Fast",
			5: "Firewalled While Floodfill",
			6: "Firewalled (Inbound TCP)",
			7: "Firewalled (UDP Disabled)",
			8: "I2CP",
			9: "Clock Skew",
			10: "Private TCP Address",
			11: "Symmetric NAT",
			12: "UDP Port In Use",
			13: "No Active Peers!\nCheck Connection And Firewall",
			14: "UDP Disabled And TCP Unset"
		};

		wrapper.innerHTML = `<${state}>Status: ${statusText[netStatus]}</${state}>`;

		return wrapper;
	}
});
