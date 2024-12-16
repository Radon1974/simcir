//
// SimcirJS
//
// Copyright (c) 2014 Kazuhiko Arase
//
// URL: http://www.d-project.com/
//
// Licensed under the MIT license:
//  http://www.opensource.org/licenses/mit-license.php
//


'use strict';

var simcir = {};

//
// https://github.com/kazuhikoarase/lessQuery
//
simcir.$ = function() {

	var debug = location.hash == '#debug';
	var cacheIdKey = '.lessqCacheId';
	var cacheIdSeq = 0;
	var cache = {};
	debug = true;
  
	// получить Кэш
	var getCache = function(elm) {
		var cacheId = elm[cacheIdKey];
		if (typeof cacheId == 'undefined') {
		elm[cacheIdKey] = cacheId = cacheIdSeq++;
		cache[cacheId] = debug? { e : elm } : {};
		}
    return cache[cacheId];
	};
	// имеет ли Кэш (проверка) 
	var hasCache = function(elm) {
		return typeof elm[cacheIdKey] != 'undefined';
	};

	// отладка
	if (debug) { window.addEventListener('keydown', function() {
  
			if (event.altKey || event.metaKey) {
				console.clear();	  
				var lastKeys = {};
				var showCacheCount = function() {
					var cnt = 0;
					var keys = {};
					for (var k in cache) {
						cnt += 1;
						if (!lastKeys[k]) {
							console.log(cache[k]);
						}
						keys[k] = true;
					}
					lastKeys = keys;
					console.log('cacheCount:' + cnt);
					//window.setTimeout(showCacheCount, 5000);
				};
				showCacheCount();
			}
		});
	};
	
	// удалить Кэш
	var removeCache = function(elm) {

		if (typeof elm[cacheIdKey] != 'undefined') {

			// удалить всех слушателей
			var cacheId = elm[cacheIdKey];
			var listenerMap = cache[cacheId].listenerMap;
			for (var type in listenerMap) {
				var listeners = listenerMap[type];
				for (var i = 0; i < listeners.length; i += 1) {
				   elm.removeEventListener(type, listeners[i]);
				}
			}

			// удалить ссылки
			delete elm[cacheIdKey];
			delete cache[cacheId];
		}

		while (elm.firstChild) {
			removeCache(elm.firstChild);
			elm.removeChild(elm.firstChild);
		}
	};

	// получить данные
	var getData = function(elm) {
		if (!getCache(elm).data) { 
			getCache(elm).data = {}; 
		}
		return getCache(elm).data;
	};

	// получить слушателей
	var getListeners = function(elm, type) {
		if (!getCache(elm).listenerMap) {
			getCache(elm).listenerMap = {}; 
		}
		if (!getCache(elm).listenerMap[type]) {
			getCache(elm).listenerMap[type] = []; 
		}
		return getCache(elm).listenerMap[type];
	};

	// добавить / удалить прослушиватель событий.
	var addEventListener = function(elm, type, listener, add) {
		var listeners = getListeners(elm, type);
		var newListeners = [];
		for (var i = 0; i < listeners.length; i += 1) {
			if (listeners[i] != listener) {
				newListeners.push(listeners[i]);
			}
		}
		if (add) { 
			newListeners.push(listener); 
		}
		getCache(elm).listenerMap[type] = newListeners;
		return true;
	};

	// пользовательское событие
	var CustomEvent = {
		preventDefault : function() { this._pD = true; },
		stopPropagation : function() { this._sP = true; },
		stopImmediatePropagation : function() { this._sIp = true; }
	};
  
	// триггер
	var trigger = function(elm, type, data) {
		var event = { type : type, target : elm, currentTarget : null,
			_pD : false, _sP : false, _sIp : false, __proto__ : CustomEvent };
		for (var e = elm; e != null; e = e.parentNode) {
			if (!hasCache(e) ) { continue; }
			if (!getCache(e).listenerMap) { continue; }
			if (!getCache(e).listenerMap[type]) { continue; }
			event.currentTarget = e;
			var listeners = getCache(e).listenerMap[type];
			for (var i = 0; i < listeners.length; i += 1) {
				listeners[i].call(e, event, data);
				if (event._sIp) { return; }
			}
			if (event._sP) { return; }
		}
	};

	var data = function(elm, kv) {
		if (arguments.length == 2) {
			if (typeof kv == 'string') return getData(elm)[kv];
			for (var k in kv) { getData(elm)[k] = kv[k]; }
		} else if (arguments.length == 3) {
			getData(elm)[kv] = arguments[2];
		}
		return elm;
	};

	var extend = function(o1, o2) {
		for (var k in o2) { o1[k] = o2[k]; } return o1;
	};

	var each = function(it, callback) {
		if (typeof it.splice == 'function') {
			for (var i = 0; i < it.length; i += 1) { callback(i, it[i]); }
		} else {
			for (var k in it) { callback(k, it[k]); }
		}
	};
  
	// добавить коннекторы в newList которые соединены и не включать в newList выбранный на удаление
	var grep = function(list, accept) {
		var newList = [];
		for (var i = 0; i < list.length; i += 1) {
			var item = list[i];
			if (accept(item) ) {	//если не выбран коннектор на удаление то добавить в newList
				newList.push(item);
			}
		}
		return newList;	//вернуть новый newList без удаленных коннекторов
	};

	// добавить класс
	var addClass = function(elm, className, add) {
		var classes = (elm.getAttribute('class') || '').split(/\s+/g);
		var newClasses = '';
		for (var i = 0; i < classes.length; i+= 1) {
			if (classes[i] == className) { continue; }
			newClasses += ' ' + classes[i];
		}
		if (add) { newClasses += ' ' + className; }
		elm.setAttribute('class', newClasses);
	};

	// сравнение классов у элементов
	var hasClass = function(elm, className) {
		var classes = (elm.getAttribute('class') || '').split(/\s+/g); //извлечение класса из elm
		for (var i = 0; i < classes.length; i+= 1) {
			if (classes[i] == className) { return true; }	//сравнение классов, если совпало возврат истина
		}
    return false;
	};

	// сравнивание двух элементов (на выходе истина или ложь)
	var matches = function(elm, selector) {
		if (elm.nodeType != 1) {	//если не равно 1 то на выходе ложь
			return false;
		} else if (!selector) {		//если в selector ни чего не выбрано то на выходе истина
			return true;
		}
		//начало процесса сравнения
		var sels = selector.split(/[,\s]+/g);		//удалить в названии ненужные элементы текста
		for (var i = 0; i < sels.length; i += 1) {	//цикл перебора элементов
			var sel = sels[i];
			if (sel.substring(0, 1) == '#') {			//возврат первой буквы из строки и сравнение с '#'
				throw 'not supported:' + sel;
			} else if (sel.substring(0, 1) == '.') {	//возврат первой буквы из строки и сравнение с '.'
				if (hasClass(elm, sel.substring(1) ) ) {	//сравнение классов 2 элементов(первое слово у строки)?
					return true;								//если совпало то на выходе истина
				}
			} else {
				if (elm.tagName.toUpperCase() == sel.toUpperCase() ) {	//сравнение  HTML-тегов элементов
					return true;
				}
			}
		}
		return false;
	};

	var parser = new window.DOMParser();

	var html = function(html) {
		var doc = parser.parseFromString(
			'<div xmlns="http://www.w3.org/1999/xhtml">' + html + '</div>',
			'text/xml').firstChild;
		var elms = [];
		while (doc.firstChild) {
			elms.push(doc.firstChild);
			doc.removeChild(doc.firstChild);
		}
		elms.__proto__ = fn;
		return elms;
	};

	var pxToNum = function(px) {
		if (typeof px != 'string' || px.length <= 2 ||
			px.charAt(px.length - 2) != 'p' ||
			px.charAt(px.length - 1) != 'x') {
			throw 'illegal px:' + px;
		}
		return +px.substring(0, px.length - 2);
	};

	var buildQuery = function(data) {
		var query = '';
		for (var k in data) {
			if (query.length > 0) {
				query += '&';
			}
			query += window.encodeURIComponent(k);
			query += '=';
			query += window.encodeURIComponent(data[k]);
		}
		return query;
	};

	var parseResponse = function() {

		var contentType = this.getResponseHeader('content-type');
		if (contentType != null) {
			contentType = contentType.replace(/\s*;.+$/, '').toLowerCase();
		}

		if (contentType == 'text/xml' || contentType == 'application/xml') {
			return parser.parseFromString(this.responseText, 'text/xml');
		} else if (contentType == 'text/json' || contentType == 'application/json') {
			return JSON.parse(this.responseText);
		} else {
			return this.response;
		}
	};

	var ajax = function(params) {
		params = extend({
			url: '',
			method : 'GET',
			contentType : 'application/x-www-form-urlencoded;charset=UTF-8',
			cache: true,
			processData: true,
			async : true
		}, params);

		if (!params.async) {
			// принудительная асинхронность.
			throw 'not supported.';
		}

		var method = params.method.toUpperCase();
		var data = null;
		var contentType = params.contentType;
		if (method == 'POST' || method == 'PUT') {
			data = (typeof params.data == 'object' && params.processData)?
				buildQuery(params.data) : params.data;
		} else {
			contentType = false;
		}

		var xhr = params.xhr? params.xhr() : new window.XMLHttpRequest();
		xhr.open(method, params.url, params.async);
		if (contentType !== false) {
			xhr.setRequestHeader('Content-Type', contentType);
		}
		xhr.onreadystatechange = function() {
			if(xhr.readyState == window.XMLHttpRequest.DONE) {
				try {
					if (xhr.status == 200) {
						done.call(xhr, parseResponse.call(this) );
					} else {
						fail.call(xhr);
					}
				} finally {
					always.call(xhr);
				}
			}
		};

		// вызов позже
		window.setTimeout(function() { xhr.send(data); }, 0);

		// обратные вызовы
		var done = function(data) {};
		var fail = function() {};
		var always = function() {};

		var $ = {
			done : function(callback) { done = callback; return $; },
			fail : function(callback) { fail = callback; return $; },
			always : function(callback) { always = callback; return $; },
			abort : function() { xhr.abort(); return $; }
		};
		return $;
	};

	// 1. для одного элемента
	var fn = {
		attr : function(kv) {				//добавить аттрибут
			if (arguments.length == 1) {
				if (typeof kv == 'string') return this.getAttribute(kv);
				for (var k in kv) { this.setAttribute(k, kv[k]); }
			} else if (arguments.length == 2) {
				this.setAttribute(kv, arguments[1]);
			}
			return this;
		},
		prop : function(kv) {
			if (arguments.length == 1) {
				if (typeof kv == 'string') return this[kv];
				for (var k in kv) { this[k] = kv[k]; }
			} else if (arguments.length == 2) {
				this[kv] = arguments[1];
			}
			return this;
		},
		css : function(kv) {				//назначить стиль
			if (arguments.length == 1) {
				if (typeof kv == 'string') return this.style[kv];
				for (var k in kv) { this.style[k] = kv[k]; }
			} else if (arguments.length == 2) {
				this.style[kv] = arguments[1];
			}
			return this;
		},
		data : function(kv) {
			var args = [ this ];
			for (var i = 0; i < arguments.length; i += 1) {
				args.push(arguments[i]);
			}; 
			return data.apply(null, args);
		},
		val : function() {
			if (arguments.length == 0) {
				return this.value || '';
			} else if (arguments.length == 1) {
				this.value = arguments[0];
			}
			return this;
		},
		on : function(type, listener) {		//добавление события (клик мышкой...)
			var types = type.split(/\s+/g);
				for (var i = 0; i < types.length; i += 1) {
					this.addEventListener(types[i], listener);
					addEventListener(this, types[i], listener, true);
			}
			return this;
		},
		off : function(type, listener) {	//удаление события (клик мышкой...)
			var types = type.split(/\s+/g);
			for (var i = 0; i < types.length; i += 1) {
				this.removeEventListener(types[i], listener);
				addEventListener(this, types[i], listener, false);
			}
			return this;
		},
		trigger : function(type, data) {	//переключатели на устройствах
			trigger(this, type, data);
			return this;
		},
		offset : function() {				//получения координат устройств относительно страницы 
			var off = { left : 0, top : 0 };
			var base = null;
			for (var e = this; e.parentNode != null; e = e.parentNode) {
				if (e.offsetParent != null) {
					base = e;
					break;
				}
			}
			if (base != null) {
				for (var e = base; e.offsetParent != null; e = e.offsetParent) {
					off.left += e.offsetLeft;
					off.top += e.offsetTop;
				}
			}
			for (var e = this; e.parentNode != null &&
					e != document.body; e = e.parentNode) {
				off.left -= e.scrollLeft;
				off.top -= e.scrollTop;
			}
			return off;
		},
		append : function(elms) {		//добавление состояния к устройствам
			if (typeof elms == 'string') {
				elms = html(elms);
			}
			for (var i = 0; i < elms.length; i += 1) {
				this.appendChild(elms[i]);
			}
			return this;
		},
		prepend : function(elms) {		//добавление состояния к устройствам перед другим состоянием
			if (typeof elms == 'string') {
				elms = html(elms);
			}
			for (var i = 0; i < elms.length; i += 1) {
				if (this.firstChild) {
					this.insertBefore(elms[i], this.firstChild);
				} else {
					this.appendChild(elms[i]);
				}
			}
			return this;
		},
		insertBefore : function(elms) {		//вставить элемент перед другим элементом
			var elm = elms[0];
			elm.parentNode.insertBefore(this, elm);
			return this;
		},
		insertAfter : function(elms) {		//вставить элемент после другого элемента
			var elm = elms[0];
			if (elm.nextSibling) {
				elm.parentNode.insertBefore(this, elm.nextSibling);
			} else {
				elm.parentNode.appendChild(this);
			}
			return this;
		},
		remove : function() {				//удалить устройство и коннектора (удалить из кэша)
			if (this.parentNode) { this.parentNode.removeChild(this); }
			removeCache(this);
			return this;
		},
		detach : function() {				//удалить коннектора
			if (this.parentNode) { this.parentNode.removeChild(this); }
			return this;
		},
		parent : function() {				//получить родителя
			return $(this.parentNode);
		},
		closest : function(selector) {		//ищет ближайший родительский элемент, подходящий под указанный  селектор
			for (var e = this; e != null; e = e.parentNode) {
				if (matches(e, selector) ) {
					return $(e);
				}
			}
			return $();
		},
		find : function(selector) {			//пока непонятно
			var elms = [];
			var childNodes = this.querySelectorAll(selector);
			for (var i = 0; i < childNodes.length; i += 1) {
				elms.push(childNodes.item(i) );	//добавление в elms выбранного элемента пользователем
			}
			elms.__proto__ = fn;	//запись результатов функции
			return elms;
		},
		children : function(selector) {		//определение дочерних элементов (которые выбраны пользователем)
			var elms = [];
			var childNodes = this.childNodes;
			for (var i = 0; i < childNodes.length; i += 1) {
				if (matches(childNodes.item(i), selector) ) {	//определение какой элемент контроллера выбран
					elms.push(childNodes.item(i) );	//добавление в elms элемента, если совпал (класс) с выбранным элементом
				}
			}
			elms.__proto__ = fn;	//запись результатов функции (класс элемента)
			return elms;
		},
		index : function(selector) {
			return Array.prototype.indexOf.call(
				$(this).parent().children(selector), this);
		},
		clone : function() { return $(this.cloneNode(true) ); },
		focus : function() { this.focus(); return this; },
		select : function() { this.select(); return this; },
		submit : function() { this.submit(); return this; },
		scrollLeft : function() {
			if (arguments.length == 0) return this.scrollLeft;
			this.scrollLeft = arguments[0]; return this;
		},
		scrollTop : function() {
			if (arguments.length == 0) return this.scrollTop;
			this.scrollTop = arguments[0]; return this;
		},
		html : function() {
			if (arguments.length == 0) return this.innerHTML;
			this.innerHTML = arguments[0]; return this;
		},
		text : function() {
			if (typeof this.textContent != 'undefined') {
				if (arguments.length == 0) return this.textContent;
				this.textContent = arguments[0]; return this;
			} else {
				if (arguments.length == 0) return this.innerText;
				this.innerText = arguments[0]; return this;
			}
		},
		outerWidth : function(margin) {
			var w = this.offsetWidth;
			if (margin) {
				var cs = window.getComputedStyle(this, null);
				return w + pxToNum(cs.marginLeft) + pxToNum(cs.marginRight);
			}
			return w;
		},
		innerWidth : function() {
			var cs = window.getComputedStyle(this, null);
			return this.offsetWidth -
				pxToNum(cs.borderLeftWidth) - pxToNum(cs.borderRightWidth);
		},
		width : function() {
			if (this == window) return this.innerWidth;
			var cs = window.getComputedStyle(this, null);
			return this.offsetWidth -
				pxToNum(cs.borderLeftWidth) - pxToNum(cs.borderRightWidth) -
				pxToNum(cs.paddingLeft) - pxToNum(cs.paddingRight);
		},
		outerHeight : function(margin) {
			var h = this.offsetHeight;
			if (margin) {
				var cs = window.getComputedStyle(this, null);
				return h + pxToNum(cs.marginTop) + pxToNum(cs.marginBottom);
			}
			return h;
		},
		innerHeight : function() {
			var cs = window.getComputedStyle(this, null);
			return this.offsetHeight -
				pxToNum(cs.borderTopWidth) - pxToNum(cs.borderBottomWidth);
		},
		height : function() {
			if (this == window) return this.innerHeight;
			var cs = window.getComputedStyle(this, null);
			return this.offsetHeight -
				pxToNum(cs.borderTopWidth) - pxToNum(cs.borderBottomWidth) -
				pxToNum(cs.paddingTop) - pxToNum(cs.paddingBottom);
		},
		addClass : function(className) {		//добавить класс
			addClass(this, className, true); return this;
		},
		removeClass : function(className) {		//удалить класс
			addClass(this, className, false); return this;
		},
		hasClass : function(className) {		// имеет ли класс
			return hasClass(this, className);
		}
	};

  // 2. массив
	each(fn, function(name, func) {
		fn[name] = function() {
			var newRet = null;
			for (var i = 0; i < this.length; i += 1) {
				var elm = this[i];
				var ret = func.apply(elm, arguments);	//метод apply() вызывает функцию с указанным значением  и аргументами, предоставленными в виде массива
				if (elm !== ret) {
					if (ret != null && ret.__proto__ == fn) {
						if (newRet == null) { newRet = []; }
						newRet = newRet.concat(ret);	//соединить массив newRet с массивом ret
					} else {
						return ret;
					}
				}
			}
			if (newRet != null) {
				newRet.__proto__ = fn;	//запись полученного нового массива
				return newRet;
			}
			return this;
		};
	});

	// 3. для массива
	fn = extend(fn, {
		each : function(callback) {
			for (var i = 0; i < this.length; i += 1) {
				callback.call(this[i], i);
			}
			return this;
		},
		first : function() {
			return $(this.length > 0? this[0] : null);
		},
		last : function() {
			return $(this.length > 0? this[this.length - 1] : null);
		}
	});

	var $ = function(target) {
		if (typeof target == 'function') {
			// готов
			return $(document).on('DOMContentLoaded', target);
		} else if (typeof target == 'string') {
			if (target.charAt(0) == '<') {
				// dom создание
				return html(target);
			} else {
				// запрос
				var childNodes = document.querySelectorAll(target);
				var elms = [];
				for (var i = 0; i < childNodes.length; i += 1) {
					elms.push(childNodes.item(i) );
				}
				elms.__proto__ = fn;
				return elms;
			}
		} else if (typeof target == 'object' && target != null) {
			if (target.__proto__ == fn) {
				return target;
			} else {
				var elms = [];
				elms.push(target);
				elms.__proto__ = fn;
				return elms;
			}
		} else {
			var elms = [];
			elms.__proto__ = fn;
			return elms;
		}
	};
	return extend($, {
		fn : fn, extend : extend, each : each, grep : grep,
		data : data, ajax : ajax });
}();

