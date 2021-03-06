# oop-calc #

Simple application to calculate the cost of family court proceedings for various personas across Canada.

## Technologies
- Runtime: Node.js
- Framework: Express.js
- Templating: Handlebars
- Styles: SASS (.scss)

Server-side code is very minimal. There's one route for parsing the data files and returning the result, and another for returning the index page.

The rest of the app runs client-side and should be fairly self-explanatory.

## Requirements
1. Node.js 8.x (8.9.4 is a good choice)

## Development 
1. Clone this repo
2. `cd /path/to/repo && npm install`
3. `DEBUG=myapp:* npm start`. This will launch the dev server. Livereload isn't configured, so you'll need to manually restart the server whenever you make changes to templates or server code.

## Data
The data can be updated by replacing the `.csv` files in the `/data/` dir with new files. NB: These files MUST have the same headers and values must be of the same type (eg. Boolean, Number, String, etc). If you begin to notice anomalous results, check the data first.

The data structure is as follows:

...

## Testing
`npm test` will run the tests in the terminal using `mocha-chrome`.

To add new test files, create a js file in the `test` dir and make sure to include it with a `script` tag in `test.html`. That's it.

## Deployment
This app can be deployed to any environment that supports Node.js 8.x or greater. It certainly works well with Ubuntu 16.x (Xenial), using any number of application runners (eg. Phusion Passeger, PM2, etc.)

## TODO
1. More test coverage
2. Replace `node-sass-middleware` with `gulp-sass` or something like that, to remove insecure `hoek` dependency. 
3. A cleaner interface
4. Add build phase so that we can use `import { foo } from 'bar'` syntax. This should make client-side code easier to read and maintain. Would also help to have live reload capability included that reruns tests on change.
