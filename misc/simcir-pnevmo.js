//
// SimcirJS - Delay
//
// Copyright (c) 2017 Kazuhiko Arase
//
// URL: http://www.d-project.com/
//
// Licensed under the MIT license:
//  http://www.opensource.org/licenses/mit-license.php
//

// includes following device types:
//  Valve
//  Compressor
//  Indicator

!function($s) {

  'use strict';

  var $ = $s.$;

  // размер единицы
  var unit = $s.unit;
  
  // красный / черный
  var defaultLEDColor = '#ff0000';
  var defaultLEDBgColor = '#000000';
  
  // да / нет
  var onValue = 1;
  var offValue = null;
  var isHot = function(v) { return v != null; };
  var intValue = function(v) { return isHot(v)? 1 : 0; };
  
  var multiplyColor = function() {
    var HEX = '0123456789abcdef';
    var toIColor = function(sColor) {
      if (!sColor) {
        return 0;
      }
      sColor = sColor.toLowerCase();
      if (sColor.match(/^#[0-9a-f]{3}$/i) ) {
        var iColor = 0;
        for (var i = 0; i < 6; i += 1) {
          iColor = (iColor << 4) | HEX.indexOf(sColor.charAt( (i >> 1) + 1) );
        }
        return iColor;
      } else if (sColor.match(/^#[0-9a-f]{6}$/i) ) {
        var iColor = 0;
        for (var i = 0; i < 6; i += 1) {
          iColor = (iColor << 4) | HEX.indexOf(sColor.charAt(i + 1) );
        }
        return iColor;
      }
      return 0;
    };
    var toSColor = function(iColor) {
      var sColor = '#';
      for (var i = 0; i < 6; i += 1) {
        sColor += HEX.charAt( (iColor >>> (5 - i) * 4) & 0x0f);
      }
      return sColor;
    };
    var toRGB = function(iColor) {
      return {
        r: (iColor >>> 16) & 0xff,
        g: (iColor >>> 8) & 0xff,
        b: iColor & 0xff};
    };
    var multiplyColor = function(iColor1, iColor2, ratio) {
      var c1 = toRGB(iColor1);
      var c2 = toRGB(iColor2);
      var mc = function(v1, v2, ratio) {
        return ~~Math.max(0, Math.min( (v1 - v2) * ratio + v2, 255) );
      };
      return (mc(c1.r, c2.r, ratio) << 16) |
        (mc(c1.g, c2.g, ratio) << 8) | mc(c1.b, c2.b, ratio);
    };
    return function(color1, color2, ratio) {
      return toSColor(multiplyColor(
          toIColor(color1), toIColor(color2), ratio) );
    };
  }();
  
  //Функции рисования символов
  var drawValve = function(g, x, y, width, height) {
    g.moveTo(x, y);
    g.lineTo(x + width, y + height);
	g.lineTo(x + width, y);
    g.lineTo(x, y + height);
    g.lineTo(x, y);
    g.closePath(true);
  };

  //Создание кранов
  var createValveFactory = function(type, draw) {
    return function(device) {
      var in1 = device.addInput();
      var out1 = device.addOutput();
      var on = (type == 'ControlValve');

      if (type == 'Valve' && device.deviceDef.state) {
        on = device.deviceDef.state.on;
      }
      device.getState = function() {
        return type == 'Valve'? { on : on } : null;
      };

      device.$ui.on('inputValueChange', function() {
        if (on) {
          out1.setValue(in1.getValue() );
        }
      });
      var updateOutput = function() {
        out1.setValue(on? in1.getValue() : null);
      };
      updateOutput();
	//Вывод на экран состояния устройства
      var super_createUI = device.createUI;
      device.createUI = function() {
        super_createUI();
        var size = device.getSize();
		//Рисование крана
        var $valve = $s.graphics(device.$ui);
		    $valve.attr['class'] = 'simcir-basicset-switch-button';
			draw($valve, (size.width - unit) / 2, (size.height - unit) / 2,	unit, unit);	
		
        var $button = $s.createSVGElement('rect').
          attr({x: size.width / 4, y: size.height / 4,
            width: size.width / 2, height: size.height / 2});
		$button.addClass('simcir-basicset-switch-button-depressed');
		
        if (type == 'Valve' && on) {
          $button.addClass('simcir-basicset-switch-button-pressed');
        }
        device.$ui.append($button);
        var button_mouseDownHandler = function(event) {
          event.preventDefault();
          event.stopPropagation();
          if (type == 'CheckValve') {
            on = true;
            $button.addClass('simcir-basicset-switch-button-pressed');
          } else if (type == 'ControlValve') {
            on = false;
            $button.addClass('simcir-basicset-switch-button-pressed');
          } else if (type == 'Valve') {
            on = !on;
            $button.addClass('simcir-basicset-switch-button-pressed');
          }
          updateOutput();
          $(document).on('mouseup', button_mouseUpHandler);
          $(document).on('touchend', button_mouseUpHandler);
        };
        var button_mouseUpHandler = function(event) {
          if (type == 'CheckValve') {
            on = false;
            $button.removeClass('simcir-basicset-switch-button-pressed');
          } else if (type == 'ControlValve') {
            on = true;
            $button.removeClass('simcir-basicset-switch-button-pressed');
          } else if (type == 'Valve') {
            // сохранить состояние
            if (!on) {
              $button.removeClass('simcir-basicset-switch-button-pressed');
            }
          }
          updateOutput();
          $(document).off('mouseup', button_mouseUpHandler);
          $(document).off('touchend', button_mouseUpHandler);
        };
        device.$ui.on('deviceAdd', function() {
          $s.enableEvents($button, true);
          $button.on('mousedown', button_mouseDownHandler);
          $button.on('touchstart', button_mouseDownHandler);
        });
        device.$ui.on('deviceRemove', function() {
          $s.enableEvents($button, false);
          $button.off('mousedown', button_mouseDownHandler);
          $button.off('touchstart', button_mouseDownHandler);
        });
        device.$ui.addClass('simcir-basicset-switch');
      };
    };
  };
  
    // регистрировать краны, обратные клапана и регуляторы 
//  $s.registerDevice('ControlValve', createValveFactory('ControlValve', drawValve) );
//  $s.registerDevice('CheckValve', createValveFactory('CheckValve', drawValve) );
  $s.registerDevice('Valve', createValveFactory('Valve', drawValve) );
  

  // зарегистрировать источник давления
  $s.registerDevice('Compressor', function(device) {
    device.addOutput();
    var super_createUI = device.createUI;
    device.createUI = function() {
      super_createUI();
      device.$ui.addClass('simcir-basicset-dc');
    };
    device.$ui.on('deviceAdd', function() {
      device.getOutputs()[0].setValue(onValue);
    });
    device.$ui.on('deviceRemove', function() {
      device.getOutputs()[0].setValue(null);
    });
  });

  // регистрация индикатора давления
  $s.registerDevice('Indicator', function(device) {
    var in1 = device.addInput();
    var super_createUI = device.createUI;
    device.createUI = function() {
      super_createUI();
      var hiColor = device.deviceDef.color || defaultLEDColor;
      var bgColor = device.deviceDef.bgColor || defaultLEDBgColor;
      var loColor = multiplyColor(hiColor, bgColor, 0.25);
      var bLoColor = multiplyColor(hiColor, bgColor, 0.2);
      var bHiColor = multiplyColor(hiColor, bgColor, 0.8);
      var size = device.getSize();
      var $ledbase = $s.createSVGElement('circle').
        attr({cx: size.width / 2, cy: size.height / 2, r: size.width / 4}).
        attr('stroke', 'none').
        attr('fill', bLoColor);
      device.$ui.append($ledbase);
      var $led = $s.createSVGElement('circle').
        attr({cx: size.width / 2, cy: size.height / 2, r: size.width / 4 * 0.8}).
        attr('stroke', 'none').
        attr('fill', loColor);
      device.$ui.append($led);
      device.$ui.on('inputValueChange', function() {
        $ledbase.attr('fill', isHot(in1.getValue() )? bHiColor : bLoColor);
        $led.attr('fill', isHot(in1.getValue() )? hiColor : loColor);
      });
      device.doc = {
        params: [
          {name: 'color', type: 'string',
            defaultValue: defaultLEDColor,
            description: 'color in hexadecimal.'},
          {name: 'bgColor', type: 'string',
            defaultValue: defaultLEDBgColor,
            description: 'background color in hexadecimal.'}
        ],
        code: '{"type":"' + device.deviceDef.type +
        '","color":"' + defaultLEDColor + '"}'
      };
    };
  });

}(simcir);
