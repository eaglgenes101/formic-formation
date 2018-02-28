
all: collected
	minify --type js collected > all

collected: commons *.js main
	cat commons *.js main > collected

#
