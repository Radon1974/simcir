//
// SimcirJS - library
//
// Copyright (c) 2014 Kazuhiko Arase
//
// URL: http://www.d-project.com/
//
// Licensed under the MIT license:
//  http://www.opensource.org/licenses/mit-license.php
//

// включает следующие типы устройств:
//  RS-FF

simcir.registerDevice('Блок',
{
  "width":370,
  "height":240,
  "showToolbox":true,
  "toolbox":[
    {"type":"Вход"},
    {"type":"Выход"},
    {"type":"Соединитель"},
    {"type":"Кран"},
    {"type":"Компрессор"},
    {"type":"Свеча"}
  ],
  "devices":[
    {"type":"Выход","id":"dev0","x":168,"y":48,"label":"D"},
    {"type":"Вход","id":"dev1","x":32,"y":48,"label":"A"},
    {"type":"Соединитель","id":"dev2","x":104,"y":56,"label":"Соединитель","state":{"direction":0}},
    {"type":"Соединитель","id":"dev3","x":104,"y":120,"label":"Соединитель","state":{"direction":0}},
    {"type":"Вход","id":"dev4","x":32,"y":112,"label":"B"},
    {"type":"Выход","id":"dev5","x":168,"y":112,"label":"C"}
  ],
  "connectors":[
    {"from":"dev1.out0","to":"dev2.in0"},
    {"from":"dev2.in0","to":"dev0.in0"},
    {"from":"dev3.in0","to":"dev5.in0"},
    {"from":"dev4.out0","to":"dev3.in0"}
  ]
}
);

