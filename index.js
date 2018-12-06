var Service, Characteristic;
const request = require('request');

module.exports = function (homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory("homebridge-moodo", "HomebridgeMoodo", HomebridgeMoodo);
};

function HomebridgeMoodo(log, config) {
  this.box = null;
  this.log = log;
  this.token = config["token"];
  this.device_key = config["device_key"];
}

HomebridgeMoodo.prototype = {

  makeHttpRequest: function(requestMethod, requestType, postData, next) {

    postData.plugin = {
      name: "homebridge-moodo",
      version: process.env.npm_package_version
    }

    var me = this;
    request({
        url: 'https://rest.moodo.co/'+requestType,
        body: postData,
        method: requestMethod,
        headers: {'Content-type': 'application/json'}
      },
      function(error, response, body) {
        if (200 != response.statusCode) {
          me.log('STATUS: ' + response.statusCode);
          me.log('HEADERS: ' + JSON.stringify(response.headers));
          me.log('BODY: ' + body);
        }
        return next(error, response, body);
      });
  },

  getPowerState: function (next) {
    var me = this;
    me.makeHttpRequest('GET', 'boxes/'+me.device_key, {}, function (error, response) {
      if (error) {
        return next(error);
      } else {
        me.box = response;
        return next(null, me.box.box_status);
      }
    });
  },

  setPowerState: function(powerOn, next) {
    var me = this;
    me.makeHttpRequest(powerOn ? 'POST' : 'DELETE', 'boxes/'+me.device_key, {}, function (error) {
      if (error) {
        return next(error);
      } else {
        me.box.box_status = powerOn ? 1 : 0;
        return next();
      }
    });
  },

  getServices: function () {
    var me = this;
    var informationService = new Service.AccessoryInformation();
    informationService
      .setCharacteristic(Characteristic.Version, "Moodo Version")
      .setCharacteristic(Characteristic.Identify, "Moodo ID");

    var switchService = new Service.Switch(me.name);
    switchService.getCharacteristic(Characteristic.On)
      .on('get', this.getPowerState.bind(this))
      .on('set', this.setPowerState.bind(this));

    this.informationService = informationService;
    this.switchService = switchService;
    return [informationService, switchService];
  }
};
