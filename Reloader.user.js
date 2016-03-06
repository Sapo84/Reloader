// ==UserScript==
// @name        Reloader
// @namespace   HVRLD3
// @author      nihilvoid, Dan31
// @run-at      document-start
// @include     http://hentaiverse.org/*
// @version     1.3
// @grant       none
// ==/UserScript==

//Vanilla Reloader: http://forums.e-hentai.org/index.php?s=&showtopic=65126&view=findpost&p=4259841

//Select a custom font in your settings: http://hentaiverse.org/?s=Character&ss=se
//Example: Cambria/9/bold/normal/-4

//TODO (development):
//- fix battlelog append
//- add Hoheneim's additions
//- fix round counter display at end of battle serie
//- add support for browsers other than Firefox (-> update mousemelee)

//Change your settings here
var settings = {
	//Hide the Welcome to the Hentaiverse image
	hideWelcome: true,
	//Disable buff/debuff blinking
	noBlinking: true,
	//Show buff/debuff durations
	effectDurations: true,
	//Show gem, click on icon to use
	gemIcon: true,
	//Show current round
	roundCounter: true,
	//Change the default action to a T1 spell
	//No change: 0, Fiery Blast: 1, Freeze: 2, Shockblast: 3, Gale: 4, Smite: 5, Corruption: 6
	defaultAction: 0,
	//Enable Mousemelee, disable it on conditions (minHP = 0.4 means disabled when HP under 40%, etc.)
	mouseMelee: true,
	minHP: 0.4,
	minMP: 0.12,
	minSP: 0.3,
	stopWhenChanneling: true,
	//Show the battle log
	battleLog: true,
	//battleLogAppend: false,//disabled for now (need to redo this without jQuery)
	//Auto-advance to next round on round clear after set time (ms)
	skipToNextRound: true,
	popupTime: 0,
	showPopup: false,
	//Enable HV Counter Plus (show turns, speed, time, exp, credits at the end of a battle serie)
	counterPlus: true
};

//-----------------------------------------------------------------------------------------------------------------

document.title = 'HV'; //Change page title to 'HV'
var sheet = document.createElement('style');
//style for round counter and effect duration
sheet.innerHTML = '#round{position:absolute;left:1080px;top:15px;width:120px;font-size:20px;font-weight:bold;z-index:10;text-align:right}.duration{width:30px;display:inline-block;text-align:center;position:relative;margin-left:-30px;top:-4px}.duration>div{background:white;border:1px solid black;padding:0 2px;display:inline-block;min-width:8px;font-weight:bold;height:13px}';
if (!settings.battleLog) {
	//Hide the battle log
	sheet.innerHTML += "#togpane_log {display: none}";
}
if (settings.hideWelcome) {
	//Hide the 'Welcome to the Hentaiverse' image.
	sheet.innerHTML += 'img.cw{display: none}.cbl:nth-of-type(1){padding-top:114px}';
}
document.head.appendChild(sheet);

//### No blinking script ###
//Disables buff/debuff blinking
if (settings.noBlinking) {
	window.addEventListener('beforescriptexecute', function(e) {
		if (/battle\.set_infopane\("Battle Time"\)/.test(e.target.innerHTML)) {
			e.preventDefault();
			window.removeEventListener(e.type, arguments.callee, true);
		}
	}, true);
};
//### No blinking script - end ###

