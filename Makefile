
all: collected
	minify --type js collected > all

collected: *.js main
	cat *.js main > collected

#
