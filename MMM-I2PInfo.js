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

	getDom: function() {
		const wrapper = document.createElement("div");
		wrapper.className = "I2P";

		wrapper.appendChild(this.getDomHeader());

		return wrapper;
	},

	// DOM constructs
	getDomHeader: function() {
		const wrapper = document.createElement("div");
		wrapper.className = "Header";

		const version = (this.Router != undefined) ? this.Router.version : "Loading...";
		wrapper.innerHTML = "I2P" + " " + version;

		return wrapper;
	}
});
