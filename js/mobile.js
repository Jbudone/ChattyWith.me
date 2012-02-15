/*
TODO:
	* Determine Portrait/Landscape mode, and load stylesheet for that particular mode + auto fit to size
*/


var MOBI_VIEW_PORTRAIT=0x00;
var MOBI_VIEW_LANDSCAPE=0x01;

function mobileSetup() {
	// Event Triggers
	$(document).bind("orientationchange",function(){
		mobi_loadViewMode(mobi_getViewMode());
		mobi_fitView();
		mobi_adjustChan_valign();
	}).trigger("orientationchange").bind("tap",function(){
		//window.scrollTo(0,1);
		$('header').removeClass('out').removeClass('reverse').removeClass('fixed-overlay');
		mobi_fitView();
		mobi_adjustChan_valign();
	}).bind("click",function(){
		$(document).trigger("tap");
	});
	
	
	
	$("#chaninfo #chansettings input[type='checkbox']").each( function(){ $(this).checkboxradio(); });
	/*
		Event Triggers
			Channel Switchers
	*/
	$('#chanPrev').bind('tap',function(){ mobi_slideChannel(mobi_getChanIDFromOffset(Terminal.curChanID, -1),-1); });
	$('#chanNext').bind('tap',function(){ mobi_slideChannel(mobi_getChanIDFromOffset(Terminal.curChanID, 1),1); });
	$('#chanHome').bind('tap',function(){ mobi_slideChannel(0,1); });
	
	// Finish touches on widgets
	
	// Load autocomplete
	//mobi_setupAutocomplete();
	
	// Inject code into Terminal
	
	// Modify windows (emoticons, colours)
	
	// Setup other pages (settings, users, chanlist)
}

function mobi_adjustChan_valign() {
	//var top=$('section').height()-$('channel.open').height();
	//$('channel.open').css({top:top});
}

function mobi_fitView() {
	// TRY: $.mobile.getScreenHeight()
	
	//height=$('body').height-($('header').height()+$('footer').height());
	//$('.console').css({'min-height':height});
	
	
	//$.mobile.addResolutionBreakpoints($(document).width());	
}


function mobi_loadViewMode(mode) {
	file=(mode==MOBI_VIEW_PORTRAIT?'mobiPortrait.css':'mobiLandscape.css');
	$('head link[name="mobiviewmode"]').remove();
	$('<link/>').attr('name','mobiviewmode').attr('href','styles/'+file).attr('type','text/css').attr('rel','stylesheet').appendTo('head');
}

// mobi_getViewMode
//	Returns 'portrait' for portrait, and 'landscape' for landscape mode
function mobi_getViewMode() {
	if (document.width>document.height)
		return MOBI_VIEW_LANDSCAPE;
	else
		return MOBI_VIEW_PORTRAIT;
}


// mobi_slideChannel
//	To add to the effect of sliding between channels
//		offsetIndex: How many index-spaces away from current channel
var mobi_SlidingChannel=false;
function mobi_slideChannel(newChanID,direction) {
	if (mobi_SlidingChannel)
		return;
	var curChanID=Terminal.curChanID;
	if (curChanID==newChanID)
		return;
	mobi_SlidingChannel=true;
	
	
	// Prepare the contents [container=(max width*2) ; channel 1 & 2=max width + float left ; add channel 2 to container]
	var maxWidth=document.width;
	var iOffscreen=-maxWidth;
	var lSection=$('section');
	var lHidden=$('#console-hidden');
	var lCurChan=$('#chan'+curChanID);
	var lNewChan=$('#chan'+newChanID);
	var lMovable=lCurChan;
	lSection.css({width:(maxWidth*2)+'px !important'});
	lCurChan.css({width:maxWidth+'px',float:'left'});
	lNewChan.css({width:maxWidth+'px',display:'block',float:'left'});
	if (direction>0)
		lNewChan.remove().appendTo(lSection);
	else {
		lNewChan.remove().prependTo(lSection).css({'margin-left':-maxWidth});
		iOffscreen=0;
		lMovable=lNewChan;
	}
	
	
	// Animate the slide effect [ channel 1 - margin-left=-1000px ]
	lMovable.animate({ 'margin-left':iOffscreen }, 450, 'linear', function(){
	
		// Toss channel 1 into hidden channel
		lCurChan.remove().appendTo(lHidden).css({display:'none','margin-left':'',float:''});
		lSection.css({width:''});
		lNewChan.css({width:'',display:'block',float:'','margin-left':''});
	
		// Trigger mobi_setupChanInfo(), and set Terminal.curChanID
		Terminal.curChanID=newChanID;
		Terminal.channels[newChanID].loadTopic();
		if (newChanID!=0)
			mobi_setupChanInfo(Terminal.channels[newChanID]);
		mobi_SlidingChannel=false;
	});
}


