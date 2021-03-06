
all: for_release for_debug

for_release: collected
	minify --type js collected > for_release

collected: noprint commons patterns saboteur *.js main releasefooter
	cat noprint commons patterns saboteur *.js main releasefooter > collected

for_debug: print commons patterns saboteur *.js main debugfooter
	cat print commons patterns saboteur *.js main debugfooter > for_debug
