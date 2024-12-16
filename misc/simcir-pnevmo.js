//
// SimcirJS - Pnevmo
//


// Включает в себя следующие типы устройств:
//  Вход
//  Выход
//  Соединитель
//  Кран
//  Компрессор
//  Свеча

!function($s) {

  'use strict';

  var $ = $s.$;

  // размер единицы
  var unit = $s.unit;

  // встроенные устройства
  
  //Функция неиспользуется
  var connectNode = function(in1, out1) {
    // установить входное значение на выход без события inputValueChange.
    var in1_super_setValue = in1.setValue;
    in1.setValue = function(value, force) {
      var changed = in1.getValue() !== value;
      in1_super_setValue(value, force);
      if (changed || force) {
        out1.setValue(in1.getValue() );
      }
    };
  };
//Создание элемента Вход, Выход
  var createPortFactory = function(type) {
    return function(device) {
      var in1 = device.addInput();
      var out1 = device.addOutput();
      //connectNode(in1, out1);
	  device.getInputs()[0].setOn(1);
	  device.getOutputs()[0].setOn(1);
      var super_createUI = device.createUI;
      device.createUI = function() {
        super_createUI();

		//Без этого кода не обновляются id
		var isEditable = function($dev) {
          var $workspace = $dev.closest('.simcir-workspace');
          return !!$s.controller($workspace).data().editable;
        };
        device.$ui.on('mouseover', function(event) {
            if (!isEditable($(event.target) ) ) {
              $title.text('');
              return;
            }
          })
	
        var size = device.getSize();
        var cx = size.width / 2;
        var cy = size.height / 2;
        device.$ui.append($s.createSVGElement('circle').
          attr({cx: cx, cy: cy, r: unit / 2}).
          attr('class', 'simcir-port simcir-node-type-' + type) );
        device.$ui.append($s.createSVGElement('circle').
          attr({cx: cx, cy: cy, r: unit / 4}).
          attr('class', 'simcir-port-hole') );
      };
	  
    };
  };
//Создание элемента Соединитель
  var createJointFactory = function() {

    var maxFadeCount = 16;	//Время исчезновения Соединитель
    var fadeTimeout = 100;

    var Direction = { WE : 0, NS : 1, EW : 2, SN : 3 };

    return function(device) {

      var in1 = device.addInput();
	  
      var out1 = device.addNoOutput();	//не отображать на полотне
      connectNode(in1, out1);

      var state = device.deviceDef.state || { direction : Direction.WE };
      device.getState = function() {
        return state;
      };

      device.getSize = function() {
        return { width : unit, height : unit };
      };

      var super_createUI = device.createUI;
      device.createUI = function() {
        super_createUI();
		//Отрисовка метки
        var $label = device.$ui.children('.simcir-device-label');
        //$label.attr('y', $label.attr('y') - unit / 4);
		//Отрисовка круга
        /*var $point = $s.createSVGElement('circle').
          css('pointer-events', 'none').css('opacity', 0).attr('r', 4).
          addClass('simcir-connector').addClass('simcir-joint-point');
        device.$ui.append($point);*/

        var $path = $s.createSVGElement('path').
          css('pointer-events', 'none').css('opacity', 0).
          addClass('simcir-connector');
        device.$ui.append($path);

        var $title = $s.createSVGElement('title').
          text(' ');

        /*var updatePoint = function() {
          $point.css('display', out1.getInputs().length > 1? '' : 'none');
        };

        updatePoint();

        var super_connectTo = out1.connectTo;
        out1.connectTo = function(inNode) {
          super_connectTo(inNode);
          updatePoint();
        };
        var super_disconnectFrom = out1.disconnectFrom;
        out1.disconnectFrom = function(inNode) {
          super_disconnectFrom(inNode);
          updatePoint();
        };*/
		//Отрисовка прямоугольников элементов
        var updateUI = function() {
          var x0, y0, x1, y1;
          x0 = x1 = unit;
		  y0 = y1 = unit/2;
          var d = unit / 2;
          var direction = state.direction;
          if (direction == Direction.WE) {
            x0 -= d;
            x1 += d;
          } else if (direction == Direction.NS) {
            y0 -= d;
            y1 += d;
          } else if (direction == Direction.EW) {
            x0 += d;
            x1 -= d;
          } else if (direction == Direction.SN) {
            y0 += d;
            y1 -= d;
          }
          //$path.attr('d', 'M' + x0 + ' ' + y0 + 'L' + x1 + ' ' + y1);
          $s.transform(in1.$ui, x0, y0);

          //$s.transform(out1.$ui, x1, y1);
          //$point.attr({cx : x1 / 3, cy : y1});
          if (direction == Direction.EW || direction == Direction.WE) {
            device.$ui.children('.simcir-device-body').
              attr({x: 0, y: 0, width: unit, height: unit});
			  //attr({x: 0, y: unit / 4, width: unit, height: unit / 2});
          } else {
            device.$ui.children('.simcir-device-body').
              attr({x: unit / 4, y: 0, width: unit / 2, height: unit});
          }
        };

        updateUI();

        // исчезновение тела.
        var fadeCount = 0;
        var setOpacity = function(opacity) {
          device.$ui.children('.simcir-device-body'). //device.$ui.children('.simcir-device-body,.simcir-node'). 
            css('opacity', opacity);
          $path.css('opacity', 1 - opacity);
          //$point.css('opacity', 1 - opacity);
        };
        var fadeout = function() {
          window.setTimeout(function() {
            if (fadeCount > 0) {
              fadeCount -= 1;
              setOpacity(fadeCount / maxFadeCount);
              fadeout();
            }
          }, fadeTimeout);
        };

        var isEditable = function($dev) {
          var $workspace = $dev.closest('.simcir-workspace');
          return !!$s.controller($workspace).data().editable;
        };
        var device_mouseoutHandler = function(event) {
          if (!isEditable($(event.target) ) ) {
            return;
          }
          if (!device.isSelected() ) {
            fadeCount = maxFadeCount;
            fadeout();
          }
        };
        var device_dblclickHandler = function(event) {
          if (!isEditable($(event.target) ) ) {
            return;
          }
          //state.direction = (state.direction + 1) % 4;
          updateUI();
          // обновить соединители.
          $(this).trigger('mousedown').trigger('mouseup');
        };

        device.$ui.on('mouseover', function(event) {
            if (!isEditable($(event.target) ) ) {
              $title.text('');
              return;
            }
            setOpacity(1);
            fadeCount = 0;
          }).on('deviceAdd', function() {
            if ($(this).closest('BODY').length == 0) {
              setOpacity(0);
            }
            $(this).append($title).on('mouseout', device_mouseoutHandler).
              on('dblclick', device_dblclickHandler);
            // скрыть метку
            $label.css('display', 'none');
          }).on('deviceRemove', function() {
            $(this).off('mouseout', device_mouseoutHandler).
              off('dblclick', device_dblclickHandler);
            $title.remove();
            // показать метку
            $label.css('display', '');
          }).on('deviceSelect', function() {
            if (device.isSelected() ) {
              setOpacity(1);
              fadeCount = 0;
            } else {
              if (fadeCount == 0) {
                setOpacity(0);
              }
            }
          });
      };

    };
  };
 
  // красный / черный
  var defaultLEDColor = '#ff0000';
  var defaultLEDBgColor = '#000000';
  
  
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

  //Создание кранов
  var createValveFactory = function(type) {
	  
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

      device.$ui.on('inputValueChange', function() {	//входной узел крана
	  if (on) {											//***кран открыт***	
          device.getOutputs()[0].setOn(1);	//установка на входе крана состояния открыто
		  
		} else {										//***кран закрыт***	
		  device.getOutputs()[0].setOn(0);	//установка на входе крана состояния закрыто
		};
      });
	  
	  
      device.$ui.on('outputValueChange', function() {	//выходной узел крана
	  if (on) {											//***кран открыт***	
          device.getInputs()[0].setOn(1);	//установка на входе крана состояния открыто
		} else {										//***кран закрыт***	
		  device.getInputs()[0].setOn(0);	//установка на входе крана состояния закрыто
		};
      });	  
	  
      var updateOutput = function() {
        if (on) {										//***кран открыт***										
		  device.getOutputs()[0].setOn(1);	//установка на входе крана состояния открыто
		  device.getInputs()[0].setOn(1);	//установка на входе крана состояния открыто
		} else {										//***кран закрыт***	
		  device.getOutputs()[0].setOn(0);	//установка на входе крана состояния закрыто
		  device.getInputs()[0].setOn(0);	//установка на входе крана состояния закрыто
		}
	  };  
      updateOutput();
	//Вывод на экран состояния устройства
      var super_createUI = device.createUI;
	  
	  var maxFadeCount = 16;	//Время исчезновения
      var fadeTimeout = 100;
	  var Direction = { WE : 0, NS : 1, EW : 2, SN : 3 };
	  var state = device.deviceDef.state || { direction : Direction.WE };
      device.getState = function() {
        return state;
      };
	  
      device.createUI = function() {
        super_createUI();
        var size = device.getSize();



		//Отрисовка метки
        var $label = device.$ui.children('.simcir-device-label');
        //$label.attr('y', $label.attr('y') - unit / 4);
		//Отрисовка круга
        /*var $point = $s.createSVGElement('circle').
          css('pointer-events', 'none').css('opacity', 0).attr('r', 2).
          addClass('simcir-connector').addClass('simcir-joint-point');
        device.$ui.append($point);*/

        var $path = $s.createSVGElement('path').
          css('pointer-events', 'none').css('opacity', 0).
          addClass('simcir-connector');
        device.$ui.append($path);

        var $title = $s.createSVGElement('title').
          text('Alt + двойной клик мышью, чтобы изменить направление \n или двойной клик мышью, чтобы изменить метку.');
		  
		var updateUI = function() {
          var x0, y0, x1, y1;
          x0 = x1 = unit;
		  y0 = y1 = unit;
          var d = unit;
          var direction = state.direction;
          if (direction == Direction.WE || direction == Direction.EW) {
            x0 -= d;
            x1 += d;
          } else {
            y0 += d;
            y1 -= d;
          } /*else if (direction == Direction.EW) {
            x0 += d;
            x1 -= d;
          } else if (direction == Direction.SN) {
            y0 += d;
            y1 -= d;
          }*/
          //$path.attr('d', 'M' + x0 + ' ' + y0 + 'L' + x1 + ' ' + y1);
          $s.transform(in1.$ui, x0, y0);
          $s.transform(out1.$ui, x1, y1);
          //$point.attr({cx : x1 / 3, cy : y1});
          /*if (direction == Direction.EW || direction == Direction.WE) {
            device.$ui.children('.simcir-device-body').
              attr({x: 0, y: 0, width: unit, height: unit});
			  //attr({x: 0, y: unit / 4, width: unit, height: unit / 2});
          } else {
            device.$ui.children('.simcir-device-body').
              attr({x: unit / 4, y: 0, width: unit / 2, height: unit});
          }*/
		  
     	
		
		if (direction == Direction.EW || direction == Direction.WE) {
		  $s.transform(device.$ui.children('.simcir-pnevmo-switch-button-open'), 0, 0, 0);	
		  $s.transform(device.$ui.children('.simcir-pnevmo-switch-button-close'), 0, 0, 0);
		  $s.transform(device.$ui.children('.simcir-device-label'), 0, 0, 0);
          } else {
		  $s.transform(device.$ui.children('.simcir-pnevmo-switch-button-open'), unit * 2, 0, 90); 
		  $s.transform(device.$ui.children('.simcir-pnevmo-switch-button-close'), unit * 2, 0, 90);
		  $s.transform(device.$ui.children('.simcir-device-label'), 0, unit * 2, 270);
          }
		  
        };

        updateUI();

        var setOpacity = function(opacity) {
          device.$ui.children('.simcir-device-body').
            css('opacity', opacity);
          $path.css('opacity', 1 - opacity);
          //$point.css('opacity', 1 - opacity);
        };

		var fadeCount = 0;
		
		var fadeout = function() {
          window.setTimeout(function() {
            if (fadeCount > 0) {
              fadeCount -= 1;
              setOpacity(fadeCount / maxFadeCount);
              fadeout();
            }
          }, fadeTimeout);
        };
		
		
		
		var isEditable = function($dev) {
          var $workspace = $dev.closest('.simcir-workspace');
          return !!$s.controller($workspace).data().editable;
        };
		
		var device_mouseoutHandler = function(event) {
          if (!isEditable($(event.target) ) ) {
            return;
          }
          if (!device.isSelected() ) {
            fadeCount = maxFadeCount;
            fadeout();
          }
        };
		
		// поворот крана при двойном нажатии мыши
        var device_dblclickHandler = function(event) {
          if (!isEditable($(event.target) ) ) {
            return;
          }
		  if (event.altKey) {
			state.direction = (state.direction + 1) % 4;
		  }
          updateUI();
          // обновить соединители.
          $(this).trigger('mousedown').trigger('mouseup');
		  
        };
		
        device.$ui.on('mouseover', function(event) {
            if (!isEditable($(event.target) ) ) {
              $title.text('');
              return;
            }
            setOpacity(1);
            fadeCount = 0;
          }).on('deviceAdd', function() {
            if ($(this).closest('BODY').length == 0) {
              setOpacity(0);
            }
			// поворот крана
            $(this).append($title).on('mouseout', device_mouseoutHandler).
              on('dblclick', device_dblclickHandler);
            // скрыть метку
            //$label.css('display', 'none');
          }).on('deviceRemove', function() {
            $(this).off('mouseout', device_mouseoutHandler).
              off('dblclick', device_dblclickHandler);
            $title.remove();
            // показать метку
            //$label.css('display', '');
          }).on('deviceSelect', function() {
            if (device.isSelected() ) {
              setOpacity(1);
              fadeCount = 0;
            } else {
              if (fadeCount == 0) {
                setOpacity(0);
              }
            }
          });
		
		//Рисование крана
		var x2, y2, x3, y3, x4, y4, x5, x6, x7;
          x2 = (size.width - unit) / 2;
		  y2 = (size.height - unit) / 2;
          x3 = x2 + unit;
		  y3 = y2 + unit;
		  x4 = (size.width - unit) / 4;
		  y4 = size.width / 2;
		  x5 = x2 + unit + x4;
		  
        var $button = $s.createSVGElement('path').
          addClass('simcir-pnevmo-switch-button-close');

		
		$button.attr('d', 'M' + x4 + ' ' + y4 + 'L' + x2 + ' ' + y4 +
		'L' + x2 + ' ' + y2 + 'L' + x3 + ' ' + y3 + 'L' + x3 + ' ' + y4 +
		'L' + x5 + ' ' + y4 + 'L' + x3 + ' ' + y4 + 'L' + x3 + ' ' + y2 +
		'L' + x2 + ' ' + y3 + 'L' + x2 + ' ' + y4 + 'Z');
		
		if (type == 'Valve' && on) {
		  $button.removeClass('simcir-pnevmo-switch-button-close');
          $button.addClass('simcir-pnevmo-switch-button-open');
        }
		device.$ui.append($button);
		
        var button_mouseDownHandler = function(event) {
          event.preventDefault();
          event.stopPropagation();
          if (type == 'CheckValve') {
            on = true;
			$button.removeClass('simcir-pnevmo-switch-button-close');
            $button.addClass('simcir-pnevmo-switch-button-open');
          } else if (type == 'ControlValve') {
            on = false;
			$button.removeClass('simcir-pnevmo-switch-button-close');
            $button.addClass('simcir-pnevmo-switch-button-open');
          } else if (type == 'Valve') {
            on = !on;
			$button.removeClass('simcir-pnevmo-switch-button-close');
			$button.addClass('simcir-pnevmo-switch-button-open');
          }
          updateOutput();
          $(document).on('mouseup', button_mouseUpHandler);
          $(document).on('touchend', button_mouseUpHandler);
        };
        var button_mouseUpHandler = function(event) {
          if (type == 'CheckValve') {
            on = false;
            $button.removeClass('simcir-pnevmo-switch-button-open');
			$button.addClass('simcir-pnevmo-switch-button-close');
          } else if (type == 'ControlValve') {
            on = true;
            $button.removeClass('simcir-pnevmo-switch-button-open');
			$button.addClass('simcir-pnevmo-switch-button-close');
          } else if (type == 'Valve') {
            // сохранить состояние
            if (!on) {
              $button.removeClass('simcir-pnevmo-switch-button-open');
			  $button.addClass('simcir-pnevmo-switch-button-close');
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
        device.$ui.addClass('simcir-pnevmo-switch');
      };
    };
  };

  // регистрировать встроенные устройства
  $s.registerDevice('Вход', createPortFactory('in') );
  $s.registerDevice('Выход', createPortFactory('out') );
  $s.registerDevice('Соединитель', createJointFactory() ); 
  
    // регистрировать краны, обратные клапана и регуляторы 
	//  $s.registerDevice('ControlValve', createValveFactory('ControlValve') );
	//  $s.registerDevice('CheckValve', createValveFactory('CheckValve') );
  $s.registerDevice('Кран', createValveFactory('Valve') );
  

  // Зарегистрировать источник давления
  $s.registerDevice('Компрессор', function(device) {
    //device.addOutput();
    var super_createUI = device.createUI;
    device.createUI = function() {
      super_createUI();
      device.$ui.addClass('simcir-pnevmo-com');
    };

	var size = device.getSize();
    var g = $s.graphics(device.$ui);
    g.attr['class'] = 'simcir-pnevmo-symbol';

	var draw = function(g, x, y, width, height) {
		
		
    g.moveTo(x, y);
    g.lineTo(x + width, y + height / 2);
    g.lineTo(x, y + height);
    g.lineTo(x, y);
    g.closePath(true);
	};
	draw(g,(size.width - unit) / 2, (size.height - unit) / 2, unit, unit);
	//var $draw = device.$ui.children('.simcir-pnevmo-draw');
	var out1 = device.addOutput();	
    var maxFadeCount = 16;	//Время исчезновения Joint
    var fadeTimeout = 100;
    var Direction = { WE : 0, NS : 1, EW : 2, SN : 3 };	
	var state = device.deviceDef.state || { direction : Direction.WE };
      device.getState = function() {
        return state;
    };
	device.getOutputs()[0].setOn(3);
	//Отрисовка метки
    var $label = device.$ui.children('.simcir-device-label');
        //$label.attr('y', $label.attr('y') - unit / 4);
		//Отрисовка круга
        /*var $point = $s.createSVGElement('circle').
          css('pointer-events', 'none').css('opacity', 0).attr('r', 2).
          addClass('simcir-connector').addClass('simcir-joint-point');
        device.$ui.append($point);*/

    var $path = $s.createSVGElement('path').
          css('pointer-events', 'none').css('opacity', 0).
          addClass('simcir-connector');
        device.$ui.append($path);

    var $title = $s.createSVGElement('title').
          text('Alt + двойной клик мышью, чтобы изменить направление \n или двойной клик мышью, чтобы изменить метку.');
		  
	var updateUI = function() {
        var x0, y0, x1, y1;
        x0 = x1 = unit;
		y0 = y1 = unit;
        var d = unit;
        var direction = state.direction;
        if (direction == Direction.WE) {
            x0 -= d;
            x1 += d;
        } else if (direction == Direction.NS) {
            y0 -= d;
            y1 += d;
        } else if (direction == Direction.EW) {
            x0 += d;
            x1 -= d;
        } else if (direction == Direction.SN) {
            y0 += d;
            y1 -= d;
        }
          //$path.attr('d', 'M' + x0 + ' ' + y0 + 'L' + x1 + ' ' + y1);
          //$s.transform(in1.$ui, x0, y0);
        $s.transform(out1.$ui, x1, y1);
		
          //$point.attr({cx : x1 / 3, cy : y1});
          /*if (direction == Direction.EW || direction == Direction.WE) {
            device.$ui.children('.simcir-device-body').
              attr({x: 0, y: 0, width: unit, height: unit});
			  //attr({x: 0, y: unit / 4, width: unit, height: unit / 2});
          } else {
            device.$ui.children('.simcir-device-body').
              attr({x: unit / 4, y: 0, width: unit / 2, height: unit});
          }*/
		  
     	
		
		if (direction == Direction.EW || direction == Direction.WE) {
		  $s.transform(device.$ui.children('.simcir-device-label'), 0, 0, 0);
          } else {
		  $s.transform(device.$ui.children('.simcir-device-label'), 0, unit * 2, 270);
          }
		  
		if (direction == Direction.WE) {
		  $s.transform(device.$ui.children('.simcir-pnevmo-symbol'), 0, 0, 0);	
          } else if (direction == Direction.NS) {
		  $s.transform(device.$ui.children('.simcir-pnevmo-symbol'), unit * 2, 0, 90); 
          } else if (direction == Direction.EW) {
		  $s.transform(device.$ui.children('.simcir-pnevmo-symbol'), unit * 2, unit * 2, 180);
		  } else if (direction == Direction.SN) {
		  $s.transform(device.$ui.children('.simcir-pnevmo-symbol'), 0, unit * 2, 270);
		  }
        };

        updateUI();

        var setOpacity = function(opacity) {
          device.$ui.children('.simcir-device-body').
            css('opacity', opacity);
          $path.css('opacity', 1 - opacity);
          //$point.css('opacity', 1 - opacity);
        };

		var fadeCount = 0;
		
		var fadeout = function() {
          window.setTimeout(function() {
            if (fadeCount > 0) {
              fadeCount -= 1;
              setOpacity(fadeCount / maxFadeCount);
              fadeout();
            }
          }, fadeTimeout);
        };
		
		
		
		var isEditable = function($dev) {
          var $workspace = $dev.closest('.simcir-workspace');
          return !!$s.controller($workspace).data().editable;
        };
		
		var device_mouseoutHandler = function(event) {
          if (!isEditable($(event.target) ) ) {
            return;
          }
          if (!device.isSelected() ) {
            fadeCount = maxFadeCount;
            fadeout();
          }
        };
		
		
        var device_dblclickHandler = function(event) {
          if (!isEditable($(event.target) ) ) {
            return;
          }
		  if (event.altKey) {
			state.direction = (state.direction + 1) % 4;
		  }
          updateUI();
          // обновить соединители.
          $(this).trigger('mousedown').trigger('mouseup');
        };



        device.$ui.on('mouseover', function(event) {
            if (!isEditable($(event.target) ) ) {
              $title.text('');
              return;
            }
            setOpacity(1);
            fadeCount = 0;
          }).on('deviceAdd', function() {
            if ($(this).closest('BODY').length == 0) {
              setOpacity(0);
            }
            $(this).append($title).on('mouseout', device_mouseoutHandler).
              on('dblclick', device_dblclickHandler);
            // скрыть метку
            //$label.css('display', 'none');
          }).on('deviceRemove', function() {
            $(this).off('mouseout', device_mouseoutHandler).
              off('dblclick', device_dblclickHandler);
            $title.remove();
            // показать метку
            //$label.css('display', '');
          }).on('deviceSelect', function() {
            if (device.isSelected() ) {
              setOpacity(1);
              fadeCount = 0;
            } else {
              if (fadeCount == 0) {
                setOpacity(0);
              }
            }
          });
	
	
	
	
	
	
	
    //device.$ui.on('deviceAdd', function() {
      //device.getOutputs()[0].setValue(1);
    //});
    //device.$ui.on('deviceRemove', function() {
      //device.getOutputs()[0].setValue(0);
    //});
  });

  // Регистрация выхода давления (свеча)
  $s.registerDevice('Свеча', function(device) {
    var in1 = device.addInput();
    var super_createUI = device.createUI;
	device.getInputs()[0].setOn(4);
    //device.$ui.on('deviceAdd', function() {
      //device.getInputs()[0].setValue(0);
    //});
	
  // Создание устройства
    device.createUI = function() {
      super_createUI();
	  device.$ui.addClass('simcir-pnevmo-exit');
      var hiColor = device.deviceDef.color || defaultLEDColor;
      var bgColor = device.deviceDef.bgColor || defaultLEDBgColor;
      var loColor = multiplyColor(hiColor, bgColor, 0.25);
      var bLoColor = multiplyColor(hiColor, bgColor, 0.2);
      var bHiColor = multiplyColor(hiColor, bgColor, 0.8);
      var size = device.getSize();
      var $ledbase = $s.createSVGElement('circle').
        attr({cx: size.width / 2, cy: size.height / 2, r: size.width / 8}).
        attr('stroke', 'none').
        attr('fill', bLoColor);
      device.$ui.append($ledbase);
      var $led = $s.createSVGElement('circle').
        attr({cx: size.width / 2, cy: size.height / 2, r: size.width / 8 * 0.8}).
        attr('stroke', 'none').
        attr('fill', loColor);
		
		
	  var drawSvecha = function(g, x, y, width, height) {
		var depth = width * 0.2;
		g.moveTo(x * 2, y / 2);
		g.curveTo(19.8, 9, 20.5, 15.5);
		g.curveTo(20.5, 22, 16, 24);
		g.curveTo(11.2, 22, 11.5, 15.3);
		g.curveTo(11.5, 11.2, 16, 4);
		g.closePath(true);
	  };


	  /*var drawSvecha = function(g, x, y, width, height) {
		var depth = width * 0.2;
		g.moveTo(x * 2, y / 2);
		g.curveTo(x + width - depth, y, x/2 + width, y + height / 2);
		g.curveTo(x + width - depth-1, y + height, x * 2, y + height);
		g.curveTo(x + depth, y + height, x + depth, y + height / 2);
		g.curveTo(x + depth, y, x * 2, y / 2);
		g.closePath(true);
	  };*/



	    
      var g = $s.graphics(device.$ui);
        g.attr['class'] = 'simcir-basicset-symbol';
        drawSvecha(g, 
          (size.width - unit) / 2,
          (size.height - unit) / 2,
          unit, unit);
		  
	  device.$ui.append($led);
	  var x0, y0;
          x0 = unit;
		  y0 = unit * 2;
	  $s.transform(in1.$ui, x0, y0);
	  
	

        var setOpacity = function(opacity) {
          device.$ui.children('.simcir-device-body').
            css('opacity', opacity);
          //$path.css('opacity', 1 - opacity);
          //$point.css('opacity', 1 - opacity);
        };

		var fadeCount = 0;
	    var $title = $s.createSVGElement('title').
          text(' ');
		var maxFadeCount = 16;	//Время исчезновения
		var fadeTimeout = 100;		  
		var $label = device.$ui.children('.simcir-device-label');
		
		var fadeout = function() {
          window.setTimeout(function() {
            if (fadeCount > 0) {
              fadeCount -= 1;
              setOpacity(fadeCount / maxFadeCount);
              fadeout();
            }
          }, fadeTimeout);
        };
		
		
		
		var isEditable = function($dev) {
          var $workspace = $dev.closest('.simcir-workspace');
          return !!$s.controller($workspace).data().editable;
        };
		
		var device_mouseoutHandler = function(event) {
          if (!isEditable($(event.target) ) ) {
            return;
          }
          if (!device.isSelected() ) {
            fadeCount = maxFadeCount;
            fadeout();
          }
        };
		
		
        var device_dblclickHandler = function(event) {
          if (!isEditable($(event.target) ) ) {
            return;
          }
		  if (event.altKey) {
			state.direction = (state.direction + 1) % 4;
		  }
          updateUI();
          // обновить соединители.
          $(this).trigger('mousedown').trigger('mouseup');
        };



        device.$ui.on('mouseover', function(event) {
            if (!isEditable($(event.target) ) ) {
              $title.text('');
              return;
            }
            setOpacity(1);
            fadeCount = 0;
          }).on('deviceAdd', function() {
            if ($(this).closest('BODY').length == 0) {
              setOpacity(0);
            }
            $(this).append($title).on('mouseout', device_mouseoutHandler).
              on('dblclick', device_dblclickHandler);
            // скрыть метку
            $label.css('display', 'none');
          }).on('deviceRemove', function() {
            $(this).off('mouseout', device_mouseoutHandler).
              off('dblclick', device_dblclickHandler);
            $title.remove();
            // показать метку
            $label.css('display', '');
          }).on('deviceSelect', function() {
            if (device.isSelected() ) {
              setOpacity(1);
              fadeCount = 0;
            } else {
              if (fadeCount == 0) {
                setOpacity(0);
              }
            }
          });






	
	  
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