// mobi_getChanIDFromOffset
//	Retrieve the channel ID based off the offset from Terminal.channels[curChanID]
function mobi_getChanIDFromOffset(startID,offset) {
	if (offset==0)
		return startID;
	if (offset<0) {
		return mobi_getChanIDFromOffset(startID,mobi_getNumberOfChannels()+offset);
	}
	var begin=false;
	var iOffset=offset;
	var firstElement=null;
	for (var id in Terminal.channels) {
		if (firstElement==null)
			firstElement=id;
		if (startID==id) {
			begin=true;	
			continue;
		}
		if (begin && --iOffset==0)
			return id;
	}
	return mobi_getChanIDFromOffset(firstElement,iOffset-1);
}

function mobi_getNumberOfChannels() {
	var size=0;
	for (var i in Terminal.channels) {
		size++;	
	}
	return size;
}

function mobi_setupAutocomplete() {
	
	$(function() {
		var availableTags = [
			"ActionScript",
			"AppleScript",
			"Asp",
			"BASIC",
			"C",
			"C++",
			"Clojure",
			"COBOL",
			"ColdFusion",
			"Erlang",
			"Fortran",
			"Groovy",
			"Haskell",
			"Java",
			"JavaScript",
			"Lisp",
			"Perl",
			"PHP",
			"Python",
			"Ruby",
			"Scala",
			"Scheme"
		];
		
		var minLen=3;
		Terminal.prompt.autocomplete({
			minLength:minLen,
			source: availableTags,
			position: { my : "left bottom", at: "left top" } ,
			search: function() {
					// custom minLength
					var term = (this.value.split( /[ \b\t\n\r]+/ )).pop();
					if ( term.length < minLen ) {
						return false;
					}
			},
			select: function( event, ui ) {
					this.value+=ui.item.value;
					return false;
			}
		}).autocomplete('enable');
	});
}


function mobi_setupChanInfo(channel) {
	var opstatus=channel.getOpStatus();
	
	// Set ChanInfo
	$('#chaninfo #chansettings #topic').val(channel.topic);
	//$('#chaninfo #chansettings #private').attr("checked",channel.private).checkboxradio("refresh");
	
	
	// Enable/Disable Operator Functionality
	if (opstatus=='operator') {
		$("#chaninfo #chansettings input[type='checkbox']").each( function(){ $(this).checkboxradio('enable'); });
	} else {
		$("#chaninfo #chansettings input[type='checkbox']").each( function(){ $(this).checkboxradio('disable'); });
	}
	
	// Determine operator status (hide certain parts)
	
	// Load Settings (topic/options)
	
	// Load Users
}

/*
Min delay for a melee weapon is min(7, floor(base delay / 2)), or 5 for a sabre. To achieve min delay, you need your weapon skill to be at least max(base delay, 2*base delay - 14), plus 1 if odd, or 14 skill for a sabre.
	
	trident[1/1]: A hafted weapon with three points at one end. (Hand-and-a-half medium Polearm; Dam 10 Acc +3 Delay 13)
	
	 ktgrey: trident should have min delay 6, so you need (13-6)*2 or 14 polearms skill for min delay
(6:13:32 PM) ktgrey: ignore stealth/throwing/stabbin

ou can also try mibe, which is the same thing except axes instead of polearms and armor except for dodging

 ktgrey: oh and always use a shield unless you have a 2h weapon
 but demon trident + shield is probably better than bardiche
 */