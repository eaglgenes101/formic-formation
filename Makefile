
all: collected debug
	minify --type js collected > all

collected: noprint commons patterns *.js main releasefooter
	cat noprint commons patterns *.js main releasefooter > for_release

debug: print commons patterns *.js main debugfooter
	cat print commons patterns *.js main debugfooter > for_debug
