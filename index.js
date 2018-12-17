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
const rp = require('request-promise');

var io = require('socket.io-client')
var socket = io.connect('https://ws.moodo.co:9090', {reconnect: true});

var init = false;

var boxes = {};
var box_statuses = {};
var fan_volumes = {};

var api = 'https://rest.moodo.co/api/';

function HomebridgeMoodo(log, config) {
  var me = this;

  me.log = log;
  me.token = config["token"];
  me.device_key = config["device_key"];

  me.request_options = {
      headers: {'Content-type': 'application/json', 'token': me.token},
      json: true
  };

  if (false === init) {

    init = true;

    var options = me.request_options;
    options.uri = api+'boxes';

    rp(options)
      .then(function (response) {
          var box;

          for (var i=0; i<response.boxes.length; i++) {
            box = response.boxes[i];

            boxes[box.device_key] = {
              fan_volume: box.fan_volume,
              box_status: box.box_status
            }
          }
      })
      .catch(function (err) {
       console.error(err);
      });

    socket.on('connect', function(){
      console.log('Connected');

      setTimeout(function () {
        socket.emit('authenticate', config["token"], false);
        console.log('Authenticated');
      }, 1000);

      setTimeout(function () {
          socket.emit('subscribe', 'all');
          console.log('Subscribed');
      }, 2500);
    });

    socket.on('disconnect', function(){
      console.log('Disconnected');
    });
  }

  socket.on('ws_event', function(object){
    if (config["device_key"] === object.data.device_key) {

      box_statuses[config["device_key"]].updateValue(object.data.box_status);
      
      fan_volumes[config["device_key"]].updateValue(object.data.fan_volume);

      boxes[config["device_key"]] = {
        fan_volume: object.data.fan_volume,
        box_status: object.data.box_status
      };
    }
  });
}

module.exports = function (homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory("homebridge-moodo", "HomebridgeMoodo", HomebridgeMoodo);
};

HomebridgeMoodo.prototype = {

  getFanVolume: function (next) {
    var me = this;

    return next(null, boxes[me.device_key].fan_volume);
  },

  setFanVolume: function(fan_volume, next) {
    var me = this;

    var options = me.request_options;
    options.uri = api+'intensity/'+me.device_key;
    options.method = 'POST';
    options.body = {
      fan_volume: fan_volume
    };

    rp(options)
      .then(function (response) {
        boxes[me.device_key].fan_volume = fan_volume;
        return next();
      })
      .catch(function (err) {
        console.error(err);
        return next(err);
      });
  },

  getPowerState: function (next) {
    var me = this;

    return next(null, boxes[me.device_key].box_status);
  },

  setPowerState: function(powerOn, next) {
    var me = this;

    var options = me.request_options;
    options.uri = api+'boxes/'+me.device_key;
    options.method = powerOn ? 'POST' : 'DELETE';
    options.body = {};

    rp(options)
      .then(function (response) {
        boxes[me.device_key].box_status = powerOn ? 1 : 0;
        return next();
      })
      .catch(function (err) {
        console.error(err);
        return next(err);
      });
  },

  getServices: function () {
    var me = this;

    var informationService = new Service.AccessoryInformation();
    informationService
      .setCharacteristic(Characteristic.Manufacturer, "Agan Aroma & Fine Chemicals Ltd.")
      .setCharacteristic(Characteristic.Model, "Moodo");

    var moodoService = new Service.Fanv2();
    box_statuses[me.device_key] = moodoService.getCharacteristic(Characteristic.Active)
      .on('get', me.getPowerState.bind(me))
      .on('set', me.setPowerState.bind(me));

    fan_volumes[me.device_key] = moodoService.getCharacteristic(Characteristic.RotationSpeed)
      .on('get', me.getFanVolume.bind(me))
      .on('set', me.setFanVolume.bind(me));

    this.informationService = informationService;
    this.moodoService = moodoService;
    return [informationService, moodoService];
  }
};
