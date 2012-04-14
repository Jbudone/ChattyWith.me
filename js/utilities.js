// JavaScript Document



var getChanIDFromOffset=function(offset) {
	if (offset==0)
		return client.activeChanRef.chanid;
		
	var chanlist=[];
	for (var chanid in client.channels) {
		chanlist.push(client.channels[chanid].chanid);
	}
	var iPos=chanlist.indexOf(client.activeChanRef.chanid);
	iPos+=offset;
	if (iPos>=chanlist.length)
		iPos=0;
	else if (iPos<0)
		iPos=chanlist.length-1;
	return chanlist[iPos];
};