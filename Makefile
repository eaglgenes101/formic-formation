
all: collected
	minify --type js collected > all

collected: *.js
	cat *.js > collected

#
