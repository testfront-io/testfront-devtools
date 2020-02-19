# testfront-devtools

The easiest way to use this is to get it from the <a href='https://chrome.google.com/webstore/detail/jjeedhjoocnngookmbfmjflefjddocdl' target='_blank' rel='noopener noreferrer'>Chrome Web Store</a>.

After installation, open your web browser's developer tools and you'll see a new tab at the top called "TestFront".

You can use TestFront DevTools with any web page using local storage mode, but if you're using it to test your own application(s), you should commit your tests to your project's repository by installing `testfront-cli` with the following:
```
npm i testfront-cli --save-dev
```

After installation, a `testfront` entry will be automatically added to your package's `scripts`.

You can then start the TestFront DevTools server within your project directory:
```
npm run testfront devtools-server
```

Your tests and configuration will be written to a `__testfront__` directory as you use TestFront DevTools.

See the [TestFront CLI](https://github.com/testfront-io/testfront-cli) repository for more information.


## Custom Builds and Manual Installation

Want to create your own build? TestFront DevTools is a React application built with [`create-react-app`](https://create-react-app.dev/). It also uses the same components and architecture as TestFront's [Starter Kit App](https://github.com/testfront-io/starter-kit-app).

To build your own version of TestFront DevTools and install it manually:

Clone this repository:
```
git clone https://github.com/testfront-io/testfront-devtools.git
```

NPM install:
```
cd testfront-devtools
npm i
```

Customize it if you want, then build it:
```
npm run build
```

Finally, to use the extension within your web browser, go to your browser's extensions page and enable developer mode, then load the unpacked extension by selecting the `testfront-devtools` directory.

If you change any of the top level scripts (e.g., `content.js`), you will need to reload the extension via your browser's extensions page for your changes to take effect. Otherwise, if you are only changing the React app (the devtools tab), you only need to run `npm run build` then refresh the page contained within the devtools tab. You can do this by right-clicking the page within the devtools tab and selecting "Reload Frame".
