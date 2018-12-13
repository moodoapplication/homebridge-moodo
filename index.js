/*
MIT License
Copyright (c) 2018 Vladislav Landa
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

var Service, Characteristic;
const request = require('request');

module.exports = function (homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory("homebridge-moodo", "HomebridgeMoodo", HomebridgeMoodo);
};

function HomebridgeMoodo(log, config) {
  this.currentState = null;
  this.box = {};
  this.log = log;
  this.token = config["token"];
  this.device_key = config["device_key"];
}

HomebridgeMoodo.prototype = {

  makeHttpRequest: function(requestMethod, requestType, postData, next) {
    var me = this;

    postData.plugin = {
      name: "homebridge-moodo",
      version: process.env.npm_package_version
    }

    request({
        uri: 'https://rest.moodo.co/api/'+requestType,
        body: Buffer.from(JSON.stringify(postData)),
        method: requestMethod,
        headers: {'Content-type': 'application/json', 'token': me.token}
      },
      function(error, response, body) {
        if (typeof response !== 'undefined' && 200 != response.statusCode) {
          me.log('STATUS: ' + response.statusCode);
          me.log('HEADERS: ' + JSON.stringify(response.headers));
          me.log('BODY: ' + body);
        }
        return next(error, response, body);
      });
  },

  setFanVolume: function(fan_volume, next) {
    var me = this;

    var postData = {
      fan_volume: fan_volume
    };

    me.makeHttpRequest('POST', 'intensity/'+me.device_key, postData, function (error, resp) {
      if (error) {
        return next(error);
      } 
      else {
        me.box = JSON.parse(resp.body);

        return next();
      }
    });
  },

  getFanVolume: function (next) {
    var me = this;
    me.makeHttpRequest('GET', 'boxes/'+me.device_key, {}, function (error, resp) {
      if (error) {
        return next(error);
      } 
      else {
        me.box = JSON.parse(resp.body);

        return next(null, me.box.fan_volume);
      }
    });
  },

  getPowerState: function (next) {
    var me = this;
    me.makeHttpRequest('GET', 'boxes/'+me.device_key, {}, function (error, resp) {
      if (error) {
        return next(error);
      } 
      else {
        me.box = JSON.parse(resp.body);

        return next(null, me.box.box_status);
      }
    });
  },

  setPowerState: function(powerOn, next) {
    var me = this;
    me.makeHttpRequest(powerOn ? 'POST' : 'DELETE', 'boxes/'+me.device_key, {}, function (error, resp) {
      if (error) {
        return next(error);
      } 
      else {
        me.box = JSON.parse(resp.body);

        return next();
      }
    });
  },

  getServices: function () {
    var me = this;
    var informationService = new Service.AccessoryInformation();
    informationService
      .setCharacteristic(Characteristic.Manufacturer, "Agan Aroma & Fine Chemicals Ltd.")
      .setCharacteristic(Characteristic.Model, "Moodo");

    var moodoService = new Service.Fanv2();
    moodoService.getCharacteristic(Characteristic.On)
      .on('get', this.getPowerState.bind(this))
      .on('set', this.setPowerState.bind(this));

    moodoService.getCharacteristic(Characteristic.RotationSpeed)
      .on('get', this.getFanVolume.bind(this))
      .on('set', this.setFanVolume.bind(this));

    if (moodoService) {
      informationService
          .setCharacteristic(Characteristic.On, me.box.box_status === 1)
          .setCharacteristic(Characteristic.Active, me.box.is_online ? 1 : 0);
    }

    this.informationService = informationService;
    this.moodoService = moodoService;
    return [informationService, moodoService];
  }
};
