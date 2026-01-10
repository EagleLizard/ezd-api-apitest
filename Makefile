
run:
	rm -rf ./dist; tsc; node dist/main.js
watch:
	fswatch -ro ./src | xargs -n1 -I{} make run