!function($s) {

	var $ = $s.$;

	var createSVGElement = function(tagName) {
		return $(document.createElementNS(
        'http://www.w3.org/2000/svg', tagName) );
	};

	var createSVG = function (w, h) {
	    return createSVGElement('svg').attr({
	        version: '1.1',
	        width: w,
	        height: h,
	        viewBox: '0 0 ' + w + ' ' + h
	    });
	};
  
	//------Создание SVG элемента------
	var graphics = function ($target) {
	    var attr = {};
	    var buf = '';
	    //Перемещения текущего указателя в точку с координатами (x,y)
	    var moveTo = function (x, y) {
	        buf += ' M ' + x + ' ' + y;
	    };
	    //Рисование линии до точки с координатами (x,y)
	    var lineTo = function (x, y) {
	        buf += ' L ' + x + ' ' + y;
	    };
	    //Рисование кубической кривой Безье от текущей точки (x1, y1) до заданной (x,y)
	    var curveTo = function (x1, y1, x, y) {
	        buf += ' Q ' + x1 + ' ' + y1 + ' ' + x + ' ' + y;
	    };
	    //Замкнуть фигуру
	    var closePath = function (close, color) {
	        if (close) {
	            // really close path.
	            buf += ' Z';
	        }
	        $target.append(createSVGElement('path').
	            attr('d', buf).attr('style', 'fill:' + color).attr(attr));
	        buf = '';
	    };
	    //Укажите координаты x, y, ширину, высоту и нарисуете прямоугольник
	    var drawRect = function (x, y, width, height) {
	        $target.append(createSVGElement('rect').
	            attr({
	                x: x,
	                y: y,
	                width: width,
	                height: height
	            }).attr(attr));
	    };
	    //Укажите координаты x, y, радиус и нарисуете круг
	    var drawCircle = function (x, y, r) {
	        $target.append(createSVGElement('circle').
	            attr({
	                cx: x,
	                cy: y,
	                r: r
	            }).attr(attr));
	    };
	    return {
	        attr: attr,
	        moveTo: moveTo,
	        lineTo: lineTo,
	        curveTo: curveTo,
	        closePath: closePath,
	        drawRect: drawRect,
	        drawCircle: drawCircle
	    };
	};
	//-------------------------------------
  
	//------Функция поворота элемента------
	var transform = function () {
	    var attrX = 'simcir-transform-x';
	    var attrY = 'simcir-transform-y';
	    var attrRotate = 'simcir-transform-rotate';
	    var num = function ($o, k) {
	        var v = $o.attr(k);
	        return v ? +v : 0;
	    };
	    return function ($o, x, y, rotate) {
	        if (arguments.length >= 3) {
	            var transform = 'translate(' + x + ' ' + y + ')';
	            if (rotate) {
	                transform += ' rotate(' + rotate + ')';
	            }
	            $o.attr('transform', transform);
	            $o.attr(attrX, x);
	            $o.attr(attrY, y);
	            $o.attr(attrRotate, rotate);
	        } else if (arguments.length == 1) {
	            return {
	                x: num($o, attrX),
	                y: num($o, attrY),
	                rotate: num($o, attrRotate)
	            };
	        }
	    };
	}
	();
	//---------------------------------------
  
	var offset = function ($o) {
	    var x = 0;
	    var y = 0;
	    while ($o[0].nodeName != 'svg') {
	        var pos = transform($o);
	        x += pos.x;
	        y += pos.y;
	        $o = $o.parent();
	    }
	    return {
	        x: x,
	        y: y
	    };
	};

	var enableEvents = function ($o, enable) {
	    $o.css('pointer-events', enable ? 'visiblePainted' : 'none');
	};

	var disableSelection = function ($o) {
	    $o.each(function () {
	        this.onselectstart = function () {
	            return false;
	        };
	    }).css('-webkit-user-select', 'none');
	};

	var controller = function () {
	    var id = 'controller';
	    return function ($ui, controller) {
	        if (arguments.length == 1) {
	            return $.data($ui[0], id);
	        } else if (arguments.length == 2) {
	            $.data($ui[0], id, controller);
	        }
	    };
	}
	();
  
  //------Очередь событий------
	var eventQueue = function () {
	    var delay = 50; // ms
	    var limit = 40; // ms
	    var _queue = null;
	    var postEvent = function (event) {
	        if (_queue == null) {
	            _queue = [];
	        }
	        _queue.push(event); //добавление события
	    };
	    var dispatchEvent = function () {
	        var queue = _queue;
	        _queue = null;
	        while (queue.length > 0) {
	            var e = queue.shift();
	            e.target.trigger(e.type);
	        }
	    };
	    var getTime = function () {
	        return new Date().getTime();
	    };
	    var timerHandler = function () {
	        var start = getTime();
	        while (_queue != null && getTime() - start < limit) {
	            dispatchEvent();
	        }
	        window.setTimeout(timerHandler,
	            Math.max(delay - limit, delay - (getTime() - start)));
	    };
	    timerHandler();
	    return {
	        postEvent: postEvent
	    };
	}
	();
	//----------------------------
  
	var unit = 16;		//Размер сетки и элементов
	var fontSize = 12;	//Размер шрифта
	//Создание метки элемента
	var createLabel = function (text) {
	    return createSVGElement('text').
	    text(text).
	    css('font-size', fontSize + 'px');
	};
	//Создание входного или выходного подключения для элемента (библиотека)
	//type: in, out, in_out(тип: вход, выход, вход-выход)
	//label: метка на входе(выходе) из элемента(внутри элемента)
	//description: надпись на входе(выходе) из элемента(снаружи элемента)
	//headless: true, false (заголовок)
	var createNode = function (type, label, description, headless) {
	    var $node = createSVGElement('g').
	        attr('simcir-node-type', type); //Создание SVG
	    if (!headless) {
	        $node.attr('class', 'simcir-node');
	    }
	    var node = createNodeController({
	        $ui: $node,
	        type: type,
	        label: label,
	        description: description,
	        headless: headless
	    });
	    if (type == 'in' || type == 'out') {
	        controller($node, createOutputNodeController(node)); //создание входного узла
	    } else {
	        throw 'unknown type:' + type;
	    }
	    return $node;
	};

	var isActiveNode = function ($o) {
	    return $o.closest('.simcir-node').length == 1 &&
	    $o.closest('.simcir-toolbox').length == 0;
	};
	//Отображение входа(выхода) элемента
	var createNodeController = function (node) {
	    var _value = null;
	    var _status = 0;
	    var _on = 0;
	    var setValue = function (value, force) {
	        if (_value === value && !force) {
	            return;
	        }
	        //Изменение значения узла (есть сигнал / нет сигнала)
	        _value = value;
	        eventQueue.postEvent({
	            target: node.$ui,
	            type: 'nodeValueChange'
	        }); //добавление события на изменение
	    };
	    var getValue = function () {

	        return _value;
	    };

	    var setStatus = function (status, force) {
	        if (_status === status && !force) {
	            return;
	        }
	        //Изменение значения узла (есть сигнал / нет сигнала)
	        _status = status;

	        //eventQueue.postEvent({target: node.$ui, type: 'nodeValueChange'});	//добавление события на изменение
	    };

	    var getStatus = function () {

	        return _status;
	    };

	    var setOn = function (on, force) {
	        if (_on === on && !force) {
	            return;
	        }
	        //Изменение значения узла (есть сигнал / нет сигнала)
	        _on = on;

	        eventQueue.postEvent({
	            target: node.$ui,
	            type: 'SwitchChange'
	        }); //добавление события на изменение

	    };

	    var getOn = function () {

	        return _on;
	    };

	    if (!node.headless) {

	        node.$ui.attr('class', 'simcir-node simcir-node-type-' + node.type);
	        //курсор над элементом
	        var $circle = createSVGElement('circle').
	            attr({
	                cx: 0,
	                cy: 0,
	                r: 4
	            });
	        node.$ui.on('mouseover', function (event) {
	            if (isActiveNode(node.$ui)) {
	                node.$ui.addClass('simcir-node-hover');
	            }
	        });
	        //курсор ушел с элемента
	        node.$ui.on('mouseout', function (event) {
	            if (isActiveNode(node.$ui)) {
	                node.$ui.removeClass('simcir-node-hover');
	            }
	        });
	        node.$ui.append($circle);
	        //отображение метки на элементе
	        var appendLabel = function (text, align) {
	            var $label = createLabel(text).
	                attr('class', 'simcir-node-label');
	            enableEvents($label, false);
	            if (align == 'right') {
	                $label.attr('text-anchor', 'start').
	                attr('x', 6).
	                attr('y', fontSize / 2);
	            } else if (align == 'left') {
	                $label.attr('text-anchor', 'end').
	                attr('x', -6).
	                attr('y', fontSize / 2);
	            }
	            node.$ui.append($label);
	        };
	        //справа или слева отображать метку на элементе
	        if (node.label) {
	            if (node.type == 'in') {
	                appendLabel(node.label, 'right');
	            } else if (node.type == 'out') {
	                appendLabel(node.label, 'left');
	            }
	        }
	        //справа или слева отображать описание на элементе
	        if (node.description) {
	            if (node.type == 'in') {
	                appendLabel(node.description, 'left');
	            } else if (node.type == 'out') {
	                appendLabel(node.description, 'right');
	            }
	        }
	        //отображение при появлении сигнала на узле
	        node.$ui.on('nodeValueChange', function (event) {
	            if (_value == 1) { //есть давление
	                node.$ui.addClass('simcir-node-hot');
	            } else { //нет давления
	                node.$ui.removeClass('simcir-node-hot');
	            }

	            /*if (_status == 0) {	//связь с выходом давления (свеча)
	            node.$ui.removeClass('simcir-connector-hot');
	            node.$ui.removeClass('simcir-connector-isolated');
	            node.$ui.addClass('simcir-connector');
	            }
	            if (_status == 1) {	//связь с источником давления
	            node.$ui.removeClass('simcir-connector-isolated');
	            node.$ui.removeClass('simcir-connector');
	            node.$ui.addClass('simcir-connector-hot');
	            }
	            if (_status == 2) {	//изорированный
	            node.$ui.removeClass('simcir-connector-hot');
	            node.$ui.removeClass('simcir-connector');
	            node.$ui.addClass('simcir-connector-isolated');
	            }*/
	        });
	    }

	    return $.extend(node, {
	        setValue: setValue,
	        getValue: getValue,
	        setStatus: setStatus,
	        getStatus: getStatus,
	        setOn: setOn,
	        getOn: getOn
	    });
	};
  
  

  
	//Создание входных и выходных узлов контроллера
	var createOutputNodeController = function(node) {
		var inputs = [];
		var inputsPointX = [];
		var inputsPointY = [];
		var output2 = [];	//тест
		var PointX = [];
		var PointY = [];
		/*var super_setValue = node.setValue;
		var setValue = function(value) {
		  //console.log ('value:', value);
		  super_setValue(value);	//ссылается на setValue из 879 строки
		  for (var i = 0; i < inputs.length; i += 1) {	//выйти из этой функции, когда inputs.length = 0
			inputs[i].setValue(value);
		  }
		};*/
		//добавление коннектора	(подключение)																  
		var connectTo = function (inNode) {

			/*if (inNode.getOutput() != null) {
			inNode.getOutput().disconnectFrom(inNode);
			}*/

			if (inNode != node) { //проверка на соединение коннектора с одним и тем же узлом
				inNode.setOutput(node); //добавление ко входному узлу выходного узла
				inputs.push(inNode); //добавление входного узла с выходным узлом в inputs
			}

			/*inNode.setValue(0);
			inNode.getOutput().setValue(0);
			inNode.setValue(node.getValue(), true);	//установка сигнала подключения из getValue()
			console.log ('inNode.setOutput:', inNode.getOutput());
			console.log ('--------------------------------');
			console.log ('inputs:', inputs);
			console.log ('inNode.getOutput2:', inNode.getOutput2());*/
		};
		//добавление новой точки коннектора	(подключение к узлу, посредством точек)																  
		//var connectToPoint = function (x, y) {
		//	inputsPointX.push(x);
		//	inputsPointY.push(y);
		//	//console.log ('x:', inputsPointX);
		//	//console.log ('y:', inputsPointY);
		//};
		
		//var getToPointX = function () {
		//	return PointX;
		//};
		
		//var getToPointY = function () {
		//	return PointY;
		//};		
		
		//var inputsPoint = function () {
		//	for (let i = 0; i < inputsPointX.length; i++) {
		//	PointX.push(inputsPointX[i]);
		//	PointY.push(inputsPointY[i]);
		//	};
		//};
		//удаление  коннектора (отключение)
		var disconnectFrom = function (inNode) {
			/*if (inNode.getOutput() != node) {
			throw 'not connected.';
			}*/
			inNode.setOutput(null);

			//inNode.setValue(null, true);
			inputs = $.grep(inputs, function (v) { //удаление подключенного коннектора
				return v != inNode;
			});
		};
		
		//удаление  коннектора (отключение)
		var disconnectFrom2 = function (inNode) {
			/*if (inNode.getOutput() != node) {
			throw 'not connected.';
			}*/
			inNode.clearOutput(node); //узел на другом устройстве --> узел на этом устройстве (удаляемом)


			//inNode.setValue(null, true);
			inputs = $.grep(inputs, function (v) { //удаление подключенного коннектора
				return v != inNode;
			});
		};
		
		var getInputs = function () {
			return inputs;
		};
		
		var input = null;
		var setInput = function (outNode) {
			input = outNode;
			//console.log("вх коннектор", input)
		};
		var getInput = function () {
			return input;
		};

		var output = null;
		
		
		
		var setOutput = function (outNode) {	//соединение входного узла с выходным узлом коннектором
			//outNode.push(inputsPointX);
			//outNode.push(inputsPointY);
			//outNode.inputsPoint();
			output = outNode;
			output2.push(outNode); //тест
			//for (let i = 0; i < inputsPointX.length; i++) {
			//PointX.push(inputsPointX[i]);
			//PointY.push(inputsPointY[i]);
			//};
			//console.log("вых коннектор", output);
			//console.log("вых коннектор2", output2);
			//console.log("PointX", PointX);
			//console.log("PointY", PointY);
			
		};

		var clearOutput = function (outNode) { //тест
			var i = null
				i = output2.indexOf(outNode);
			if (i >= 0) {
				output2.splice(i, 1);
			}

		};

		var getOutput = function () {
			return output;
		};

		var getOutput2 = function () { //тест
			return output2;
		};


		return $.extend(node, {
		    setInput: setInput,
		    getInput: getInput,
		    setOutput: setOutput,
		    clearOutput: clearOutput,
			//inputsPoint: inputsPoint,
		    getOutput: getOutput,
		    getOutput2: getOutput2, //тест
		    //setValue: setValue,
		    getInputs: getInputs,
		    connectTo: connectTo,
			//connectToPoint: connectToPoint,
			//getToPointX: getToPointX,
			//getToPointY: getToPointY,
			//inputsPointX: inputsPointX,
			//inputsPointY: inputsPointY,
		    disconnectFrom: disconnectFrom,
		    disconnectFrom2: disconnectFrom2
		});
	};

  
	//Создание элемента
	var createDevice = function (deviceDef, headless, scope) {
	    headless = headless || false;
	    scope = scope || null;
	    var $dev = createSVGElement('g');
	    if (!headless) {
	        $dev.attr('class', 'simcir-device');
	    }
	    controller($dev, createDeviceController({
	            $ui: $dev,
	            deviceDef: deviceDef,
	            headless: headless,
	            scope: scope,
	            doc: null
	        }));
	    var factory = factories[deviceDef.type];
	    if (factory) {
	        factory(controller($dev));
	    }
	    if (!headless) {
	        controller($dev).createUI();
	    }
	    return $dev;
	};
  
	//------Создание контроллера------
	var createDeviceController = function (device) {
	    var inputs = [];
	    var outputs = [];

	    //Создание входного узла контроллера
	    var addInput = function (label, description) {
	        var $node = createNode('in', label, description, device.headless);

	        //Анализ входного узла на наличие сигнала
	        $node.on('nodeValueChange', function (event) {
	            device.$ui.trigger('inputValueChange');
	        });
	        if (!device.headless) {
	            device.$ui.append($node);
	        }
	        var node = controller($node);
	        inputs.push(node); //добавление входного узла
	        return node;
	    };

	    //Создание выходного узла контроллера
	    var addOutput = function (label, description) {
	        var $node = createNode('out', label, description, device.headless);

	        //Анализ выходного узла на наличие сигнала
	        $node.on('nodeValueChange', function (event) {
	            device.$ui.trigger('outputValueChange');
	        });
	        if (!device.headless) {
	            device.$ui.append($node);
	        }
	        var node = controller($node);
	        outputs.push(node); //добавление выходного узла
	        return node;
	    };

	    //Возврат входных узлов
	    var getInputs = function () {
	        return inputs;
	    };

	    //Возврат выходных узлов
	    var getOutputs = function () {
	        return outputs;
	    };

	    //Отсоединить все узлы
	    var disconnectAll = function () {
	        //Отключение на входе устройства
	        $.each(getInputs(), function (i, inNode) {

	            var inNodes = inNode.getInputs(); //выхода на другом устройстве
	            for (var i = 0; i < inNodes.length; i += 1) {

	                if (inNodes[i] != null) {
	                    inNode.disconnectFrom2(inNodes[i]); //вход на устройстве (удаляемом) --> выхода (входы) на другом устройстве
	                }
	            }

	            var outNodes = inNode.getOutput2();
	            for (var i = 0; i < outNodes.length; i += 1) {

	                outNodes[i].disconnectFrom2(inNode); //выхода (входы) на другом устройстве -->  вход на устройстве (удаляемом)

	            }

	            /*if (outNode != null) {
	            outNode.disconnectFrom(inNode);	//выход на другом устройстве --> вход на устройстве (удаляемом)
	            }*/

	        });

	        //Отключение на выходе устройства
	        $.each(getOutputs(), function (i, outNode) {
	            $.each(outNode.getInputs(), function (i, inNode) {

	                var outNodes = outNode.getInputs(); //выхода на другом устройстве
	                for (var i = 0; i < outNodes.length; i += 1) {

	                    if (outNodes[i] != null) {
	                        outNode.disconnectFrom2(outNodes[i]); //вход на устройстве (удаляемом) --> выхода (входы) на другом устройстве
	                    }
	                }

	                //outNode.disconnectFrom(inNode);
	            });
	        });

	    };

	    //Удалить устройство
	    device.$ui.on('dispose', function () {
	        $.each(getInputs(), function (i, inNode) {
	            inNode.$ui.remove(); //удалить входные узлы
	        });
	        $.each(getOutputs(), function (i, outNode) {
	            outNode.$ui.remove(); //удалить выходные узлы
	        });

	        device.$ui.remove(); //удалить устройство
	    });

	    var selected = false;
	    var setSelected = function (value) {
	        selected = value;
	        device.$ui.trigger('deviceSelect');
	    };
	    var isSelected = function () {
	        return selected;
	    };

	    var label = device.deviceDef.label;
	    var defaultLabel = device.deviceDef.type;
	    if (typeof label == 'undefined') {
	        label = defaultLabel;
	    }

	    //Глобальная замена символов строки на пустые
	    var setLabel = function (value) {
	        value = value.replace(/^\s+|\s+$/g, '');
	        label = value || defaultLabel;
	        device.$ui.trigger('deviceLabelChange');
	    };
	    var getLabel = function () {
	        return label;
	    };

	    var getSize = function () {
	        var nodes = Math.max(device.getInputs().length,
	                device.getOutputs().length);
	        return {
	            width: unit * 2,
	            height: unit * Math.max(2, device.halfPitch ?
	                (nodes + 1) / 2 : nodes)
	        };
	    };

	    // Определение размеров элемента
	    var layoutUI = function () {

	        var size = device.getSize();
	        var w = size.width;
	        var h = size.height;

	        device.$ui.children('.simcir-device-body').
	        attr({
	            x: 0,
	            y: 0,
	            width: w,
	            height: h
	        }); //добавить атрибуты к элементу

	        var pitch = device.halfPitch ? unit / 2 : unit; //если половина размера то unit / 2
	        var layoutNodes = function (nodes, x) {
	            var offset = (h - pitch * (nodes.length - 1)) / 2; //определение высоты элемента в зависимости от кол-ва узлов
	            $.each(nodes, function (i, node) {
	                transform(node.$ui, x, pitch * i + offset); //трансформация элемента
	            });
	        };
	        layoutNodes(getInputs(), 0);
	        layoutNodes(getOutputs(), w);

	        device.$ui.children('.simcir-device-label').
	        attr({
	            x: w / 2,
	            y: h + fontSize
	        }); //добавить координаты метки элемента
	    };

	    //Переименование элемента схемы
	    var createUI = function () {

	        device.$ui.attr('class', 'simcir-device');
	        device.$ui.on('deviceSelect', function () {
	            if (selected) {
	                $(this).addClass('simcir-device-selected');
	            } else {
	                $(this).removeClass('simcir-device-selected');
	            }
	        });

	        var $body = createSVGElement('rect').
	            attr('class', 'simcir-device-body').
	            attr('rx', 2).attr('ry', 2);
	        device.$ui.prepend($body);

	        var $label = createLabel(label).
	            attr('class', 'simcir-device-label').
	            attr('text-anchor', 'middle');
	        device.$ui.on('deviceLabelChange', function () {
	            $label.text(getLabel());
	        });

	        var label_dblClickHandler = function (event) {
	            event.preventDefault();
	            event.stopPropagation();
	            var $workspace = $(event.target).closest('.simcir-workspace');
	            if (!controller($workspace).data().editable) {
	                return;
	            }
	            var title = 'Введите имя устройства ';
	            var $labelEditor = $('<input type="text"/>').
	                addClass('simcir-label-editor').
	                val($label.text()).
	                on('keydown', function (event) {
	                    if (event.keyCode == 13) {
	                        // ENTER
	                        setLabel($(this).val());
	                        $dlg.remove();
	                    } else if (event.keyCode == 27) {
	                        // ESC
	                        $dlg.remove();
	                    }
	                });
	            var $placeHolder = $('<div></div>').
	                append($labelEditor);
	            var $dlg = showDialog(title, $placeHolder);
	            $labelEditor.focus();
	        };
	        device.$ui.on('deviceAdd', function () {
	            $label.on('dblclick', label_dblClickHandler);
	        });
	        device.$ui.on('deviceRemove', function () {
	            $label.off('dblclick', label_dblClickHandler);
	        });
	        device.$ui.append($label);
	        layoutUI();
	    };

	    var getState = function () {
	        return null;
	    };

	    return $.extend(device, {
	        addInput: addInput,
	        addOutput: addOutput,
	        getInputs: getInputs,
	        getOutputs: getOutputs,
	        disconnectAll: disconnectAll,
	        setSelected: setSelected,
	        isSelected: isSelected,
	        getLabel: getLabel,
	        halfPitch: false,
	        getSize: getSize,
	        createUI: createUI,
	        layoutUI: layoutUI,
	        getState: getState
	    });
	};
	//-------------------------------------------------
  
	//Создание коннектора с координатами x1, y1, x2, y2
	var createConnector = function (x1, y1, x2, y2) {
	    return createSVGElement('path').
	    attr('d', 'M ' + x1 + ' ' + y1 + ' L ' + x2 + ' ' + y2).
	    attr('class', 'simcir-connector');
	};

	var connect = function ($node1, $node2) {
	    //var type1 = $node1.attr('simcir-node-type');
	    //var type2 = $node2.attr('simcir-node-type');
	    var id1 = controller($node1).id; //получение "dev" устройства
	    var id2 = controller($node2).id; //получение "dev" устройства

	    //if (id1.split(".",1)[0] != id2.split(".",1)[0]) {	//проверка на соединение узлов на одном и том же устройстве

	    controller($node2).connectTo(controller($node1)); //подключение узлов
	    //}
	};

	//var connectPoint = function ($node1, x, y) {
	    //controller($node2).connectToPoint(controller($node1), x, y); //подключение узлов
		//controller($node1).connectToPoint(x, y);
		//console.log ('node1:', controller($node1));
	//};
	var buildCircuit = function (data, headless, scope) {
		var $devices = [];
		var $devMap = {};
		var getNode = function (path) {
			if (!path.match(/^(\w+)\.(in|out)([0-9]+)$/g)) {
				throw 'unknown path:' + path;
			}
			var devId = RegExp.$1;
			var type = RegExp.$2;
			var index = +RegExp.$3;
			return (type == 'in') ?
			controller($devMap[devId]).getInputs()[index] :
			controller($devMap[devId]).getOutputs()[index];
		};
		$.each(data.devices, function (i, deviceDef) {
			var $dev = createDevice(deviceDef, headless, scope);
			transform($dev, deviceDef.x, deviceDef.y);
			$devices.push($dev);
			$devMap[deviceDef.id] = $dev;
		});
		$.each(data.connectors, function (i, conn) {
			var nodeFrom = getNode(conn.from);
			var nodeTo = getNode(conn.to);
			if (nodeFrom && nodeTo) {
				connect(nodeFrom.$ui, nodeTo.$ui);
				//clearStatusNode();	//очистить статус
				//updateValueNodePressOutput();	//проверить соединение с выходом
				//updateValueNodePressSource();	//проверить соединение с источником давления
			}
		});
		return $devices;
	};

	var dialogManager = function () {
		var dialogs = [];
		var updateDialogs = function ($dlg, remove) {
			var newDialogs = [];
			$.each(dialogs, function (i) {
				if (dialogs[i] != $dlg) {
					newDialogs.push(dialogs[i]);
				}
			});
			if (!remove) {
				newDialogs.push($dlg);
			}
			// перенумеровать z-index
			$.each(newDialogs, function (i) {
				newDialogs[i].css('z-index', '' + (i + 1));
			});
			dialogs = newDialogs;
		};
		return {
			add: function ($dlg) {
				updateDialogs($dlg);
			},
			remove: function ($dlg) {
				updateDialogs($dlg, true);
			},
			toFront: function ($dlg) {
				updateDialogs($dlg);
			}
		};
	}();
		
	//Обработка действий пользователя
	var showDialog = function (title, $content) {
		var $closeButton = function () {
			var r = 16;
			var pad = 4;
			var $btn = createSVG(r, r).
				attr('class', 'simcir-dialog-close-button');
			var g = graphics($btn);
			g.drawRect(0, 0, r, r);
			g.attr['class'] = 'simcir-dialog-close-button-symbol';
			g.moveTo(pad, pad);
			g.lineTo(r - pad, r - pad);
			g.closePath();
			g.moveTo(r - pad, pad);
			g.lineTo(pad, r - pad);
			g.closePath();
			return $btn;
		}
		();
		var $title = $('<div></div>').
			addClass('simcir-dialog-title').
			text(title).
			css('cursor', 'default').
			on('mousedown', function (event) {
				event.preventDefault();
			});
		var $dlg = $('<div></div>').
			addClass('simcir-dialog').
			css({
				position: 'absolute'
			}).
			append($title.css('float', 'left')).
			append($closeButton.css('float', 'right')).
			append($('<br/>').css('clear', 'both')).
			append($content);
		$('BODY').append($dlg);
		dialogManager.add($dlg);
		var dragPoint = null;
		var dlg_mouseDownHandler = function (event) {
			if (!$(event.target).hasClass('simcir-dialog') &&
				!$(event.target).hasClass('simcir-dialog-title')) {
				return;
			}
			event.preventDefault();
			dialogManager.toFront($dlg);
			var off = $dlg.offset();
			dragPoint = {
				x: event.pageX - off.left,
				y: event.pageY - off.top
			};
			$(document).on('mousemove', dlg_mouseMoveHandler);
			$(document).on('mouseup', dlg_mouseUpHandler);
		};
		var dlg_mouseMoveHandler = function (event) {
			moveTo(
				event.pageX - dragPoint.x,
				event.pageY - dragPoint.y);

		};
		var dlg_mouseUpHandler = function (event) {
			$(document).off('mousemove', dlg_mouseMoveHandler);
			$(document).off('mouseup', dlg_mouseUpHandler);
		};
		$dlg.on('mousedown', dlg_mouseDownHandler);
		$closeButton.on('mousedown', function () {
			$dlg.trigger('close');
			$dlg.remove();
			dialogManager.remove($dlg);
		});
		var w = $dlg.width();
		var h = $dlg.height();
		var cw = $(window).width();
		var ch = $(window).height();
		var getProp = function (id) {
			return $('HTML')[id]() || $('BODY')[id]();
		};
		var x = (cw - w) / 2 + getProp('scrollLeft');
		var y = (ch - h) / 2 + getProp('scrollTop');
		var moveTo = function (x, y) {
			$dlg.css({
				left: x + 'px',
				top: y + 'px'
			});
		};
		moveTo(x, y);
		return $dlg;
	};
	  
	//Создание устройства
	var createDeviceRefFactory = function (data) {
		return function (device) {
			var $devs = buildCircuit(data, true, {});
			var $ports = [];
			$.each($devs, function (i, $dev) {
				var deviceDef = controller($dev).deviceDef;
				if (deviceDef.type == 'Вход' || deviceDef.type == 'Выход') {
					$ports.push($dev);
				}

			});
			$ports.sort(function ($p1, $p2) {
				var x1 = controller($p1).deviceDef.x;
				var y1 = controller($p1).deviceDef.y;
				var x2 = controller($p2).deviceDef.x;
				var y2 = controller($p2).deviceDef.y;
				if (x1 == x2) {
					return (y1 < y2) ? -1 : 1;
				}
				return (x1 < x2) ? -1 : 1;
			});
			var getDesc = function (port) {
				return port ? port.description : '';
			};
			$.each($ports, function (i, $port) {
				var port = controller($port);
				var portDef = port.deviceDef;
				var inPort;
				var outPort;

				if (portDef.type == 'Вход') {
					outPort = port.getOutputs()[0];
					//console.log('port.getOutputs:', port.getOutputs());
					inPort = device.addInput(portDef.label,
							getDesc(outPort.getInputs()[0]));
					for (var k in device.getInputs()) {
						device.getInputs()[k].setOn(1); //входной порт всегда открыт
					}

					// принудительно отключить тестовые устройства, подключенные к In-port
					//var inNode = port.getInputs()[0];

					//if (inNode.getOutput() != null) {
					//  inNode.getOutput().disconnectFrom2(inNode);
					//}
				} else if (portDef.type == 'Выход') {
					inPort = port.getInputs()[0];
					//console.log('port.getInputs:', port.getInputs());
					outPort = device.addOutput(portDef.label,
							getDesc(inPort.getOutput2()[0]));
					for (var k in device.getOutputs()) {
						device.getOutputs()[k].setOn(1); //выходной порт всегда открыт
					}

					// принудительно отключить тестовые устройства, подключенные к Out-port
					//var outNode = port.getOutputs()[0];
					//$.each(outNode.getInputs(), function(i, inNode) {
					//  if (inNode.getOutput() != null) {
					//    inNode.getOutput().disconnectFrom2(inNode);
					//  }
					//} );
				}

				inPort.$ui.on('nodeValueChange', function () {
					outPort.setValue(inPort.getValue());

				});

			});

			var super_getSize = device.getSize;
			device.getSize = function () {
				var size = super_getSize();
				return {
					width: unit * 4,
					height: size.height
				};
			};
			device.$ui.on('dispose', function () {
				$.each($devs, function (i, $dev) {
					$dev.trigger('dispose');
				});
			});
			device.$ui.on('dblclick', function (event) {
				// open library,
				event.preventDefault();
				event.stopPropagation();
				showDialog(device.deviceDef.label || device.deviceDef.type,
					setupSimcir($('<div></div>'), data)).on('close', function () {
					$(this).find('.simcir-workspace').trigger('dispose');
				});
			});
		};
	};
	  
	//Создание собственного устройства
	var createCustomLayoutDeviceRefFactory = function (data) {
		return function (device) {
			var $devs = buildCircuit(data, true, {});
			var $ports = [];
			var intfs = [];
			$.each($devs, function (i, $dev) {
				var deviceDef = controller($dev).deviceDef;
				if (deviceDef.type == 'Вход' || deviceDef.type == 'Выход') {
					$ports.push($dev);
				}
			});
			var getDesc = function (port) {
				return port ? port.description : '';
			};
			$.each($ports, function (i, $port) {
				var port = controller($port);
				var portDef = port.deviceDef;
				var inPort;
				var outPort;
				if (portDef.type == 'Вход') {
					outPort = port.getOutputs()[0];
					inPort = device.addInput();
					intfs.push({
						node: inPort,
						label: portDef.label,
						desc: getDesc(outPort.getInputs()[0])
					});
					for (var k in device.getInputs()) {
						device.getInputs()[k].setOn(1); //входной порт всегда открыт
					}
					// принудительное отключение тестовых устройств, подключенных к порту In-port
					//var inNode = port.getInputs()[0];
					//if (inNode.getOutput() != null) {
					//  inNode.getOutput().disconnectFrom2(inNode);
					//}
				} else if (portDef.type == 'Выход') {
					inPort = port.getInputs()[0];
					outPort = device.addOutput();
					intfs.push({
						node: outPort,
						label: portDef.label,
						desc: getDesc(inPort.getOutput2()[0])
					});
					for (var k in device.getOutputs()) {
						device.getOutputs()[k].setOn(1); //выходной порт всегда открыт
					}
					// принудительное отключение тестовых устройств, подключенных к Out-port
					//var outNode = port.getOutputs()[0];
					//$.each(outNode.getInputs(), function(i, inNode) {
					//  if (inNode.getOutput() != null) {
					//    inNode.getOutput().disconnectFrom2(inNode);
					//  }
					//} );
				}
				inPort.$ui.on('nodeValueChange', function () {
					outPort.setValue(inPort.getValue());

				});
			});
			var layout = data.layout;
			var cols = layout.cols;
			var rows = layout.rows;
			rows = ~~((Math.max(1, rows) + 1) / 2) * 2;
			cols = ~~((Math.max(1, cols) + 1) / 2) * 2;
			var updateIntf = function (intf, x, y, align) {
				transform(intf.node.$ui, x, y);
				if (!intf.$label) {
					intf.$label = createLabel(intf.label).
						attr('class', 'simcir-node-label');
					enableEvents(intf.$label, false);
					intf.node.$ui.append(intf.$label);
				}
				if (align == 'right') {
					intf.$label.attr('text-anchor', 'start').
					attr('x', 6).
					attr('y', fontSize / 2);
				} else if (align == 'left') {
					intf.$label.attr('text-anchor', 'end').
					attr('x', -6).
					attr('y', fontSize / 2);
				} else if (align == 'top') {
					intf.$label.attr('text-anchor', 'middle').
					attr('x', 0).
					attr('y', -6);
				} else if (align == 'bottom') {
					intf.$label.attr('text-anchor', 'middle').
					attr('x', 0).
					attr('y', fontSize + 6);
				}
			};
			var doLayout = function () {
				var x = 0;
				var y = 0;
				var w = unit * cols / 2;
				var h = unit * rows / 2;
				device.$ui.children('.simcir-device-label').
				attr({
					y: y + h + fontSize
				});
				device.$ui.children('.simcir-device-body').
				attr({
					x: x,
					y: y,
					width: w,
					height: h
				});
				$.each(intfs, function (i, intf) {
					if (layout.nodes[intf.label] &&
						layout.nodes[intf.label].match(/^([TBLR])([0-9]+)$/)) {
						var off = +RegExp.$2 * unit / 2;
						switch (RegExp.$1) {
						case 'T':
							updateIntf(intf, x + off, y, 'bottom');
							break;
						case 'B':
							updateIntf(intf, x + off, y + h, 'top');
							break;
						case 'L':
							updateIntf(intf, x, y + off, 'right');
							break;
						case 'R':
							updateIntf(intf, x + w, y + off, 'left');
							break;
						}
					} else {
						transform(intf.node.$ui, 0, 0);
					}
				});
			};
			device.getSize = function () {
				return {
					width: unit * cols / 2,
					height: unit * rows / 2
				};
			};
			device.$ui.on('dispose', function () {
				$.each($devs, function (i, $dev) {
					$dev.trigger('dispose');
				});
			});
			if (data.layout.hideLabelOnWorkspace) {
				device.$ui.on('deviceAdd', function () {
					device.$ui.children('.simcir-device-label').css('display', 'none');
				}).on('deviceRemove', function () {
					device.$ui.children('.simcir-device-label').css('display', '');
				});
			}
			device.$ui.on('dblclick', function (event) {
				// открыть устройство в библиотеке при двойном нажатии мыши
				event.preventDefault();
				event.stopPropagation();
				showDialog(device.deviceDef.label || device.deviceDef.type,
					setupSimcir($('<div></div>'), data)).on('close', function () {
					$(this).find('.simcir-workspace').trigger('dispose');
				});
			});
			var super_createUI = device.createUI;
			device.createUI = function () {
				super_createUI();
				doLayout();
			};
		};
	};

	var factories = {};
	var defaultToolbox = [];
	var registerDevice = function (type, factory, deprecated) {
		if (typeof factory == 'object') {
			if (typeof factory.layout == 'object') {
				factory = createCustomLayoutDeviceRefFactory(factory);
			} else {
				factory = createDeviceRefFactory(factory);
			}
		}
		factories[type] = factory;
		if (!deprecated) {
			defaultToolbox.push({
				type: type
			});
		}
	};
	  
	//Создание полосы прокрутки
	var createScrollbar = function () {

		// только вертикальный
		var _value = 0;
		var _min = 0;
		var _max = 0;
		var _barSize = 0;
		var _width = 0;
		var _height = 0;

		var $body = createSVGElement('rect');
		var $bar = createSVGElement('g').
			append(createSVGElement('rect')).
			attr('class', 'simcir-scrollbar-bar');
		var $scrollbar = createSVGElement('g').
			attr('class', 'simcir-scrollbar').
			append($body).append($bar).
			on('unitup', function (event) {
				setValue(_value - unit * 2);
			}).on('unitdown', function (event) {
				setValue(_value + unit * 2);
			}).on('rollup', function (event) {
				setValue(_value - _barSize);
			}).on('rolldown', function (event) {
				setValue(_value + _barSize);
			});

		var dragPoint = null;
		var bar_mouseDownHandler = function (event) {
			event.preventDefault();
			event.stopPropagation();
			var pos = transform($bar);
			dragPoint = {
				x: event.pageX - pos.x,
				y: event.pageY - pos.y
			};
			$(document).on('mousemove', bar_mouseMoveHandler);
			$(document).on('mouseup', bar_mouseUpHandler);
		};
		var bar_mouseMoveHandler = function (event) {
			calc(function (unitSize) {
				setValue((event.pageY - dragPoint.y) / unitSize);
			});
		};
		var bar_mouseUpHandler = function (event) {
			$(document).off('mousemove', bar_mouseMoveHandler);
			$(document).off('mouseup', bar_mouseUpHandler);
		};
		$bar.on('mousedown', bar_mouseDownHandler);
		var body_mouseDownHandler = function (event) {
			event.preventDefault();
			event.stopPropagation();
			var off = $scrollbar.parent('svg').offset();
			var pos = transform($scrollbar);
			var y = event.pageY - off.top - pos.y;
			var barPos = transform($bar);
			if (y < barPos.y) {
				$scrollbar.trigger('rollup');
			} else {
				$scrollbar.trigger('rolldown');
			}
		};
		$body.on('mousedown', body_mouseDownHandler);

		var setSize = function (width, height) {
			_width = width;
			_height = height;
			layout();
		};
		var layout = function () {

			$body.attr({
				x: 0,
				y: 0,
				width: _width,
				height: _height
			});

			var visible = _max - _min > _barSize;
			$bar.css('display', visible ? 'inline' : 'none');
			if (!visible) {
				return;
			}
			calc(function (unitSize) {
				$bar.children('rect').
				attr({
					x: 0,
					y: 0,
					width: _width,
					height: _barSize * unitSize
				});
				transform($bar, 0, _value * unitSize);
			});
		};
		var calc = function (f) {
			f(_height / (_max - _min));
		};
		var setValue = function (value) {
			setValues(value, _min, _max, _barSize);
		};
		var setValues = function (value, min, max, barSize) {
			value = Math.max(min, Math.min(value, max - barSize));
			var changed = (value != _value);
			_value = value;
			_min = min;
			_max = max;
			_barSize = barSize;
			layout();
			if (changed) {
				$scrollbar.trigger('scrollValueChange');
			}
		};
		var getValue = function () {
			return _value;
		};
		controller($scrollbar, {
			setSize: setSize,
			setValues: setValues,
			getValue: getValue
		});
		return $scrollbar;
	};

	var getUniqueId = function () {
		var uniqueIdCount = 0;
		return function () {
			return 'simcir-id' + uniqueIdCount++;
		};
	}();
	  
	  
	//******Создание полотна для рисования******
	var createWorkspace = function(data) {

		data = $.extend({
			width: 1400,	//ширина полотна
			height: 600,	//высота полотна
			showToolbox: true,
			editable: true,
			toolbox: defaultToolbox,
			devices: [],
			connectors: [],
		}, data);

		var scope = {};
		var lostNode;	//последний редактируемый узел
		var modeConnect = false;

		var workspaceWidth = data.width;		//задание ширины главного полотна
		var workspaceHeight = data.height;		//задание высоты главного полотна
		var barWidth = unit;
		var toolboxWidth = data.showToolbox? unit * 6 + barWidth : 0;

		var connectorsValid = true;
		var connectorsValidator = function () {
			if (!connectorsValid) {
				clearStatusNode(); //очистить статус
				updateValueNodePressOutput(); //проверить соединение с выходом
				updateValueNodePressSource(); //проверить соединение с источником давления
				updateConnectors(); //обновить коннекторы
				connectorsValid = true;
			}
		};

		var $workspace = createSVG(				//общее полотно
				workspaceWidth, workspaceHeight).
			attr('class', 'simcir-workspace').
			on('SwitchChange', function (event) {
				connectorsValid = false;
				window.setTimeout(connectorsValidator, 0);
			}).
			on('dispose', function () {
				$(this).find('.simcir-device').trigger('dispose');
				$toolboxPane.remove();
				$workspace.remove();
			});

		disableSelection($workspace);

		var $defs = createSVGElement('defs');
		$workspace.append($defs);

		!function () {

			// заполнить отверстие шаблона.
			var patId = getUniqueId();
			var pitch = unit / 2;
			var w = workspaceWidth - toolboxWidth;
			var h = workspaceHeight;

			$defs.append(createSVGElement('pattern').
				attr({
					id: patId,
					x: 0,
					y: 0,
					width: pitch / w,
					height: pitch / h
				}).append(
					createSVGElement('rect').attr('class', 'simcir-pin-hole').
					attr({
						x: 0,
						y: 0,
						width: 1,
						height: 1
					})));

			$workspace.append(createSVGElement('rect').
				attr({
					x: toolboxWidth,
					y: 0,
					width: w,
					height: h
				}).
				css({
					fill: 'url(#' + patId + ')'
				}));
		}();

		var $toolboxDevicePane = createSVGElement('g');
		var $scrollbar = createScrollbar();			//скроллбар
		$scrollbar.on('scrollValueChange', function (event) {
			transform($toolboxDevicePane, 0,
				-controller($scrollbar).getValue());
		});
		controller($scrollbar).setSize(barWidth, workspaceHeight);
		transform($scrollbar, toolboxWidth - barWidth, 0);
		
		//Создание полотна для библиотеки элементов
		var $toolboxPane = createSVGElement('g').	//полотно для библиотеки
			attr('class', 'simcir-toolbox').
			append(createSVGElement('rect').
				attr({
					x: 0,
					y: 0,
					width: toolboxWidth,
					height: workspaceHeight
				})).
			append($toolboxDevicePane).
			append($scrollbar).on('wheel', function (event) {	//формирование событий прокрутки скроллбара
				event.preventDefault();
				var oe = event.originalEvent || event;
				if (oe.deltaY < 0) {
					$scrollbar.trigger('unitup');
				} else if (oe.deltaY > 0) {
					$scrollbar.trigger('unitdown');
				}
			});

		//Создание полотен
		var $devicePane = createSVGElement('g');	//полотно для устройств
		transform($devicePane, toolboxWidth, 0);
		var $connectorPane = createSVGElement('g');	//полотно для коннекторов
		var $temporaryPane = createSVGElement('g');	//временное полотно

		enableEvents($connectorPane, false);
		enableEvents($temporaryPane, false);

		//Добавление полотен на главное полотно
		if (data.showToolbox) {
			$workspace.append($toolboxPane);		//добавить полотно для библиотеки
		}
		$workspace.append($devicePane);				//добавить полотно для устройств
		$workspace.append($connectorPane);			//добавить полотно для коннекторов
		$workspace.append($temporaryPane);			//добавить временное полотно

		//Добавление устройств на полотно
		var addDevice = function ($dev) {
			$devicePane.append($dev);
			$dev.trigger('deviceAdd');
		};

		//Удаление устройств с полотна
		var removeDevice = function ($dev) {
			$dev.trigger('deviceRemove');
			// перед удалением отключите все
			controller($dev).disconnectAll();
			$dev.trigger('dispose');
			clearStatusNode(); //очистить статус
			updateValueNodePressOutput(); //проверить соединение с выходом
			updateValueNodePressSource(); //проверить соединение с источником давления
			updateConnectors(); //обновить коннекторы
		};

		//Не используется функция
		var disconnect = function ($inNode) {
			var inNode = controller($inNode);
			if (inNode.getOutput() != null) {
				inNode.getOutput().disconnectFrom(inNode);
			}
			clearStatusNode(); //очистить статус
			updateValueNodePressOutput(); //проверить соединение с выходом
			updateValueNodePressSource(); //проверить соединение с источником давления
			updateConnectors(); //обновить коннекторы
		};

		//Функция обновления коннекторов															 
		var updateConnectors = function() {
			$connectorPane.children().remove();	//удаление всех коннекторов с панели коннекторов
			$devicePane.children('.simcir-device').each(function() {	//панель устройств
				var device = controller($(this) );
			
			/*//Добавление коннектора из 'in' узла	
			$.each(device.getInputs(), function(i, inNode) {
			  
			  if (inNode.getOutput() != null) { 
				if (inNode != inNode.getOutput()) {		//проверка на соединение коннектора с одним и тем же узлом
					var p1 = offset(inNode.$ui);
					var p2 = offset(inNode.getOutput().$ui);
					var $conn = createConnector(p1.x, p1.y, p2.x, p2.y);	//создать коннектор с координатами p1.x, p1.y, p2.x, p2.y
					if (inNode.getValue() == 1 && inNode.getOutput().getValue() == 1) {	//если не равно 0, присвоить класс подключено
					  $conn.addClass('simcir-connector-hot');
					}
					if (inNode.getStatus() == 2 && inNode.getOutput().getStatus() == 2) {	//если не равно 0, присвоить класс подключено
					  $conn.addClass('simcir-connector-isolated');
					}
					$connectorPane.append($conn);	//добавление коннектора на панель коннекторов
				}
			  }  
			});
			//Добавление коннектора из 'out' узла
			$.each(device.getOutputs(), function(i, inNode) {
			
			  if (inNode.getOutput() != null) {
				if (inNode != inNode.getOutput()) {		//проверка на соединение коннектора с одним и тем же узлом
					var p1 = offset(inNode.$ui);
					var p2 = offset(inNode.getOutput().$ui);
					var $conn = createConnector(p1.x, p1.y, p2.x, p2.y);	//создать коннектор с координатами p1.x, p1.y, p2.x, p2.y
					if (inNode.getValue() == 1 && inNode.getOutput().getValue() == 1) {	//если не равно 0, присвоить класс подключено
					  $conn.addClass('simcir-connector-hot');
					}
					if (inNode.getStatus() == 2 && inNode.getOutput().getStatus() == 2) {	//если не равно 0, присвоить класс подключено
					  $conn.addClass('simcir-connector-isolated');
					}
					$connectorPane.append($conn);	//добавление коннектора на панель коннекторов
				}
			  }  
			});*/
			

				//Добавление коннектора из 'in' узла	тестирование
				$.each(device.getInputs(), function(i, inNode) {
				//console.log("inNodeX:", inNode.inputsPointX);
				//console.log("inNodeY:", inNode.inputsPointY);
					for (var k in inNode.getOutput2()) {
						if (inNode.getOutput2()[k] != null) {
							if (inNode != inNode.getOutput2()[k]) { //проверка на соединение коннектора с одним и тем же узлом
								var p1 = offset(inNode.$ui);
								var p2 = offset(inNode.getOutput2()[k].$ui);
								var $conn = createConnector(p1.x, p1.y, p2.x, p2.y); //создать коннектор с координатами p1.x, p1.y, p2.x, p2.y
								if (inNode.getValue() == 1 && inNode.getOutput2()[k].getValue() == 1) { //если не равно 0, присвоить класс подключено
									$conn.addClass('simcir-connector-hot');
								}
								if (inNode.getStatus() == 2 && inNode.getOutput2()[k].getStatus() == 2) { //если не равно 0, присвоить класс подключено
									$conn.addClass('simcir-connector-isolated');
								}
								$connectorPane.append($conn); //добавление коннектора на панель коннекторов
							}
						}
					}
				});


				
				//Добавление коннектора из 'out' узла	тестирование
				$.each(device.getOutputs(), function (i, inNode) {
				//console.log("inNodeX2:", inNode.inputsPointX);
				//console.log("inNodeY2:", inNode.inputsPointY);
					//Рисование линий не присоединенных к конечному узлу
					if (modeConnect) {
						var p1 = offset(inNode.$ui);
						var Xe = p1.x;
						var Ye = p1.y;
							for (let i = 0; i < inNode.inputsPointX.length; i++) {
								var $conn = createConnector(Xe, Ye, inNode.inputsPointX[i], inNode.inputsPointY[i]); //создать коннектор с координатами
								$connectorPane.append($conn); //добавление коннектора на панель коннекторов
								Xe = inNode.inputsPointX[i];
								Ye = inNode.inputsPointY[i];
							}
					}
					//---------------------------------------------------
					
					for (var k in inNode.getOutput2()) {
						if (inNode.getOutput2()[k] != null) {
							if (inNode != inNode.getOutput2()[k]) { //проверка на соединение коннектора с одним и тем же узлом
								var p1 = offset(inNode.$ui);
								var p2 = offset(inNode.getOutput2()[k].$ui);
								var Xe = p1.x;
								var Ye = p1.y;
								
								for (var i in inNode.getToPointX()) {
									var $conn = createConnector(Xe, Ye, inNode.getToPointX()[i], inNode.getToPointY()[i]); //создать коннектор с координатами
									if (inNode.getValue() == 1 && inNode.getOutput2()[k].getValue() == 1) { //если не равно 0, присвоить класс подключено
										$conn.addClass('simcir-connector-hot');
									}
									if (inNode.getStatus() == 2 && inNode.getOutput2()[k].getStatus() == 2) { //если не равно 0, присвоить класс подключено
										$conn.addClass('simcir-connector-isolated');
									}
									$connectorPane.append($conn); //добавление коннектора на панель коннекторов
									Xe = inNode.getToPointX()[i];
									Ye = inNode.getToPointY()[i];
									console.log(i, "getToPointX:", inNode.getToPointX());
									console.log(i, "getToPointY:", inNode.getToPointY());
								}
								
								var $conn = createConnector(Xe, Ye, p2.x, p2.y); //создать коннектор с координатами (рисование последней линии)
								if (inNode.getValue() == 1 && inNode.getOutput2()[k].getValue() == 1) { //если не равно 0, присвоить класс подключено
										$conn.addClass('simcir-connector-hot');
									}
									if (inNode.getStatus() == 2 && inNode.getOutput2()[k].getStatus() == 2) { //если не равно 0, присвоить класс подключено
										$conn.addClass('simcir-connector-isolated');
									}
									$connectorPane.append($conn); //добавление коннектора на панель коннекторов
							}
						}

						
					}
					


				});

		
				
				
				
			});
		};

		var clearStatusNode = function () {
			$devicePane.children('.simcir-device').each(function () { //панель устройств
				var device = controller($(this));

				//Входные узлы очистка статуса (присваивание статуса 2 - изолированный участок)
				$.each(device.getInputs(), function (i, inNode) {
					if (device.getInputs()[0] != null) {
						if (device.getInputs()[0].getOn() == 4) { //связь со свечой
							inNode.setStatus(0);
							inNode.setValue(0);
						} else {
							inNode.setStatus(2);
						}
					}
				});

				//Выходные узлы очистка статуса (присваивание статуса 2 - изолированный участок)
				$.each(device.getOutputs(), function (i, inNode) {
					if (device.getOutputs()[0] != null) {
						if (device.getOutputs()[0].getOn() == 3) { //связь с источником
							inNode.setStatus(1);
							inNode.setValue(1);
						} else {
							inNode.setStatus(2);
						}
					}
				});
			});
		};

		//Функция проверки и обновления значений узлов	начиная от выхода (свечи)													 
		var updateValueNodePressOutput = function() {
			var changeStatus;

			do {
				changeStatus = false;
				$devicePane.children('.simcir-device').each(function () { //панель устройств
					var device = controller($(this));

					//Входные узлы
					$.each(device.getInputs(), function (i, inNode) {

						for (var k in inNode.getOutput2()) {
							if (inNode.getOutput2()[k] != null) {

								//Установка статуса и нет давления  (узел <-- узел вход)
								if (inNode.getStatus() == 0) { //связь со свечой
									inNode.getOutput2()[k].setStatus(0); //присвоить статус
									if (inNode.getOutput2()[k].getValue() != 0) { //проверка на изменение
										inNode.getOutput2()[k].setValue(0); //присвоить отсутствие давления
										changeStatus = true; //изменение есть
									}
								}

								//Установка статуса и нет давления  (узел вход <-- узел)
								if (device.getOutputs()[0] != null) {
									if (inNode.getOutput2()[k].getStatus() == 0 && device.getOutputs()[0].getOn() != 3) { //связь со свечой
										inNode.setStatus(0); //присвоить статус
										if (inNode.getValue() != 0) { //проверка на изменение
											inNode.setValue(0); //присвоить отсутствие давления
											changeStatus = true; //изменение есть
										}
									}
								}

								/*console.log('Node:', inNode.getOutput2() [k].$ui);
								console.log('value:', inNode.getOutput2() [k] .getValue(), 'status:', inNode.getOutput2() [k] .getStatus());
								console.log('Node:', inNode.$ui);
								console.log('value:', inNode.getValue(), 'status:', inNode.getStatus());
								console.log('************************');*/

							};
						}

					});

					//Выходные узлы
					$.each(device.getOutputs(), function (i, inNode) {

						for (var k in inNode.getOutput2()) {

							if (inNode.getOutput2()[k] != null) {

								//Установка статуса и нет давления  (узел <-- узел выход)
								if (inNode.getStatus() == 0) { //связь со свечой
									inNode.getOutput2()[k].setStatus(0); //присвоить статус
									if (inNode.getOutput2()[k].getValue() != 0) { //проверка на изменение
										inNode.getOutput2()[k].setValue(0); //присвоить отсутствие давления
										changeStatus = true; //изменение есть
									}
								}

								//Установка статуса и нет давления  (узел выход <-- узел)
								if (inNode.getOutput2()[k].getStatus() == 0 && device.getOutputs()[0].getOn() != 3) { //связь со свечой
									inNode.setStatus(0); //присвоить статус
									if (inNode.getValue() != 0) { //проверка на изменение
										inNode.setValue(0); //присвоить отсутствие давления
										changeStatus = true; //изменение есть
									}
								}

								/*console.log('Node:', inNode.getOutput().$ui[0]);
								console.log('value:', inNode.getOutput().getValue(), 'status:', inNode.getOutput().getStatus());
								console.log('Node:', inNode.$ui[0]);
								console.log('value:', inNode.getValue(), 'status:', inNode.getStatus());
								console.log('************************');*/
							};
						}
					});

					for (var k in device.getInputs()) {
						if (device.getInputs()[k] != null) {
							//console.log('device.getInputs (свеча):', device.getInputs());
							if (device.getInputs()[k].getStatus() == 0 && device.getInputs()[k].getOn() == 1) { //если открыто и соединение со свечой
								if (device.getOutputs()[k].getStatus() != 0) { //проверка на изменение
									device.getOutputs()[k].setStatus(0); //присвоить выходу устройства статус соединения со свечой
									device.getOutputs()[k].setValue(0); //присвоить отсутствие давления
									changeStatus = true; //изменение есть
								}
							}
						}
					}

					for (var k in device.getOutputs()) {
						if (device.getOutputs()[k] != null) {
							//console.log('device.getOutputs (свеча):', device.getOutputs());
							if (device.getOutputs()[k].getStatus() == 0 && device.getOutputs()[k].getOn() == 1) { //если открыто и соединение со свечой
								if (device.getInputs()[k].getStatus() != 0) { //проверка на изменение
									device.getInputs()[k].setStatus(0); //присвоить входу устройства статус соединения со свечой
									device.getInputs()[k].setValue(0); //присвоить отсутствие давления
									changeStatus = true; //изменение есть
								}
							}
						}
					}

				});

				/*console.log('changeStatus1:', changeStatus);*/
			} while (changeStatus); //выполнять пока есть изменения
			/*console.log('Выполнено');	//изменений нет*/
		};

		//Функция проверки и обновления значений узлов	начиная от входа (источника давления)														 
		var updateValueNodePressSource = function() {
			var changeStatus;

			do {
				changeStatus = false;
				$devicePane.children('.simcir-device').each(function () { //панель устройств
					var device = controller($(this));

					//Входные узлы
					$.each(device.getInputs(), function (i, inNode) {

						for (var k in inNode.getOutput2()) {

							if (inNode.getOutput2()[k] != null) {

								//Установка статуса и давления  (узел <-- узел вход)
								if (inNode.getStatus() == 1) { //связь с источником
									inNode.getOutput2()[k].setStatus(1); //присвоить статус
									if (inNode.getOutput2()[k].getValue() != 1) { //проверка на изменение
										inNode.getOutput2()[k].setValue(1); //присвоить присутствие давления
										changeStatus = true; //изменение есть
									}
								}

								//Установка статуса и давления  (узел вход <-- узел)
								if (inNode.getOutput2()[k].getStatus() == 1) { //связь с источником
									inNode.setStatus(1); //присвоить статус
									if (inNode.getValue() != 1) { //проверка на изменение
										inNode.setValue(1); //присвоить присутствие давления
										changeStatus = true; //изменение есть
									}
								}

								/*console.log('Node:', inNode.getOutput().$ui[0]);
								console.log('value:', inNode.getOutput().getValue(), 'status:', inNode.getOutput().getStatus());
								console.log('Node:', inNode.$ui[0]);
								console.log('value:', inNode.getValue(), 'status:', inNode.getStatus());
								console.log('************************');*/
							};
						}
					});

					//Выходные узлы
					$.each(device.getOutputs(), function (i, inNode) {

						for (var k in inNode.getOutput2()) {
							if (inNode.getOutput2()[k] != null) {

								//Установка статуса и давления  (узел <-- узел выход)
								if (inNode.getStatus() == 1) { //связь с источником
									inNode.getOutput2()[k].setStatus(1); //присвоить статус
									if (inNode.getOutput2()[k].getValue() != 1) { //проверка на изменение
										inNode.getOutput2()[k].setValue(1); //присвоить присутствие давления
										changeStatus = true; //изменение есть
									}
								}
								//Установка статуса и давления  (узел выход <-- узел)
								if (inNode.getOutput2()[k].getStatus() == 1) { //связь с источником
									inNode.setStatus(1); //присвоить статус
									if (inNode.getValue() != 1) { //проверка на изменение
										inNode.setValue(1); //присвоить присутствие давления
										changeStatus = true; //изменение есть
									}
								}

								/*console.log('Node:', inNode.getOutput().$ui[0]);
								console.log('value:', inNode.getOutput().getValue(), 'status:', inNode.getOutput().getStatus());
								console.log('Node:', inNode.$ui[0]);
								console.log('value:', inNode.getValue(), 'status:', inNode.getStatus());
								console.log('************************');*/
							};
						}
					});

					//Переход через устройство, когда оно открыто (от входного узла)
					for (var k in device.getInputs()) {
						if (device.getInputs()[k] != null) {
							//console.log('device.getInputs (давление):', device.getInputs());
							if (device.getInputs()[k].getStatus() == 1 && device.getInputs()[k].getOn() == 1) { //если открыто и соединение с источником
								if (device.getOutputs()[k].getStatus() != 1) { //проверка на изменение
									device.getOutputs()[k].setStatus(1); //присвоить выходу устройства статус соединения с источником
									device.getOutputs()[k].setValue(1); //присвоить присутствие давления
									changeStatus = true; //изменение есть
								}

							}
						}
					}

					//Переход через устройство, когда оно открыто (от выходного узла)
					for (var k in device.getOutputs()) {
						if (device.getOutputs()[k] != null) {
							//console.log('device.getOutputs (давление):', device.getOutputs());
							if (device.getOutputs()[k].getStatus() == 1 && device.getOutputs()[k].getOn() == 1) { //если открыто и соединение с источником
								if (device.getInputs()[k].getStatus() != 1) { //проверка на изменение
									device.getInputs()[k].setStatus(1); //присвоить входу устройства статус соединения с источником
									device.getInputs()[k].setValue(1); //присвоить присутствие давления
									changeStatus = true; //изменение есть
								}
							}
						}
					}
				});
				/*console.log('changeStatus2:', changeStatus);*/
			} while (changeStatus);
			/*console.log('Выполнено');*/
		};

		var loadToolbox = function (data) {
			var vgap = 8;
			var y = vgap;
			$.each(data.toolbox, function (i, deviceDef) {
				var $dev = createDevice(deviceDef);
				$toolboxDevicePane.append($dev);
				var size = controller($dev).getSize();
				transform($dev, (toolboxWidth - barWidth - size.width) / 2, y);
				y += (size.height + fontSize + vgap);
			});
			controller($scrollbar).setValues(0, 0, y, workspaceHeight);
		};
		
		//======Получить данные о всех устройствах======
		var getData = function() {

			//------Перенумеровать все идентификаторы------
			var devIdCount = 0;
			$devicePane.children('.simcir-device').each(function () {
				var $dev = $(this);
				var device = controller($dev);
				var devId = 'dev' + devIdCount++;
				device.id = devId;
				$.each(device.getInputs(), function (i, node) {
					node.id = devId + '.in' + i;
				});
				$.each(device.getOutputs(), function (i, node) {
					node.id = devId + '.out' + i;
				});
			});
			//----------------------------------------------


			var toolbox = [];
			var devices = [];
			var connectors = [];
			var clone = function (obj) {
				return JSON.parse(JSON.stringify(obj));
			};
			$toolboxDevicePane.children('.simcir-device').each(function () {
				var $dev = $(this);
				var device = controller($dev);
				toolbox.push(device.deviceDef);
			});
			$devicePane.children('.simcir-device').each(function () {
				var $dev = $(this);
				var device = controller($dev);
				$.each(device.getInputs(), function (i, inNode) {
					for (var k in inNode.getOutput2()) {
						if (inNode.getOutput2()[k] != null) {
							connectors.push({
								from: inNode.id,
								to: inNode.getOutput2()[k].id
							});
						}
					}
				});

				$.each(device.getOutputs(), function (i, inNode) {
					for (var k in inNode.getOutput2()) {
						if (inNode.getOutput2()[k] != null) {
							connectors.push({
								from: inNode.id,
								to: inNode.getOutput2()[k].id
							});
						}
					}
				});

				var pos = transform($dev);
				var deviceDef = clone(device.deviceDef);
				deviceDef.id = device.id;
				deviceDef.x = pos.x;
				deviceDef.y = pos.y;
				deviceDef.label = device.getLabel();
				var state = device.getState();
				if (state != null) {
					deviceDef.state = state;
				}
				devices.push(deviceDef);
			});
			return {
				width: data.width,
				height: data.height,
				showToolbox: data.showToolbox,
				editable: data.editable,
				toolbox: toolbox,
				devices: devices,
				connectors: connectors
			};
		};
		//============================================
		
		var getText = function () {

			var data = getData();

			var buf = '';
			var print = function (s) {
				buf += s;
			};
			var println = function (s) {
				print(s);
				buf += '\r\n';
			};
			var printArray = function (array) {
				$.each(array, function (i, item) {
					println('    ' + JSON.stringify(item).
						replace(/</g, '\\u003c').replace(/>/g, '\\u003e') +
						(i + 1 < array.length ? ',' : ''));
				});
			};
			println('{');
			println('  "width":' + data.width + ',');
			println('  "height":' + data.height + ',');
			println('  "showToolbox":' + data.showToolbox + ',');
			println('  "toolbox":[');
			printArray(data.toolbox);
			println('  ],');
			println('  "devices":[');
			printArray(data.devices);
			println('  ],');
			println('  "connectors":[');
			printArray(data.connectors);
			println('  ]');
			print('}');
			return buf;
		};

		//-------------------------------------------
		
		// операции с мышью
		var dragMoveHandler = null;
		var dragCompleteHandler = null;
		var adjustDevice = function ($dev) {
			var pitch = unit / 2;	//размер сетки привязки
			var adjust = function (v) {
				return Math.round(v / pitch) * pitch;	//привязка к сетке координат
			};
			var pos = transform($dev);
			var size = controller($dev).getSize();
			var x = Math.max(0, Math.min(pos.x,
						workspaceWidth - toolboxWidth - size.width));
			var y = Math.max(0, Math.min(pos.y,
						workspaceHeight - size.height));
			transform($dev, adjust(x), adjust(y));
		};
		
		//Операции с коннекторами
		var beginConnect = function (event, $target) {
			var $srcNode = $target.closest('.simcir-node');
			var off = $workspace.offset();
			var pos = offset($srcNode);
			var device = controller($srcNode);
			
			//Мешает подключаться от out узла к другим узлам
			/*if ($srcNode.attr('simcir-node-type') == 'in') {
			disconnect($srcNode);
			}*/
			dragMoveHandler = function (event) {
				var x = event.pageX - off.left;
				var y = event.pageY - off.top;
				$temporaryPane.children().remove();
				var Xe = pos.x;
				var Ye = pos.y;
				if (device.inputsPointX != null && device.inputsPointX.length > 0) {
					var Xe = device.inputsPointX[device.inputsPointX.length - 1];
					var Ye = device.inputsPointY[device.inputsPointY.length - 1];
				}
				$temporaryPane.append(createConnector(Xe, Ye, x, y)); //рисовать коннектор с координатами (рисование последней линии)
				modeConnect = true;
			};
			
			dragCompleteHandler = function (event) {
				var x = event.pageX - off.left;
				var y = event.pageY - off.top;
				$temporaryPane.children().remove();
				var $dst = $(event.target);
				if (isActiveNode($dst)) {
					var $dstNode = $dst.closest('.simcir-node');
					connect($srcNode, $dstNode); //соединить узлы коннектором
					clearStatusNode(); //очистить статус
					updateValueNodePressOutput(); //проверить соединение с выходом
					updateValueNodePressSource(); //проверить соединение с источником давления
					modeConnect = false;
					updateConnectors(); //обновить коннекторы
				} else {
					//connectPoint($srcNode, x, y);	//соединить точки коннектора
					modeConnect = true;
					//lostNode = $srcNode;
					updateConnectors(); //обновить коннекторы

				};
			};
		};
		
		//------Выбор мыши при перетаскивании элемента на полотно из библиотеки------
		var beginNewDevice = function (event, $target) {
			var $dev = $target.closest('.simcir-device');
			var pos = offset($dev);
			$dev = createDevice(controller($dev).deviceDef, false, scope);
			transform($dev, pos.x, pos.y);
			$temporaryPane.append($dev);
			var dragPoint = {
				x: event.pageX - pos.x,
				y: event.pageY - pos.y
			};
			dragMoveHandler = function (event) {
				transform($dev,
					event.pageX - dragPoint.x,
					event.pageY - dragPoint.y);
			};
			dragCompleteHandler = function (event) {
				var $target = $(event.target);
				if ($target.closest('.simcir-toolbox').length == 0) {
					$dev.detach();
					var pos = transform($dev);
					transform($dev, pos.x - toolboxWidth, pos.y);
					adjustDevice($dev);
					addDevice($dev);
				} else {
					$dev.trigger('dispose');
				}
			};
		};
		//-----------------------------------------------------------------------------
		
		//Выбор элементов рамкой на полотне
		var $selectedDevices = [];
		var addSelected = function ($dev) {
			controller($dev).setSelected(true);
			$selectedDevices.push($dev);
		};
		var deselectAll = function () {
			$devicePane.children('.simcir-device').each(function () {
				controller($(this)).setSelected(false);
			});
			$selectedDevices = [];
		};
		
		//------Выбор мыши при перетаскивании элемента по полотну------
		var beginMoveDevice = function (event, $target) {
			var $dev = $target.closest('.simcir-device');
			var pos = transform($dev);
			if (!controller($dev).isSelected()) {
				deselectAll();
				addSelected($dev);
				// спереди.
				$dev.parent().append($dev.detach());
			}

			var dragPoint = {
				x: event.pageX - pos.x,
				y: event.pageY - pos.y
			};
			dragMoveHandler = function (event) {
				// отключить события при перетаскивании.
				enableEvents($dev, false);
				var curPos = transform($dev);
				var deltaPos = {
					x: event.pageX - dragPoint.x - curPos.x,
					y: event.pageY - dragPoint.y - curPos.y
				};
				$.each($selectedDevices, function (i, $dev) {
					var curPos = transform($dev);
					transform($dev,
						curPos.x + deltaPos.x,
						curPos.y + deltaPos.y);
				});
				updateConnectors(); //обновить коннекторы
			};
			dragCompleteHandler = function (event) {
				var $target = $(event.target);
				enableEvents($dev, true);
				$.each($selectedDevices, function (i, $dev) {
					if ($target.closest('.simcir-toolbox').length == 0) {
						adjustDevice($dev);
						updateConnectors(); //обновить коннекторы
					} else {
						removeDevice($dev); //удаление устройства с полотна
					}
				});
			};
		};
		//-----------------------------------------------------------------
		
		//Есть ли выбор элемента мышкой?
		var beginSelectDevice = function (event, $target) {
			var intersect = function (rect1, rect2) {
				return !(
					rect1.x > rect2.x + rect2.width ||
					rect1.y > rect2.y + rect2.height ||
					rect1.x + rect1.width < rect2.x ||
					rect1.y + rect1.height < rect2.y);
			};
			var pointToRect = function (p1, p2) {
				return {
					x: Math.min(p1.x, p2.x),
					y: Math.min(p1.y, p2.y),
					width: Math.abs(p1.x - p2.x),
					height: Math.abs(p1.y - p2.y)
				};
			};
			deselectAll();
			var off = $workspace.offset();
			var pos = offset($devicePane);
			var p1 = {
				x: event.pageX - off.left,
				y: event.pageY - off.top
			};
			dragMoveHandler = function (event) {

				deselectAll();
				var p2 = {
					x: event.pageX - off.left,
					y: event.pageY - off.top
				};
				var selRect = pointToRect(p1, p2);
				$devicePane.children('.simcir-device').each(function () {
					var $dev = $(this);
					var devPos = transform($dev);
					var devSize = controller($dev).getSize();
					var devRect = {
						x: devPos.x + pos.x,
						y: devPos.y + pos.y,
						width: devSize.width,
						height: devSize.height
					};
					if (intersect(selRect, devRect)) {
						addSelected($dev);
					}
				});
				$temporaryPane.children().remove();
				$temporaryPane.append(createSVGElement('rect').
					attr(selRect).
					attr('class', 'simcir-selection-rect'));
			};
		};
		//Нажата клавиша мыши
		var mouseDownHandler = function (event) {
			event.preventDefault();
			event.stopPropagation();
			var $target = $(event.target);
			if (!data.editable) {
				return;
			}
			if (isActiveNode($target)) {
				beginConnect(event, $target);		//Производится соединение с другим устройством (через коннекторы)
			} else if ($target.closest('.simcir-device').length == 1) {
				if ($target.closest('.simcir-toolbox').length == 1) {
					beginNewDevice(event, $target);		//Новое устройство
				} else {
					beginMoveDevice(event, $target);	//Перемещение устройства
				}
			} else {
				beginSelectDevice(event, $target);		//Выбор устройства
			}
			if (modeConnect) {
				beginConnect(event, lostNode);		//Производится соединение с другим устройством (через коннекторы)
			}	
			console.log(modeConnect)
			$(document).on('mousemove', mouseMoveHandler);
			$(document).on('mouseup', mouseUpHandler);

		};
		//Перемещение мыши		
		var mouseMoveHandler = function (event) {
			if (dragMoveHandler != null) {	//Если есть перемещение объекта мышью
				dragMoveHandler(event);
			}

		};
		//Отжата клавиша мыши		
		var mouseUpHandler = function (event) {
			if (dragCompleteHandler != null) {
				dragCompleteHandler(event);
			}
			dragMoveHandler = null;
			dragCompleteHandler = null;
			$devicePane.children('.simcir-device').each(function () {
				enableEvents($(this), true);
			});
			$temporaryPane.children().remove();
			$(document).off('mousemove', mouseMoveHandler);
			$(document).off('mouseup', mouseUpHandler);
		};
		$workspace.on('mousedown', mouseDownHandler);

		//-------------------------------------------
		//

		loadToolbox(data);
		$.each(buildCircuit(data, false, scope), function(i, $dev) {
			addDevice($dev);
		});
		
		updateConnectors();	//обновить коннекторы
		controller($workspace, {
			data: getData,
			text: getText
		});

		return $workspace;
	};

	//****************************************************************
	var clearSimcir = function ($placeHolder) {
		$placeHolder = $($placeHolder[0]);
		$placeHolder.find('.simcir-workspace').trigger('dispose');
		$placeHolder.children().remove();
		return $placeHolder;
	};

	var setupSimcir = function ($placeHolder, data) {

		$placeHolder = clearSimcir($placeHolder);

		var $workspace = simcir.createWorkspace(data);
		var $dataArea = $('<textarea></textarea>').
			addClass('simcir-json-data-area').
			attr('readonly', 'readonly').
			css('width', $workspace.attr('width') + 'px').
			css('height', $workspace.attr('height') + 'px');
		var showData = false;
		var toggle = function () {
			$workspace.css('display', !showData ? 'inline' : 'none');
			$dataArea.css('display', showData ? 'inline' : 'none');
			if (showData) {
				$dataArea.val(controller($workspace).text()).focus();
			}
			showData = !showData;
		};
		$placeHolder.text('');
		$placeHolder.append($('<div></div>').
			addClass('simcir-body').
			append($workspace).
			append($dataArea).
			on('click', function (event) {
				if (event.ctrlKey || event.metaKey) {
					toggle();
				}

			}));
		toggle();
		return $placeHolder;
	};

	var setupSimcirDoc = function ($placeHolder) {
		var $table = $('<table><tbody></tbody></table>').
			addClass('simcir-doc-table');
		$.each(defaultToolbox, function (i, deviceDef) {
			var $dev = createDevice(deviceDef);
			var device = controller($dev);
			if (!device.doc) {
				return;
			}
			var doc = $.extend({
				description: '',
				params: []
			}, device.doc);
			var size = device.getSize();

			var $tr = $('<tr></tr>');
			var hgap = 32;
			var vgap = 8;
			var $view = createSVG(size.width + hgap * 2,
					size.height + vgap * 2 + fontSize);
			var $dev = createDevice(deviceDef);
			transform($dev, hgap, vgap);

			$view.append($dev);
			$tr.append($('<td></td>').css('text-align', 'center').append($view));
			var $desc = $('<td></td>');
			$tr.append($desc);

			if (doc.description) {
				$desc.append($('<span></span>').
					text(doc.description));
			}

			$desc.append($('<div>Params</div>').addClass('simcir-doc-title'));
			var $paramsTable = $('<table><tbody></tbody></table>').
				addClass('simcir-doc-params-table');
			$paramsTable.children('tbody').append($('<tr></tr>').
				append($('<th>Name</th>')).
				append($('<th>Type</th>')).
				append($('<th>Default</th>')).
				append($('<th>Description</th>')));
			$paramsTable.children('tbody').append($('<tr></tr>').
				append($('<td>type</td>')).
				append($('<td>string</td>')).
				append($('<td>-</td>').
					css('text-align', 'center')).
				append($('<td>"' + deviceDef.type + '"</td>')));
			if (!doc.labelless) {
				$paramsTable.children('tbody').append($('<tr></tr>').
					append($('<td>label</td>')).
					append($('<td>string</td>')).
					append($('<td>same with type</td>').css('text-align', 'center')).
					append($('<td>label for a device.</td>')));
			}
			if (doc.params) {
				$.each(doc.params, function (i, param) {
					$paramsTable.children('tbody').append($('<tr></tr>').
						append($('<td></td>').text(param.name)).
						append($('<td></td>').text(param.type)).
						append($('<td></td>').css('text-align', 'center').
							text(param.defaultValue)).
						append($('<td></td>').text(param.description)));
				});
			}
			$desc.append($paramsTable);

			if (doc.code) {
				$desc.append($('<div>Code</div>').addClass('simcir-doc-title'));
				$desc.append($('<div></div>').
					addClass('simcir-doc-code').text(doc.code));
			}

			$table.children('tbody').append($tr);
		});

		$placeHolder.append($table);
	};

	$(function () {
		$('.simcir').each(function () {
			var $placeHolder = $(this);
			var text = $placeHolder.text().replace(/^\s+|\s+$/g, '');
			setupSimcir($placeHolder, JSON.parse(text || '{}'));
		});
	});

	$(function () {
		$('.simcir-doc').each(function () {
			setupSimcirDoc($(this));
		});
	});

	$.extend($s, {
		registerDevice: registerDevice,
		clearSimcir: clearSimcir,
		setupSimcir: setupSimcir,
		createWorkspace: createWorkspace,
		createSVGElement: createSVGElement,
		offset: offset,
		transform: transform,
		enableEvents: enableEvents,
		graphics: graphics,
		controller: controller,
		unit: unit
	});
}(simcir);


