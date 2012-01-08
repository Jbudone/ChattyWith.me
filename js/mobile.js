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
		
		$(function(){
			//Terminal.print("Tap Tap");
		});
	}).bind("click",function(){
		$(document).trigger("tap");
	});
	
	$.getJSON('system/requests.json.php',{request:'status'},function(data){ console.log("ABCDE WOO"); });
	
	/*
		Event Triggers
			swipeLeft/swipeRight(change channel left/right)
	*/
	
	// Finish touches on widgets
	
	// Load autocomplete
	
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
	
	
	$.mobile.addResolutionBreakpoints($(document).width());	
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




	

	/*$(function() {
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
		
		Terminal.prompt.autocomplete({
			source: availableTags,
			position: { my : "left bottom", at: "left top" } 
		}).autocomplete('enable');
	});*/
	