function OnPageReload() {
	// Reinitialize the battle manager
	window.battle = new window.Battle;
	window.battle.clear_infopane();

	// TODO: Anything that needs to trigger when a new battle page starts should go here
	//   i.e. Stat tracking, log parsing, battle-UI changes, etc.

	//### Change default action ###
	function changeDefault(id) {
		var caller = document.getElementById(id.toString());
		window.battle.lock_action(caller, 1, 'magic', id);
		window.battle.set_hostile_subattack(id);
	}
	switch (settings.defaultAction) {
		//Default (Attack)
		case 0:
			break;
		case 1:
			//Fiery Blast
			changeDefault(111);
			break;
		case 2:
			//Freeze
			changeDefault(121);
			break;
		case 3:
			//Shockblast
			changeDefault(131);
			break;
		case 4:
			//Gale
			changeDefault(141);
			break;
		case 5:
			//Smite
			changeDefault(151);
			break;
		case 6:
			//Corruption
			changeDefault(161);
			break;
	}
	//### Change default action - end ###

	//### HV Counter Plus ###
	if (settings.counterPlus) {
		var record = localStorage.record ? JSON.parse(localStorage.record) : {
				'turns': 0,
				'time': 0,
				'EXP': 0,
				'Credits': 0
			},
			pop = document.getElementsByClassName('btcp')[0],
			set = function() {
				localStorage.setItem('record', JSON.stringify(record));
			},
			build = function(item, point) {
				record[item] = record[item] * 1 + point * 1;
			};

		if (!record.time) {
			build('time', Date.now());
			set();
		}
		if (pop) {
			var target, label, i = 0,
				text = document.querySelectorAll('#togpane_log .t3b'),
				turn = document.querySelector('#togpane_log .t1').textContent;
			build('turns', turn);
			while (i < text.length) {
				target = text[i].textContent;
				if (/Victorious.$|Fleeing.$/.test(target)) break;
				label = target.match(/(\d+) ([EC]\w+).$/);
				if (label) build(label[2], label[1]);
				i++;
			}
			if (pop.getElementsByTagName('img')[0]) set();
			else {
				var num = 0,
					runTime = Math.floor((Date.now() - record.time) / 1000),
					text = pop.getElementsByClassName('fd4'),
					len = text.length,
					result = pop.appendChild(document.createElement('div'));
				result.style.cssText = 'font-size:15px;font-weight:bold;margin-top:15px;';
				for (i = 0; i < len; i++) text[i].firstChild.style.marginTop = '-4px';
				pop.style.top = '23px';
				if (len > 2) pop.style.height = len > 3 ? '190px' : '170px';

				for (key in record) {
					var div = result.appendChild(document.createElement('div'));
					div.style.cssText = 'display:inline-block;margin-bottom:7px;';
					if (!(num % 2)) div.style.marginRight = '20px';
					if (key == 'time') {
						var hour = ('0' + Math.floor(runTime / 3600) % 100).slice(-2),
							min = ('0' + Math.floor(runTime / 60) % 60).slice(-2),
							sec = ('0' + runTime % 60).slice(-2);
						div.textContent = (hour != 0 ? hour + ' h ' : '') + (min != 0 ? min + ' m ' : '') + sec + ' s';
						result.appendChild(document.createElement('br'));
					} else {
						var total = record[key] + '';
						while (total != (total = total.replace(/^(\d+)(\d{3})/, '$1,$2')));
						div.textContent = total + ' ' + key.toLowerCase();
						if (!num) div.textContent += ' (' + ((Math.floor((record[key] / runTime) * 1000)) / 1000).toFixed(2) + ' t/s)';
					}
					num++;
				}
			}
		}
	}
	//### HV Counter Plus - end ###

	//### Effect duration ###
	//From HV Stats Slim
	if (settings.effectDurations) {
		var targets = document.querySelectorAll('img[onmouseover^="battle.set_infopane_effect"]'),
			i = targets.length;
		while (i--) {
			var duration = targets[i].getAttribute('onmouseover').match(/, ([-\d]+)\)/);
			if (!duration || duration < 0) duration = '-';
			else duration = duration[1];
			var div = targets[i].parentNode.insertBefore(document.createElement('div'), targets[i].nextSibling);
			div.appendChild(document.createElement('div')).innerHTML = duration;
			div.className = 'duration';
		}
	}
	//### Effect duration - end ###

	//### Show Gems script ###
	//Show an icon when possessing a gem, which can be clicked to use it.
	if (settings.gemIcon) {
		var gem = document.getElementById('ikey_p');
		var gem_icon = document.getElementById("gem_icon");
		if (gem && !gem_icon) {
			var icon;
			switch (gem.getAttribute('onmouseover').match(/'([^\s]+) Gem/)[1]) {
				case 'Mystic':
					icon = 'channeling.png';
					break;
				case 'Health':
					icon = 'healthpot.png';
					break;
				case 'Mana':
					icon = 'manapot.png';
					break;
				case 'Spirit':
					icon = 'spiritpot.png';
					break;
			};

			gem_icon = document.querySelector('.btp').appendChild(document.createElement('img'));
			//gem_icon.src = 'https://raw.github.com/greentea039/HVSTAT/5a7a1e09b8847394faacf0d4b1321d51cb96816f/css/images/' + icon;
			//gem_icon.src = icon;
			gem_icon.src = 'http://ehgt.org/v/e/' + icon;
			gem_icon.style.cssText = 'border: 1px solid black; position: absolute; float: right; right: 6px; top: 8px;';
			gem_icon.onclick = function() {
				window.battle.lock_action(gem, 1, 'items', 'ikey_p');
				window.battle.set_friendly_subattack('999');
				window.battle.touch_and_go();
				gem.remove();
				gem_icon.remove();
			}
			gem_icon.id = "gem_icon";
		} else if (!gem && gem_icon) {
			gem_icon.remove();
		}
	}
	//### Show Gems script - end ###

	//### custom MouseMelee script ###
	//Hover over monsters to attack. Stops on defined conditions.
	if (settings.mouseMelee) {
		function NoHoverClick() {
			var bars = document.getElementsByClassName("cwb2");
			var hp = bars[0].width / 120;
			var mp = bars[1].width / 120;
			var sp = bars[2].width / 120;
			//var oc = bars[3].width/120;
			var low_hp = (hp < settings.minHP);
			var low_mp = (mp < settings.minMP);
			var low_sp = (sp < settings.minSP);
			//var oc_full = (oc == 1);
			var bar_backs = document.getElementsByClassName("cwbdv");
			if (low_hp) bar_backs[0].setAttribute("style", "background-color:purple");
			if (low_mp) bar_backs[1].setAttribute("style", "background-color:purple");
			if (low_sp) bar_backs[2].setAttribute("style", "background-color:purple");
			var is_channeling = function() {
				if (!settings.stopWhenChanneling) return false;
				var status_icons = document.querySelectorAll('img[onmouseover^="battle.set_infopane_effect"]');
				for (var i = 0, len = status_icons.length; i < len; i++) {
					if (/\bchanneling\b/i.test(status_icons[i].onmouseover.toString())) {
						//var img = document.querySelector('.btp').appendChild(document.createElement('img'));
						//img.src = "http://ehgt.org/v/e/channeling.png";
						//img.style.cssText = 'border: 3px solid cyan; margin-right:2px; margin-left:2px;';
						return true;
					}
				}
				return false;
			};
			//return (low_hp || low_mp || low_sp || oc_full || is_channeling);
			return (low_hp || low_mp || low_sp || is_channeling());
		}

		var mpane = document.getElementById('monsterpane');
		if (mpane && !NoHoverClick()) {
			var m = mpane.getElementsByClassName("btm1");
			for (var i = 0; i < m.length; i++) {
				if (m[i].hasAttribute('onclick')) {
					m[i].setAttribute('onmouseover', m[i].getAttribute('onclick'));
				}
			}
		}
	}
	//### custom MouseMelee script - end ###
}

