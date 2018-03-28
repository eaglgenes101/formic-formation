
all: collected debug
	minify --type js collected > all

collected: noprint commons patterns *.js main
	cat noprint commons patterns *.js main > for_release

debug: print commons patterns *.js main
	cat print commons patterns *.js main > for_debug
