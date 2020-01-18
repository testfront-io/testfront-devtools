# testfront-devtools

The easiest way to use this is to get it from the <a href='https://chrome.google.com/webstore/category/extensions' target='_blank' rel='noopener noreferrer'>Chrome Web Store</a>.

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
