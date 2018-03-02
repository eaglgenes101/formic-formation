
all: collected debug
	minify --type js collected > all

collected: noprint commons *.js main
	cat noprint commons *.js main > for_release

debug: print commons *.js main
	cat print commons *.js main > for_debug