var replacements = '.cwbdv, .bte, #ckey_spirit, #ckey_defend, #togpane_magico, #togpane_magict, #togpane_item, #quickbar, #togpane_log';
var monsterReplacements = '#mkey_0, #mkey_1, #mkey_2, #mkey_3, #mkey_4, #mkey_5, #mkey_6, #mkey_7, #mkey_8, #mkey_9';
function SubmitAction() {
	//End of round, continue button pressed
	if (document.getElementById("battleaction").value == 0) {
		window.location.href = window.location.href;
		return;
	}

	//var loadStart = (new Date()).getTime();

	//Serialize the form data
	var inputs = document.getElementsByTagName("input");
	var serializedForm = "";
	for (var i = 0; i < inputs.length; i++) {
		if (i != 0)
			serializedForm += "&";
		serializedForm += inputs[i].id + "=" + inputs[i].value;
	}

	//Make the AJAX call
	var r = new XMLHttpRequest();
	r.open("POST", "", true);
	r.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
	r.responseType = 'document';
	r.onload = function() {
		if (r.status >= 200 && r.status < 400) {
			updatePage(r.response);
		}
	}
	r.send(serializedForm);

	// Selectively replace elements on the screen
	function updatePage(data) {
		//var loadEnd = (new Date()).getTime();
		//console.log("PostTime = " + (loadEnd - loadStart));

		// Handle simple replacements
		var existing = document.querySelectorAll(replacements);
		var newStuff = data.querySelectorAll(replacements);
		var i = existing.length;
		while (i--) {
			existing[i].parentNode.replaceChild(newStuff[i], existing[i]);
		}

		// Handle monster replacements (don't replace dead monsters)
		var existing = document.querySelectorAll(monsterReplacements);
		var newStuff = data.querySelectorAll(monsterReplacements);
		var i = existing.length;
		while (i--) {
			if (existing[i].hasAttribute("onclick") || newStuff[i].hasAttribute("onclick")) {
				existing[i].parentNode.replaceChild(newStuff[i], existing[i]);
			}
		}

		var popup = data.getElementsByClassName('btcp');
		var navbar = data.getElementById('navbar');
		if (navbar) {
			//Show navbar
			var mainpane = document.getElementById('mainpane');
			mainpane.parentNode.insertBefore(navbar, mainpane);
			window.at_attach("parent_Character", "child_Character", "hover", "y", "pointer");
			window.at_attach("parent_Bazaar", "child_Bazaar", "hover", "y", "pointer");
			window.at_attach("parent_Battle", "child_Battle", "hover", "y", "pointer");
			window.at_attach("parent_Forge", "child_Forge", "hover", "y", "pointer");
		}
		if (popup.length != 0) {
			if (!navbar) {
				//End of round
				if (settings.showPopup) {
					//Show popup
					var parent = document.getElementsByClassName('btt')[0];
					parent.insertBefore(popup[0], parent.firstChild);
				}
			} else {
				//End of battle serie
				//Show popup
				var parent = document.getElementsByClassName('btt')[0];
				parent.insertBefore(popup[0], parent.firstChild);
			}
		}

		// Do everything again
		//var swapEnd = (new Date()).getTime();
		//console.log("SwapTime = " + (swapEnd - loadEnd));
		OnPageReload();

		if ((popup.length != 0) || navbar) {
			//Reset the round counter
			sessionStorage.removeItem('rounds');
			if ((popup.length != 0) && !navbar) {
				//End of round
				if (settings.skipToNextRound) {
					//Auto-advance to next round
					if (settings.popupTime == 0) {
						window.location.href = window.location.href;
					} else {
						setTimeout(function() {
							window.location.href = window.location.href;
						}, settings.popupTime);
					}
				}
			} else {
				//End of battle serie
				//Remove the record of Counter Plus
				localStorage.removeItem('record');
			}
		}

		//var customEnd = (new Date()).getTime();
		//console.log("CustomTime = " + (customEnd - swapEnd));
		//console.log("TotalTime = " + (customEnd - loadStart));
	}

}

// Run this stuff after the page is loaded
addEventListener('DOMContentLoaded', OnPageLoad, false);
function OnPageLoad() {

	// TODO: One-time stuff that happens on page load should go here

	//Exit if not in a battle
	if (!document.getElementById('togpane_log')) {
		return;
	}

	//### Round counter ###
	if (settings.roundCounter) {
		var logs = document.querySelector('#togpane_log tr:nth-last-child(2)').textContent;
		if (/Round/.test(logs) && !sessionStorage.rounds) {
			var round = logs.match(/Round ([\d\s\/]+)/)[1];
			sessionStorage.setItem('rounds', round);
		} else {
			var round = sessionStorage.getItem('rounds') || undefined;
		}
		if (round !== undefined) {
			var x = document.getElementById('mainpane').appendChild(document.createElement('div'));
			x.id = 'round';
			x.innerHTML = round;
			var final = round.split('/');
			switch (final[1] - final[0]) {
				case 0:
					x.style.color = '#ff0000';
					break;
				case 1:
					x.style.color = '#ffcc99';
					break;
			}
		}
	}
	//### Round counter - end ###
	
	//Custom submit
	document.getElementById("battleform").submit = SubmitAction;

	OnPageReload();
}